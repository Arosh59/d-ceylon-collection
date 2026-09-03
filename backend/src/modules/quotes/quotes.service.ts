import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { TravelPlanningService } from "../travel-planning/travel-planning.service";
interface QuoteRow {
  id: string;
  requestId: string;
  customerId: string;
  organisationId: string | null;
  status: string;
  currency: string | null;
  draftAssumptions: string[];
  draftInclusions: string[];
  draftExclusions: string[];
  draftTerms: string | null;
  internalNotes: string | null;
  currentVersionNumber: number;
  currentVersionId: string | null;
  currentExpiresAtUtc: Date | null;
  concurrencyToken: string;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}
@Injectable()
export class QuotesService {
  public constructor(
    private readonly db: DatabaseService,
    private readonly plans: TravelPlanningService,
  ) {}
  public async customerList(customer: string, q: PageQuery) {
    await this.expire(Prisma.sql`customer_id=${customer}::uuid`);
    return this.list(Prisma.sql`q.customer_id=${customer}::uuid`, q, false);
  }
  public async agentList(org: string, q: PageQuery) {
    await this.activeOrg(org);
    await this.expire(Prisma.sql`organisation_id=${org}::uuid`);
    return this.list(
      Prisma.sql`(q.organisation_id IS NULL OR q.organisation_id=${org}::uuid)`,
      q,
      true,
    );
  }
  public async customerGet(customer: string, id: string) {
    await this.expire(Prisma.sql`id=${id}::uuid AND customer_id=${customer}::uuid`);
    return this.load(customer, id, "customer");
  }
  public async agentGet(org: string, id: string) {
    await this.activeOrg(org);
    await this.expire(Prisma.sql`id=${id}::uuid AND organisation_id=${org}::uuid`);
    return this.load(org, id, "agent");
  }
  public async request(customer: string, b: Record<string, unknown>) {
    const planId = uuid(b.travelPlanId, "travelPlanId"),
      revisionId = uuid(b.itineraryRevisionId, "itineraryRevisionId"),
      source = await this.plans.quoteSource(customer, planId, revisionId);
    if (!source)
      throw new DomainError(
        404,
        "The reviewed current itinerary draft was not found.",
        "Not Found",
      );
    const exists = await this.db.rows<{ ok: boolean }>(
      Prisma.sql`SELECT EXISTS(SELECT 1 FROM quotes.quote_requests WHERE customer_id=${customer}::uuid AND itinerary_revision_id=${revisionId}::uuid) AS ok`,
    );
    if (exists[0]?.ok)
      throw conflict("A quote has already been requested for this itinerary revision.");
    const requestId = randomUUID(),
      quoteId = randomUUID(),
      now = new Date();
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO quotes.quote_requests(id,customer_id,travel_plan_id,itinerary_revision_id,itinerary_revision_number,itinerary_title,travel_start_date,travel_end_date,rule_version,itinerary_fingerprint,customer_notes,created_at_utc,updated_at_utc,concurrency_token) VALUES(${requestId}::uuid,${customer}::uuid,${planId}::uuid,${revisionId}::uuid,${source.revisionNumber as number},${source.title as string},${source.travelStartDate as string}::date,${source.travelEndDate as string}::date,${source.ruleVersion as string},${source.inputFingerprint as string},${optional(b.customerNotes, 2000)},${now},${now},${randomUUID()}::uuid)`;
      await tx.$executeRaw`INSERT INTO quotes.quotes(id,request_id,customer_id,organisation_id,status,currency,draft_assumptions,draft_inclusions,draft_exclusions,draft_terms,internal_notes,current_version_number,current_version_id,current_expires_at_utc,created_at_utc,updated_at_utc,concurrency_token) VALUES(${quoteId}::uuid,${requestId}::uuid,${customer}::uuid,NULL,'draft',NULL,ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::text[],NULL,NULL,0,NULL,NULL,${now},${now},${randomUUID()}::uuid)`;
    });
    return this.customerGet(customer, quoteId);
  }
  public async customerTransition(
    customer: string,
    id: string,
    action: "accept" | "decline" | "withdraw",
    b: Record<string, unknown>,
  ) {
    const quote = await this.quote(customer, id, "customer");
    this.version(quote, b.concurrencyToken);
    if (action !== "withdraw") {
      if (quote.status !== "sent")
        throw transition(`The quote cannot be changed while it is ${quote.status}.`);
      const versionId = uuid(b.versionId, "versionId");
      if (versionId !== quote.currentVersionId)
        throw conflict("The quote version is no longer current.");
      if (quote.currentExpiresAtUtc && quote.currentExpiresAtUtc <= new Date())
        throw transition("The quote has expired.");
    } else {
      if (quote.status === "accepted") throw transition("An accepted quote cannot be withdrawn.");
      if (quote.status === "withdrawn") throw transition("The quote is already withdrawn.");
    }
    const status =
      action === "withdraw" ? "withdrawn" : action === "accept" ? "accepted" : "declined";
    await this.updateStatus(quote, status);
    return this.customerGet(customer, id);
  }
  public async agentMutation(
    org: string,
    id: string,
    action: "prepare" | "draft" | "send" | "revise" | "withdraw",
    b: Record<string, unknown>,
  ) {
    await this.activeOrg(org);
    if (action === "prepare") {
      const quote = await this.quote(org, id, "agent-unassigned");
      this.version(quote, b.concurrencyToken);
      if (quote.status !== "draft")
        throw transition(`The quote cannot be changed while it is ${quote.status}.`);
      if (quote.organisationId) throw conflict("The quote request is already assigned.");
      const currency = currencyValue(b.currency);
      const changed = await this.db
        .$executeRaw`UPDATE quotes.quotes SET organisation_id=${org}::uuid,currency=${currency},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE id=${id}::uuid AND concurrency_token=${quote.concurrencyToken}::uuid`;
      if (changed !== 1) throw conflict("The quote changed. Reload and retry.");
      return this.agentGet(org, id);
    }
    const quote = await this.quote(org, id, "agent");
    this.version(quote, b.concurrencyToken);
    if (action === "draft") await this.draft(quote, b);
    else if (action === "send") await this.send(quote, b);
    else if (action === "revise") {
      if (!["sent", "declined", "expired"].includes(quote.status))
        throw transition("Only a sent, declined, or expired quote can be revised.");
      const changed = await this.db
        .$executeRaw`UPDATE quotes.quotes SET status='draft',current_expires_at_utc=NULL,updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE id=${quote.id}::uuid AND concurrency_token=${quote.concurrencyToken}::uuid`;
      if (changed !== 1) throw conflict("The quote changed. Reload and retry.");
    } else {
      if (quote.status === "accepted") throw transition("An accepted quote cannot be withdrawn.");
      if (quote.status === "withdrawn") throw transition("The quote is already withdrawn.");
      await this.updateStatus(quote, "withdrawn");
    }
    return this.agentGet(org, id);
  }
  public async acceptedSource(
    customer: string,
    quoteId: string,
    versionId: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT q.id AS "quoteId",v.id AS "quoteVersionId",q.customer_id AS "customerId",q.organisation_id AS "organisationId",v.currency,v.subtotal,v.tax_total AS "taxTotal",v.adjustment_total AS "adjustmentTotal",v.grand_total AS "grandTotal",r.itinerary_title AS "itineraryTitle",to_char(r.travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(r.travel_end_date,'YYYY-MM-DD') AS "travelEndDate" FROM quotes.quotes q JOIN quotes.quote_requests r ON r.id=q.request_id JOIN quotes.quote_versions v ON v.id=q.current_version_id WHERE q.id=${quoteId}::uuid AND q.customer_id=${customer}::uuid AND q.status='accepted' AND v.id=${versionId}::uuid`,
    );
    if (!rows[0]) return null;
    rows[0].lines = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT position,title,description,quantity,unit_amount AS "unitAmount",line_total AS "lineTotal" FROM quotes.quote_version_lines WHERE quote_version_id=${versionId}::uuid ORDER BY position`,
    );
    return apiValue(rows[0]);
  }
  private async list(where: Prisma.Sql, q: PageQuery, agent: boolean) {
    const p = pagination(q);
    const [counts, items] = await Promise.all([
      this.db.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM quotes.quotes q WHERE ${where}`,
      ),
      this.db.rows<Record<string, unknown>>(
        Prisma.sql`SELECT q.id,r.itinerary_title AS "itineraryTitle",to_char(r.travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(r.travel_end_date,'YYYY-MM-DD') AS "travelEndDate",q.status,${agent ? Prisma.sql`q.organisation_id IS NULL AS "isUnassigned",` : Prisma.empty}q.current_version_number AS "currentVersionNumber",v.currency,v.grand_total AS "grandTotal",${agent ? Prisma.empty : Prisma.sql`v.expires_at_utc AS "expiresAtUtc",`}q.concurrency_token AS "concurrencyToken",q.updated_at_utc AS "updatedAtUtc" FROM quotes.quotes q JOIN quotes.quote_requests r ON r.id=q.request_id LEFT JOIN quotes.quote_versions v ON v.id=q.current_version_id WHERE ${where} ORDER BY ${agent ? Prisma.sql`CASE WHEN q.organisation_id IS NULL THEN 0 ELSE 1 END,` : Prisma.empty}q.updated_at_utc DESC OFFSET ${p.skip} LIMIT ${p.pageSize}`,
      ),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }
  private async load(owner: string, id: string, scope: "agent" | "customer") {
    requireUuid(id, "quoteId");
    const quote = await this.quote(owner, id, scope);
    const req = (
      await this.db.rows<Record<string, unknown>>(
        Prisma.sql`SELECT id,travel_plan_id AS "travelPlanId",itinerary_revision_id AS "itineraryRevisionId",itinerary_revision_number AS "itineraryRevisionNumber",itinerary_title AS "itineraryTitle",to_char(travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(travel_end_date,'YYYY-MM-DD') AS "travelEndDate",rule_version AS "ruleVersion",itinerary_fingerprint AS "itineraryFingerprint",customer_notes AS "customerNotes",created_at_utc AS "requestedAtUtc" FROM quotes.quote_requests WHERE id=${quote.requestId}::uuid`,
      )
    )[0]!;
    const versions = await this.versions(id);
    const base = {
      id: quote.id,
      status: quote.status,
      request: req,
      organisationId: quote.organisationId,
      currentVersionId: quote.currentVersionId,
      versions,
      concurrencyToken: quote.concurrencyToken,
      createdAtUtc: quote.createdAtUtc,
      updatedAtUtc: quote.updatedAtUtc,
    };
    if (scope === "customer") return apiValue(base);
    const [lines, components] = await Promise.all([
      this.draftLines(id, quote.currency ?? "USD"),
      this.draftComponents(id, quote.currency ?? "USD"),
    ]);
    const totals = lines.length
      ? calculate(
          lines.map((x) => ({
            quantity: Number((x as Record<string, unknown>).quantity),
            unitAmount: Number((x.unitPrice as { amount: number }).amount),
          })),
          components.map((x) => ({
            kind: String((x as Record<string, unknown>).kind),
            amount: Number((x.amount as { amount: number }).amount),
          })),
        )
      : null;
    const money = (n: number | null) =>
      n === null || !quote.currency ? null : { amount: n, currency: quote.currency };
    return apiValue({
      ...base,
      organisationId: quote.organisationId,
      draft: {
        currency: quote.currency,
        assumptions: quote.draftAssumptions,
        inclusions: quote.draftInclusions,
        exclusions: quote.draftExclusions,
        terms: quote.draftTerms,
        internalNotes: quote.internalNotes,
        lines,
        components,
        subtotal: money(totals?.subtotal ?? null),
        taxTotal: money(totals?.taxTotal ?? null),
        adjustmentTotal: money(totals?.adjustmentTotal ?? null),
        grandTotal: money(totals?.grandTotal ?? null),
      },
    });
  }
  private async quote(
    owner: string,
    id: string,
    scope: "agent" | "agent-unassigned" | "customer",
  ): Promise<QuoteRow> {
    requireUuid(id, "quoteId");
    const condition =
      scope === "customer"
        ? Prisma.sql`customer_id=${owner}::uuid`
        : scope === "agent"
          ? Prisma.sql`organisation_id=${owner}::uuid`
          : Prisma.sql`(organisation_id IS NULL OR organisation_id=${owner}::uuid)`;
    const rows = await this.db.rows<QuoteRow>(
      Prisma.sql`SELECT id,request_id AS "requestId",customer_id AS "customerId",organisation_id AS "organisationId",status,currency,draft_assumptions AS "draftAssumptions",draft_inclusions AS "draftInclusions",draft_exclusions AS "draftExclusions",draft_terms AS "draftTerms",internal_notes AS "internalNotes",current_version_number AS "currentVersionNumber",current_version_id AS "currentVersionId",current_expires_at_utc AS "currentExpiresAtUtc",concurrency_token AS "concurrencyToken",created_at_utc AS "createdAtUtc",updated_at_utc AS "updatedAtUtc" FROM quotes.quotes WHERE id=${id}::uuid AND ${condition} LIMIT 1`,
    );
    if (!rows[0]) throw notFound();
    return rows[0];
  }
  private async draft(quote: QuoteRow, b: Record<string, unknown>) {
    if (quote.status !== "draft")
      throw transition(`The quote cannot be changed while it is ${quote.status}.`);
    const currency = currencyValue(b.currency),
      lines = array(b.lines),
      components = array(b.components);
    if (lines.length < 1 || lines.length > 100)
      throw validation("A quote requires 1 to 100 line items.");
    if (components.length > 50) throw validation("A quote supports at most 50 price components.");
    const cleanLines = lines.map((x, i) => line(x, i)),
      cleanComponents = components.map((x, i) => component(x, i));
    calculate(cleanLines, cleanComponents);
    const assumptions = textList(b.assumptions),
      inclusions = textList(b.inclusions),
      exclusions = textList(b.exclusions),
      terms = required(b.terms, "terms", 5000),
      now = new Date();
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM quotes.quote_draft_lines WHERE quote_id=${quote.id}::uuid`;
      await tx.$executeRaw`DELETE FROM quotes.quote_draft_price_components WHERE quote_id=${quote.id}::uuid`;
      for (const [i, x] of cleanLines.entries())
        await tx.$executeRaw`INSERT INTO quotes.quote_draft_lines(id,quote_id,position,title,description,quantity,unit_amount,created_at_utc,updated_at_utc,concurrency_token) VALUES(${randomUUID()}::uuid,${quote.id}::uuid,${i + 1},${x.title},${x.description},${x.quantity},${x.unitAmount},${now},${now},${randomUUID()}::uuid)`;
      for (const [i, x] of cleanComponents.entries())
        await tx.$executeRaw`INSERT INTO quotes.quote_draft_price_components(id,quote_id,position,kind,label,amount,created_at_utc,updated_at_utc,concurrency_token) VALUES(${randomUUID()}::uuid,${quote.id}::uuid,${i + 1},${x.kind},${x.label},${x.amount},${now},${now},${randomUUID()}::uuid)`;
      const changed =
        await tx.$executeRaw`UPDATE quotes.quotes SET currency=${currency},draft_assumptions=${assumptions},draft_inclusions=${inclusions},draft_exclusions=${exclusions},draft_terms=${terms},internal_notes=${optional(b.internalNotes, 2000)},updated_at_utc=${now},concurrency_token=${randomUUID()}::uuid WHERE id=${quote.id}::uuid AND concurrency_token=${quote.concurrencyToken}::uuid`;
      if (changed !== 1) throw conflict("The quote changed. Reload and retry.");
    });
  }
  private async send(q: QuoteRow, b: Record<string, unknown>) {
    if (q.status !== "draft")
      throw transition(`The quote cannot be changed while it is ${q.status}.`);
    if (!q.currency || !q.draftTerms) throw transition("The quote draft is incomplete.");
    const expires = new Date(String(b.expiresAtUtc ?? "")),
      now = new Date();
    if (
      !Number.isFinite(expires.valueOf()) ||
      expires <= now ||
      expires > new Date(now.valueOf() + 180 * 86400000)
    )
      throw transition("Quote expiry must be in the future and no more than 180 days away.");
    const rawLines = await this.db.rows<{
        id: string;
        position: number;
        title: string;
        description: string | null;
        quantity: Prisma.Decimal;
        unitAmount: Prisma.Decimal;
      }>(
        Prisma.sql`SELECT id,position,title,description,quantity,unit_amount AS "unitAmount" FROM quotes.quote_draft_lines WHERE quote_id=${q.id}::uuid ORDER BY position`,
      ),
      rawComps = await this.db.rows<{
        id: string;
        position: number;
        kind: string;
        label: string;
        amount: Prisma.Decimal;
      }>(
        Prisma.sql`SELECT id,position,kind,label,amount FROM quotes.quote_draft_price_components WHERE quote_id=${q.id}::uuid ORDER BY position`,
      );
    if (!rawLines.length) throw transition("A quote requires at least one draft line.");
    const totals = calculate(
        rawLines.map((x) => ({ quantity: Number(x.quantity), unitAmount: Number(x.unitAmount) })),
        rawComps.map((x) => ({ kind: x.kind, amount: Number(x.amount) })),
      ),
      versionId = randomUUID(),
      number = q.currentVersionNumber + 1;
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO quotes.quote_versions(id,quote_id,version_number,currency,sent_at_utc,expires_at_utc,created_by_subject,subtotal,tax_total,adjustment_total,grand_total,assumptions,inclusions,exclusions,terms,created_at_utc,updated_at_utc,concurrency_token) VALUES(${versionId}::uuid,${q.id}::uuid,${number},${q.currency},${now},${expires},${String(b.subject)},${totals.subtotal},${totals.taxTotal},${totals.adjustmentTotal},${totals.grandTotal},${q.draftAssumptions},${q.draftInclusions},${q.draftExclusions},${q.draftTerms},${now},${now},${randomUUID()}::uuid)`;
      for (const x of rawLines)
        await tx.$executeRaw`INSERT INTO quotes.quote_version_lines(id,quote_version_id,position,title,description,quantity,unit_amount,line_total) VALUES(${randomUUID()}::uuid,${versionId}::uuid,${x.position},${x.title},${x.description},${x.quantity},${x.unitAmount},${round(Number(x.quantity) * Number(x.unitAmount))})`;
      for (const x of rawComps)
        await tx.$executeRaw`INSERT INTO quotes.quote_version_price_components(id,quote_version_id,position,kind,label,amount) VALUES(${randomUUID()}::uuid,${versionId}::uuid,${x.position},${x.kind},${x.label},${x.amount})`;
      const changed =
        await tx.$executeRaw`UPDATE quotes.quotes SET status='sent',current_version_number=${number},current_version_id=${versionId}::uuid,current_expires_at_utc=${expires},updated_at_utc=${now},concurrency_token=${randomUUID()}::uuid WHERE id=${q.id}::uuid AND concurrency_token=${q.concurrencyToken}::uuid`;
      if (changed !== 1) throw conflict("The quote changed. Reload and retry.");
    });
  }
  private async versions(quoteId: string) {
    const versions = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT id,version_number AS "versionNumber",sent_at_utc AS "sentAtUtc",expires_at_utc AS "expiresAtUtc",currency,subtotal,tax_total AS "taxTotal",adjustment_total AS "adjustmentTotal",grand_total AS "grandTotal",assumptions,inclusions,exclusions,terms FROM quotes.quote_versions WHERE quote_id=${quoteId}::uuid ORDER BY version_number`,
    );
    for (const v of versions) {
      const currency = String(v.currency);
      v.subtotal = { amount: v.subtotal, currency };
      v.taxTotal = { amount: v.taxTotal, currency };
      v.adjustmentTotal = { amount: v.adjustmentTotal, currency };
      v.grandTotal = { amount: v.grandTotal, currency };
      v.lines = await this.versionLines(String(v.id), currency);
      v.components = await this.versionComponents(String(v.id), currency);
    }
    return apiValue(versions);
  }
  private async draftLines(id: string, currency: string) {
    const rows = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT id,position,title,description,quantity,unit_amount AS "unitAmount" FROM quotes.quote_draft_lines WHERE quote_id=${id}::uuid ORDER BY position`,
    );
    return apiValue(
      rows.map((x) => ({
        ...x,
        unitPrice: { amount: x.unitAmount, currency },
        lineTotal: { amount: round(Number(x.quantity) * Number(x.unitAmount)), currency },
      })),
    );
  }
  private async draftComponents(id: string, currency: string) {
    const rows = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT id,position,kind,label,amount FROM quotes.quote_draft_price_components WHERE quote_id=${id}::uuid ORDER BY position`,
    );
    return apiValue(rows.map((x) => ({ ...x, amount: { amount: x.amount, currency } })));
  }
  private async versionLines(id: string, currency: string) {
    const rows = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT id,position,title,description,quantity,unit_amount AS "unitAmount",line_total AS "lineTotal" FROM quotes.quote_version_lines WHERE quote_version_id=${id}::uuid ORDER BY position`,
    );
    return apiValue(
      rows.map((x) => ({
        ...x,
        unitPrice: { amount: x.unitAmount, currency },
        lineTotal: { amount: x.lineTotal, currency },
      })),
    );
  }
  private async versionComponents(id: string, currency: string) {
    const rows = await this.db.rows<Record<string, unknown>>(
      Prisma.sql`SELECT id,position,kind,label,amount FROM quotes.quote_version_price_components WHERE quote_version_id=${id}::uuid ORDER BY position`,
    );
    return apiValue(rows.map((x) => ({ ...x, amount: { amount: x.amount, currency } })));
  }
  private version(q: QuoteRow, v: unknown) {
    if (q.concurrencyToken !== uuid(v, "concurrencyToken"))
      throw conflict("The quote changed. Reload and retry.");
  }
  private async updateStatus(q: QuoteRow, status: string) {
    const changed = await this.db
      .$executeRaw`UPDATE quotes.quotes SET status=${status},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE id=${q.id}::uuid AND concurrency_token=${q.concurrencyToken}::uuid`;
    if (changed !== 1) throw conflict("The quote changed. Reload and retry.");
  }
  private async activeOrg(id: string) {
    requireUuid(id, "organisationId");
    const x = await this.db.rows<{ ok: boolean }>(
      Prisma.sql`SELECT EXISTS(SELECT 1 FROM organisations_agents.organisations WHERE id=${id}::uuid AND is_active=TRUE) AS ok`,
    );
    if (!x[0]?.ok)
      throw new DomainError(404, "The active agent organisation was not found.", "Not Found");
  }
  private async expire(scope: Prisma.Sql) {
    await this.db.$executeRaw(
      Prisma.sql`UPDATE quotes.quotes SET status='expired',updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE ${scope} AND status='sent' AND current_expires_at_utc<=${new Date()}`,
    );
  }
}
function array(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  if (v.some((x) => !x || typeof x !== "object")) throw validation("Array input is invalid.");
  return v as Record<string, unknown>[];
}
function required(v: unknown, name: string, max: number) {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max)
    throw validation(`${name} is invalid.`);
  return v.trim();
}
function optional(v: unknown, max: number) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string" || v.trim().length > max) throw validation("Text input is invalid.");
  return v.trim();
}
function uuid(v: unknown, name: string) {
  if (typeof v !== "string") throw validation(`${name} is required.`);
  return requireUuid(v, name);
}
export function currencyValue(v: unknown) {
  const c = required(v, "currency", 3).toUpperCase();
  if (!["EUR", "GBP", "LKR", "USD"].includes(c))
    throw validation("Currency must be EUR, GBP, LKR, or USD.");
  return c;
}
function textList(v: unknown) {
  if (v === undefined) return [];
  if (
    !Array.isArray(v) ||
    v.length > 20 ||
    v.some((x) => typeof x !== "string" || !x.trim() || x.length > 500)
  )
    throw validation("Text list is invalid.");
  return v.map((x) => (x as string).trim());
}
function line(x: Record<string, unknown>, i: number) {
  const quantity = Number(x.quantity),
    unitAmount = Number(x.unitAmount);
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > 1000 ||
    !Number.isFinite(unitAmount) ||
    unitAmount < 0 ||
    unitAmount > 99999999.99 ||
    round(unitAmount) !== unitAmount
  )
    throw validation(`Line item ${i + 1} is invalid.`);
  return {
    title: required(x.title, "title", 200),
    description: optional(x.description, 1000),
    quantity,
    unitAmount,
  };
}
function component(x: Record<string, unknown>, i: number) {
  const kind = String(x.kind ?? "")
      .trim()
      .toLowerCase(),
    amount = Number(x.amount);
  if (
    !["tax", "adjustment"].includes(kind) ||
    !Number.isFinite(amount) ||
    amount > 99999999.99 ||
    (kind === "tax" && amount < 0) ||
    amount < -99999999.99 ||
    round(amount) !== amount
  )
    throw validation(`Price component ${i + 1} is invalid.`);
  return { kind, label: required(x.label, "label", 200), amount };
}
export function calculate(
  lines: { quantity: number; unitAmount: number }[],
  components: { kind: string; amount: number }[],
) {
  if (lines.length < 1 || lines.length > 100)
    throw validation("A quote requires 1 to 100 line items.");
  let subtotal = 0;
  for (const priceLine of lines) {
    if (
      !Number.isFinite(priceLine.quantity) ||
      priceLine.quantity <= 0 ||
      priceLine.quantity > 1000
    ) {
      throw validation("Line quantities must be greater than zero and no more than 1,000.");
    }
    validateAmount(priceLine.unitAmount, false);
    subtotal = checkedAdd(subtotal, round(priceLine.quantity * priceLine.unitAmount));
  }
  let taxTotal = 0;
  let adjustmentTotal = 0;
  for (const priceComponent of components) {
    const kind = priceComponent.kind.trim().toLowerCase();
    if (kind !== "tax" && kind !== "adjustment")
      throw validation("Price component kind must be tax or adjustment.");
    validateAmount(priceComponent.amount, kind === "adjustment");
    if (kind === "tax") taxTotal = checkedAdd(taxTotal, round(priceComponent.amount));
    else adjustmentTotal = checkedAdd(adjustmentTotal, round(priceComponent.amount));
  }
  subtotal = round(subtotal);
  taxTotal = round(taxTotal);
  adjustmentTotal = round(adjustmentTotal);
  const grandTotal = round(subtotal + taxTotal + adjustmentTotal);
  if (grandTotal < 0 || grandTotal > 99999999.99)
    throw validation("The calculated grand total is outside the supported range.");
  return { subtotal, taxTotal, adjustmentTotal, grandTotal };
}
function round(v: number) {
  const scaled = Math.abs(v * 100);
  const lower = Math.floor(scaled);
  const fraction = scaled - lower;
  const rounded =
    Math.abs(fraction - 0.5) < 1e-9 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(scaled);
  return (Math.sign(v) * rounded) / 100;
}
function validateAmount(amount: number, allowNegative: boolean) {
  if (
    !Number.isFinite(amount) ||
    (!allowNegative && amount < 0) ||
    amount < -99999999.99 ||
    amount > 99999999.99 ||
    Math.abs(round(amount) - amount) > 1e-9
  ) {
    throw validation("Monetary amounts are outside the supported fixed-precision range.");
  }
}
function checkedAdd(left: number, right: number) {
  const result = left + right;
  if (result < -99999999.99 || result > 99999999.99)
    throw validation("The quote amount exceeds the supported limit.");
  return result;
}
function validation(m: string) {
  return new DomainError(400, m, "Validation failed");
}
function conflict(m: string) {
  return new DomainError(409, m, "Conflict");
}
function transition(m: string) {
  return new DomainError(409, m, "Quote transition conflict");
}
function notFound() {
  return new DomainError(404, "The owner-scoped quote was not found.", "Not found");
}
