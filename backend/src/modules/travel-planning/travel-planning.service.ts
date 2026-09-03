import { Injectable } from "@nestjs/common";
import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { requireIsoDate } from "../../common/date-validation";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { CatalogueService } from "../catalogue/catalogue.service";

export interface TravelPlanInput {
  title?: string;
  savedItineraryId?: string | null;
  travelStartDate?: string;
  travelEndDate?: string;
  pace?: string;
  destinationSlugs?: string[];
  travellerIds?: string[];
  interests?: string[];
  productTypeSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
  accessibilityConsiderations?: string | null;
  dietaryConsiderations?: string | null;
}
type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
interface PlanRow {
  id: string;
  customerId: string;
  savedItineraryId: string | null;
  title: string;
  travelStartDate: string;
  travelEndDate: string;
  pace: string;
  status: string;
  accessibilityConsiderations: string | null;
  dietaryConsiderations: string | null;
  ruleVersion: string;
  inputFingerprint: string;
  currentRevisionNumber: number;
  concurrencyToken: string;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}

@Injectable()
export class TravelPlanningService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly catalogue: CatalogueService,
  ) {}
  public async list(customerId: string, query: PageQuery): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM itineraries_travel_planning.travel_plans WHERE customer_id=${customerId}::uuid`,
      ),
      this.database.rows<Record<string, unknown>>(
        Prisma.sql`SELECT id,title,to_char(travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(travel_end_date,'YYYY-MM-DD') AS "travelEndDate",pace,status,current_revision_number AS "currentRevisionNumber",concurrency_token AS "concurrencyToken",updated_at_utc AS "updatedAtUtc" FROM itineraries_travel_planning.travel_plans WHERE customer_id=${customerId}::uuid ORDER BY updated_at_utc DESC OFFSET ${p.skip} LIMIT ${p.pageSize}`,
      ),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }
  public async get(customerId: string, planId: string): Promise<Record<string, unknown>> {
    requireUuid(planId, "planId");
    return this.load(this.database, customerId, planId);
  }
  public async create(
    customerId: string,
    input: TravelPlanInput,
  ): Promise<Record<string, unknown>> {
    validateInput(input);
    await this.references(customerId, input);
    const id = randomUUID(),
      now = new Date(),
      token = randomUUID();
    await this.database.$transaction(async (tx) => {
      await tx.$executeRaw`
    INSERT INTO itineraries_travel_planning.travel_plans(id,customer_id,saved_itinerary_id,title,travel_start_date,travel_end_date,pace,accessibility_considerations,dietary_considerations,status,rule_version,input_fingerprint,current_revision_number,created_at_utc,updated_at_utc,concurrency_token)
    VALUES(${id}::uuid,${customerId}::uuid,${input.savedItineraryId ?? null}::uuid,${input.title!.trim()},${input.travelStartDate}::date,${input.travelEndDate}::date,${input.pace ?? "balanced"},${clean(input.accessibilityConsiderations)},${clean(input.dietaryConsiderations)},'draft','dceylon-deterministic-v1','',0,${now},${now},${token}::uuid)`;
      await this.replaceReferences(tx, id, input);
    });
    await this.generate(customerId, id, token);
    return this.get(customerId, id);
  }
  public async updateInput(
    customerId: string,
    planId: string,
    input: TravelPlanInput & { concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(planId, "planId");
    validateInput(input);
    await this.references(customerId, input);
    await this.database.$transaction(async (tx) => {
      const result = await tx.$executeRaw`
    UPDATE itineraries_travel_planning.travel_plans SET saved_itinerary_id=${input.savedItineraryId ?? null}::uuid,title=${input.title!.trim()},travel_start_date=${input.travelStartDate}::date,travel_end_date=${input.travelEndDate}::date,pace=${input.pace ?? "balanced"},accessibility_considerations=${clean(input.accessibilityConsiderations)},dietary_considerations=${clean(input.dietaryConsiderations)},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE id=${planId}::uuid AND customer_id=${customerId}::uuid AND concurrency_token=${token(input.concurrencyToken)}::uuid`;
      if (result === 0) await this.missingOrConflict(tx, customerId, planId);
      await this.replaceReferences(tx, planId, input);
    });
    return this.get(customerId, planId);
  }
  public async generate(
    customerId: string,
    planId: string,
    concurrencyToken: string | undefined,
  ): Promise<Record<string, unknown>> {
    requireUuid(planId, "planId");
    const current = await this.plan(this.database, customerId, planId);
    if (!current) throw notFound();
    if (current.concurrencyToken !== token(concurrencyToken)) throw conflict();
    const input = await this.input(this.database, current);
    const catalogue = await this.catalogue.planning(input.destinationSlugs);
    const draft = generateDraft(input, catalogue);
    await this.database.$transaction(async (tx) => {
      const locked = await this.plan(tx, customerId, planId);
      if (!locked) throw notFound();
      if (locked.concurrencyToken !== concurrencyToken) throw conflict();
      const revisionId = randomUUID(),
        revisionNumber = locked.currentRevisionNumber + 1,
        now = new Date();
      await tx.$executeRaw`INSERT INTO itineraries_travel_planning.itinerary_revisions(id,travel_plan_id,revision_number,rule_version,input_fingerprint,generated_at_utc,created_at_utc,updated_at_utc,concurrency_token) VALUES(${revisionId}::uuid,${planId}::uuid,${revisionNumber},'dceylon-deterministic-v1',${draft.fingerprint},${now},${now},${now},${randomUUID()}::uuid)`;
      for (const day of draft.days) {
        await tx.$executeRaw`INSERT INTO itineraries_travel_planning.itinerary_days(id,itinerary_revision_id,day_number,date,title,created_at_utc,updated_at_utc,concurrency_token) VALUES(${day.id}::uuid,${revisionId}::uuid,${day.dayNumber},${day.date}::date,${day.title},${now},${now},${randomUUID()}::uuid)`;
        for (const item of day.items)
          await tx.$executeRaw`INSERT INTO itineraries_travel_planning.itinerary_items(id,itinerary_day_id,position,title,notes,duration_minutes,destination_slug,product_slug,source,created_at_utc,updated_at_utc,concurrency_token) VALUES(${item.id}::uuid,${day.id}::uuid,${item.position},${item.title},${item.notes},${item.durationMinutes},${item.destinationSlug},${item.productSlug},'catalogue',${now},${now},${randomUUID()}::uuid)`;
      }
      await tx.$executeRaw`UPDATE itineraries_travel_planning.travel_plans SET rule_version='dceylon-deterministic-v1',input_fingerprint=${draft.fingerprint},current_revision_number=${revisionNumber},updated_at_utc=${now},concurrency_token=${randomUUID()}::uuid WHERE id=${planId}::uuid`;
    });
    return this.get(customerId, planId);
  }
  public async updateDay(
    customerId: string,
    planId: string,
    dayId: string,
    body: { title?: string; concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(dayId, "dayId");
    const title = required(body.title, 200);
    const result = await this.database
      .$executeRaw`UPDATE itineraries_travel_planning.itinerary_days d SET title=${title},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid FROM itineraries_travel_planning.itinerary_revisions r JOIN itineraries_travel_planning.travel_plans p ON p.id=r.travel_plan_id AND r.revision_number=p.current_revision_number WHERE d.itinerary_revision_id=r.id AND d.id=${dayId}::uuid AND p.id=${planId}::uuid AND p.customer_id=${customerId}::uuid AND d.concurrency_token=${token(body.concurrencyToken)}::uuid`;
    if (result === 0)
      await this.itemMissingOrConflict(
        "itinerary_days",
        dayId,
        body.concurrencyToken,
        customerId,
        planId,
      );
    return this.get(customerId, planId);
  }
  public async createItem(
    customerId: string,
    planId: string,
    dayId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    requireUuid(dayId, "dayId");
    await this.destination(String(body.destinationSlug ?? ""));
    const plan = await this.plan(this.database, customerId, planId);
    if (!plan) throw notFound();
    const countRows = await this.database.rows<{ count: number }>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM itineraries_travel_planning.itinerary_items i JOIN itineraries_travel_planning.itinerary_days d ON d.id=i.itinerary_day_id JOIN itineraries_travel_planning.itinerary_revisions r ON r.id=d.itinerary_revision_id WHERE d.id=${dayId}::uuid AND r.travel_plan_id=${planId}::uuid AND r.revision_number=${plan.currentRevisionNumber}`,
    );
    if (!countRows[0]) throw notFound();
    const count = countRows[0].count,
      position = body.position === undefined ? count + 1 : Number(body.position);
    if (!Number.isInteger(position) || position < 1 || position > count + 1)
      throw new DomainError(409, "The item position is outside the day.", "Conflict");
    const now = new Date();
    await this.database.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE itineraries_travel_planning.itinerary_items SET position=position+1,updated_at_utc=${now},concurrency_token=${randomUUID()}::uuid WHERE itinerary_day_id=${dayId}::uuid AND position>=${position}`;
      await tx.$executeRaw`INSERT INTO itineraries_travel_planning.itinerary_items(id,itinerary_day_id,position,title,notes,duration_minutes,destination_slug,product_slug,source,created_at_utc,updated_at_utc,concurrency_token) VALUES(${randomUUID()}::uuid,${dayId}::uuid,${position},${required(body.title, 200)},${optional(body.notes, 2000)},${optionalInteger(body.durationMinutes, 1, 1440)},${body.destinationSlug as string},NULL,'custom',${now},${now},${randomUUID()}::uuid)`;
    });
    return this.get(customerId, planId);
  }
  public async updateItem(
    customerId: string,
    planId: string,
    itemId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    requireUuid(itemId, "itemId");
    await this.destination(String(body.destinationSlug ?? ""));
    const result = await this.database
      .$executeRaw`UPDATE itineraries_travel_planning.itinerary_items i SET title=${required(body.title, 200)},notes=${optional(body.notes, 2000)},duration_minutes=${optionalInteger(body.durationMinutes, 1, 1440)},destination_slug=${body.destinationSlug as string},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid FROM itineraries_travel_planning.itinerary_days d JOIN itineraries_travel_planning.itinerary_revisions r ON r.id=d.itinerary_revision_id JOIN itineraries_travel_planning.travel_plans p ON p.id=r.travel_plan_id AND p.current_revision_number=r.revision_number WHERE i.itinerary_day_id=d.id AND i.id=${itemId}::uuid AND p.id=${planId}::uuid AND p.customer_id=${customerId}::uuid AND i.concurrency_token=${token(body.concurrencyToken as string | undefined)}::uuid`;
    if (result === 0)
      await this.itemMissingOrConflict(
        "itinerary_items",
        itemId,
        body.concurrencyToken as string | undefined,
        customerId,
        planId,
      );
    return this.get(customerId, planId);
  }
  public async reorder(
    customerId: string,
    planId: string,
    itemId: string,
    body: { targetDayId?: string; position?: number; concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(itemId, "itemId");
    const target = requireUuid(body.targetDayId ?? "", "targetDayId"),
      position = Number(body.position);
    if (!Number.isInteger(position) || position < 1 || position > 100)
      throw validation("Position must be between 1 and 100.");
    const rows = await this.database.rows<{ dayId: string; oldPosition: number; token: string }>(
      Prisma.sql`SELECT i.itinerary_day_id AS "dayId",i.position AS "oldPosition",i.concurrency_token AS token FROM itineraries_travel_planning.itinerary_items i JOIN itineraries_travel_planning.itinerary_days d ON d.id=i.itinerary_day_id JOIN itineraries_travel_planning.itinerary_revisions r ON r.id=d.itinerary_revision_id JOIN itineraries_travel_planning.travel_plans p ON p.id=r.travel_plan_id AND p.current_revision_number=r.revision_number WHERE i.id=${itemId}::uuid AND p.id=${planId}::uuid AND p.customer_id=${customerId}::uuid`,
    );
    const item = rows[0];
    if (!item) throw notFound();
    if (item.token !== token(body.concurrencyToken)) throw conflict();
    const counts = await this.database.rows<{ count: number }>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM itineraries_travel_planning.itinerary_items WHERE itinerary_day_id=${target}::uuid AND id<>${itemId}::uuid`,
    );
    if (!counts[0] || position > counts[0].count + 1)
      throw new DomainError(409, "The target position is outside the day.", "Conflict");
    await this.database.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE itineraries_travel_planning.itinerary_items SET position=position-1 WHERE itinerary_day_id=${item.dayId}::uuid AND id<>${itemId}::uuid AND position>${item.oldPosition}`;
      await tx.$executeRaw`UPDATE itineraries_travel_planning.itinerary_items SET position=position+1 WHERE itinerary_day_id=${target}::uuid AND id<>${itemId}::uuid AND position>=${position}`;
      await tx.$executeRaw`UPDATE itineraries_travel_planning.itinerary_items SET itinerary_day_id=${target}::uuid,position=${position},updated_at_utc=${new Date()},concurrency_token=${randomUUID()}::uuid WHERE id=${itemId}::uuid`;
    });
    return this.get(customerId, planId);
  }
  public async quoteSource(
    customerId: string,
    planId: string,
    revisionId: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.database.rows<Record<string, unknown>>(
      Prisma.sql`SELECT p.id AS "travelPlanId",r.id AS "itineraryRevisionId",r.revision_number AS "revisionNumber",p.title,to_char(p.travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(p.travel_end_date,'YYYY-MM-DD') AS "travelEndDate",r.rule_version AS "ruleVersion",r.input_fingerprint AS "inputFingerprint" FROM itineraries_travel_planning.travel_plans p JOIN itineraries_travel_planning.itinerary_revisions r ON r.travel_plan_id=p.id AND r.revision_number=p.current_revision_number WHERE p.id=${planId}::uuid AND p.customer_id=${customerId}::uuid AND r.id=${revisionId}::uuid LIMIT 1`,
    );
    return rows[0] ?? null;
  }
  private async load(
    db: DatabaseService | Tx,
    customerId: string,
    planId: string,
  ): Promise<Record<string, unknown>> {
    const plan = await this.plan(db, customerId, planId);
    if (!plan) throw notFound();
    const input = await this.input(db, plan);
    const revisions = await db.$queryRaw<Array<Record<string, unknown>>>(
      Prisma.sql`SELECT id,revision_number AS "revisionNumber",rule_version AS "ruleVersion",input_fingerprint AS "inputFingerprint",generated_at_utc AS "generatedAtUtc" FROM itineraries_travel_planning.itinerary_revisions WHERE travel_plan_id=${planId}::uuid AND revision_number=${plan.currentRevisionNumber} LIMIT 1`,
    );
    const revision = revisions[0];
    if (!revision) throw notFound();
    const days = await db.$queryRaw<Array<Record<string, unknown>>>(
      Prisma.sql`SELECT id,day_number AS "dayNumber",to_char(date,'YYYY-MM-DD') AS date,title,concurrency_token AS "concurrencyToken" FROM itineraries_travel_planning.itinerary_days WHERE itinerary_revision_id=${revision.id as string}::uuid ORDER BY day_number`,
    );
    for (const day of days) {
      day.items = await db.$queryRaw<Array<Record<string, unknown>>>(
        Prisma.sql`SELECT id,position,title,notes,duration_minutes AS "durationMinutes",destination_slug AS "destinationSlug",product_slug AS "productSlug",source,concurrency_token AS "concurrencyToken" FROM itineraries_travel_planning.itinerary_items WHERE itinerary_day_id=${day.id as string}::uuid ORDER BY position`,
      );
    }
    return apiValue({
      id: plan.id,
      savedItineraryId: plan.savedItineraryId,
      title: plan.title,
      travelStartDate: plan.travelStartDate,
      travelEndDate: plan.travelEndDate,
      pace: plan.pace,
      status: plan.status,
      input,
      currentRevision: { ...revision, days },
      concurrencyToken: plan.concurrencyToken,
      createdAtUtc: plan.createdAtUtc,
      updatedAtUtc: plan.updatedAtUtc,
    });
  }
  private async plan(
    db: DatabaseService | Tx,
    customerId: string,
    planId: string,
  ): Promise<PlanRow | null> {
    const rows = await db.$queryRaw<PlanRow[]>(
      Prisma.sql`SELECT id,customer_id AS "customerId",saved_itinerary_id AS "savedItineraryId",title,to_char(travel_start_date,'YYYY-MM-DD') AS "travelStartDate",to_char(travel_end_date,'YYYY-MM-DD') AS "travelEndDate",pace,status,accessibility_considerations AS "accessibilityConsiderations",dietary_considerations AS "dietaryConsiderations",rule_version AS "ruleVersion",input_fingerprint AS "inputFingerprint",current_revision_number AS "currentRevisionNumber",concurrency_token AS "concurrencyToken",created_at_utc AS "createdAtUtc",updated_at_utc AS "updatedAtUtc" FROM itineraries_travel_planning.travel_plans WHERE id=${planId}::uuid AND customer_id=${customerId}::uuid LIMIT 1`,
    );
    return rows[0] ?? null;
  }
  private async input(
    db: DatabaseService | Tx,
    plan: PlanRow,
  ): Promise<
    TravelPlanInput & {
      destinationSlugs: string[];
      travellerIds: string[];
      interests: string[];
      productTypeSlugs: string[];
      categorySlugs: string[];
      tagSlugs: string[];
    }
  > {
    const [dest, trav, int, pref] = await Promise.all([
      db.$queryRaw<Array<{ value: string }>>(
        Prisma.sql`SELECT destination_slug AS value FROM itineraries_travel_planning.travel_plan_destinations WHERE travel_plan_id=${plan.id}::uuid ORDER BY position`,
      ),
      db.$queryRaw<Array<{ value: string }>>(
        Prisma.sql`SELECT traveller_id::text AS value FROM itineraries_travel_planning.travel_plan_travellers WHERE travel_plan_id=${plan.id}::uuid ORDER BY position`,
      ),
      db.$queryRaw<Array<{ value: string }>>(
        Prisma.sql`SELECT interest_slug AS value FROM itineraries_travel_planning.travel_plan_interests WHERE travel_plan_id=${plan.id}::uuid ORDER BY position`,
      ),
      db.$queryRaw<Array<{ kind: string; value: string }>>(
        Prisma.sql`SELECT kind,slug AS value FROM itineraries_travel_planning.travel_plan_preferences WHERE travel_plan_id=${plan.id}::uuid ORDER BY position`,
      ),
    ]);
    return {
      title: plan.title,
      savedItineraryId: plan.savedItineraryId,
      travelStartDate: plan.travelStartDate,
      travelEndDate: plan.travelEndDate,
      pace: plan.pace,
      destinationSlugs: dest.map((x) => x.value),
      travellerIds: trav.map((x) => x.value),
      interests: int.map((x) => x.value),
      productTypeSlugs: pref.filter((x) => x.kind === "product-type").map((x) => x.value),
      categorySlugs: pref.filter((x) => x.kind === "category").map((x) => x.value),
      tagSlugs: pref.filter((x) => x.kind === "tag").map((x) => x.value),
      accessibilityConsiderations: plan.accessibilityConsiderations,
      dietaryConsiderations: plan.dietaryConsiderations,
    };
  }
  private async replaceReferences(tx: Tx, id: string, input: TravelPlanInput): Promise<void> {
    await tx.$executeRaw`DELETE FROM itineraries_travel_planning.travel_plan_destinations WHERE travel_plan_id=${id}::uuid`;
    await tx.$executeRaw`DELETE FROM itineraries_travel_planning.travel_plan_travellers WHERE travel_plan_id=${id}::uuid`;
    await tx.$executeRaw`DELETE FROM itineraries_travel_planning.travel_plan_interests WHERE travel_plan_id=${id}::uuid`;
    await tx.$executeRaw`DELETE FROM itineraries_travel_planning.travel_plan_preferences WHERE travel_plan_id=${id}::uuid`;
    for (const [i, v] of input.destinationSlugs!.entries())
      await tx.$executeRaw`INSERT INTO itineraries_travel_planning.travel_plan_destinations(travel_plan_id,destination_slug,position) VALUES(${id}::uuid,${v},${i + 1})`;
    for (const [i, v] of (input.travellerIds ?? []).entries())
      await tx.$executeRaw`INSERT INTO itineraries_travel_planning.travel_plan_travellers(travel_plan_id,traveller_id,position) VALUES(${id}::uuid,${v}::uuid,${i + 1})`;
    for (const [i, v] of (input.interests ?? []).entries())
      await tx.$executeRaw`INSERT INTO itineraries_travel_planning.travel_plan_interests(travel_plan_id,interest_slug,position) VALUES(${id}::uuid,${v},${i + 1})`;
    for (const [kind, values] of [
      ["product-type", input.productTypeSlugs ?? []],
      ["category", input.categorySlugs ?? []],
      ["tag", input.tagSlugs ?? []],
    ] as const)
      for (const [i, v] of values.entries())
        await tx.$executeRaw`INSERT INTO itineraries_travel_planning.travel_plan_preferences(travel_plan_id,kind,slug,position) VALUES(${id}::uuid,${kind},${v},${i + 1})`;
  }
  private async references(customerId: string, input: TravelPlanInput): Promise<void> {
    if (input.savedItineraryId) {
      requireUuid(input.savedItineraryId, "savedItineraryId");
      const x = await this.database.rows<{ ok: boolean }>(
        Prisma.sql`SELECT EXISTS(SELECT 1 FROM customers_travellers.saved_itineraries WHERE id=${input.savedItineraryId}::uuid AND customer_id=${customerId}::uuid AND is_archived=FALSE) AS ok`,
      );
      if (!x[0]?.ok) throw new DomainError(404, "The saved itinerary was not found.", "Not Found");
    }
    for (const id of input.travellerIds ?? []) {
      requireUuid(id, "travellerId");
      const x = await this.database.rows<{ ok: boolean }>(
        Prisma.sql`SELECT EXISTS(SELECT 1 FROM customers_travellers.travellers WHERE id=${id}::uuid AND customer_id=${customerId}::uuid) AS ok`,
      );
      if (!x[0]?.ok)
        throw new DomainError(404, "One or more travellers were not found.", "Not Found");
    }
    for (const slug of input.destinationSlugs ?? []) await this.destination(slug);
  }
  private async destination(slug: string): Promise<void> {
    if (!slugPattern.test(slug)) throw validation("Destination slug is invalid.");
    const x = await this.database.rows<{ ok: boolean }>(
      Prisma.sql`SELECT EXISTS(SELECT 1 FROM catalogue.destinations WHERE slug=${slug} AND publication_state='Published') AS ok`,
    );
    if (!x[0]?.ok)
      throw new DomainError(404, "A published destination was not found.", "Not Found");
  }
  private async missingOrConflict(db: Tx, customerId: string, planId: string): Promise<never> {
    if (await this.plan(db, customerId, planId)) throw conflict();
    throw notFound();
  }
  private async itemMissingOrConflict(
    table: string,
    id: string,
    supplied: string | undefined,
    customerId: string,
    planId: string,
  ): Promise<never> {
    const rows = await this.database.rows<{ token: string }>(
      Prisma.sql`SELECT x.concurrency_token AS token FROM ${Prisma.raw(`itineraries_travel_planning.${table}`)} x JOIN itineraries_travel_planning.itinerary_days d ON ${table === "itinerary_days" ? Prisma.sql`d.id=x.id` : Prisma.sql`d.id=x.itinerary_day_id`} JOIN itineraries_travel_planning.itinerary_revisions r ON r.id=d.itinerary_revision_id JOIN itineraries_travel_planning.travel_plans p ON p.id=r.travel_plan_id AND p.current_revision_number=r.revision_number WHERE x.id=${id}::uuid AND p.id=${planId}::uuid AND p.customer_id=${customerId}::uuid`,
    );
    if (!rows[0]) throw notFound();
    if (rows[0].token !== supplied) throw conflict();
    throw notFound();
  }
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
function clean(v: string | null | undefined): string | null {
  return v?.trim() || null;
}
function required(v: unknown, max: number): string {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max)
    throw validation("A required text value is invalid.");
  return v.trim();
}
function optional(v: unknown, max: number): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string" || v.trim().length > max) throw validation("Text value is invalid.");
  return v.trim();
}
function optionalInteger(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw validation("Numeric value is invalid.");
  return n;
}
function token(v: string | undefined): string {
  return requireUuid(v ?? "", "concurrencyToken");
}
function validation(m: string) {
  return new DomainError(400, m, "Validation failed");
}
function conflict() {
  return new DomainError(409, "The record changed. Reload and retry.", "Conflict");
}
function notFound() {
  return new DomainError(
    404,
    "The customer-owned travel plan or draft item was not found.",
    "Not found",
  );
}
export function validateInput(i: TravelPlanInput): void {
  required(i.title, 200);
  const startDate = requireIsoDate(i.travelStartDate, "travelStartDate"),
    endDate = requireIsoDate(i.travelEndDate, "travelEndDate"),
    start = new Date(`${startDate}T00:00:00Z`),
    end = new Date(`${endDate}T00:00:00Z`),
    days = Math.round((end.valueOf() - start.valueOf()) / 86400000) + 1;
  if (!Number.isFinite(days) || days < 1)
    throw validation("Travel end date cannot be before the start date.");
  if (days > 30) throw validation("A generated draft can cover at most 30 days.");
  if (!["relaxed", "balanced", "active"].includes(i.pace ?? "balanced"))
    throw validation("Pace must be relaxed, balanced, or active.");
  for (const [values, min, max] of [
    [i.destinationSlugs ?? [], 1, 10],
    [i.interests ?? [], 0, 20],
    [i.productTypeSlugs ?? [], 0, 20],
    [i.categorySlugs ?? [], 0, 20],
    [i.tagSlugs ?? [], 0, 20],
  ] as const)
    if (
      values.length < min ||
      values.length > max ||
      new Set(values).size !== values.length ||
      values.some((v) => !slugPattern.test(v))
    )
      throw validation("Slug collections contain invalid values.");
  if (
    (i.travellerIds?.length ?? 0) > 20 ||
    new Set(i.travellerIds).size !== i.travellerIds?.length ||
    (i.travellerIds ?? []).some(
      (id) => id === "00000000-0000-0000-0000-000000000000" || !uuidPattern.test(id),
    )
  )
    throw validation("Traveller associations must contain at most 20 unique identifiers.");
}
const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu;
export function generateDraft(
  input: TravelPlanInput & { destinationSlugs: string[] },
  catalogue: Record<string, unknown>[],
) {
  const canonical = JSON.stringify({
    ruleVersion: "dceylon-deterministic-v1",
    startDate: input.travelStartDate,
    endDate: input.travelEndDate,
    pace: input.pace,
    destinations: input.destinationSlugs,
    travellers: input.travellerIds,
    interests: [...(input.interests ?? [])].sort(),
    productTypes: [...(input.productTypeSlugs ?? [])].sort(),
    categories: [...(input.categorySlugs ?? [])].sort(),
    tags: [...(input.tagSlugs ?? [])].sort(),
    accessibility: clean(input.accessibilityConsiderations),
    dietary: clean(input.dietaryConsiderations),
    catalogueSnapshot: [...catalogue].sort((a, b) =>
      String(a.productSlug).localeCompare(String(b.productSlug)),
    ),
  });
  const fingerprint = createHash("sha256").update(canonical).digest("hex"),
    used = new Set<string>(),
    capacity = input.pace === "relaxed" ? 1 : input.pace === "active" ? 3 : 2,
    start = new Date(`${input.travelStartDate}T00:00:00Z`),
    end = new Date(`${input.travelEndDate}T00:00:00Z`),
    count = Math.round((end.valueOf() - start.valueOf()) / 86400000) + 1,
    days = [];
  for (let index = 0; index < count; index++) {
    const dayNumber = index + 1,
      destination = input.destinationSlugs[index % input.destinationSlugs.length]!,
      candidates = catalogue
        .filter(
          (x) =>
            (x.destinationSlugs as string[]).includes(destination) &&
            !used.has(String(x.productSlug)),
        )
        .sort(
          (a, b) =>
            score(b, input) - score(a, input) ||
            String(a.productSlug).localeCompare(String(b.productSlug)),
        )
        .slice(0, capacity),
      date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const items = candidates.map((x, i) => {
      used.add(String(x.productSlug));
      return {
        id: stableId(`${fingerprint}:day:${dayNumber}:item:${String(x.productSlug)}`),
        position: i + 1,
        title: String(x.name),
        notes: "Selected by explicit catalogue preference and ordering rules.",
        durationMinutes: x.durationMinutes as number | null,
        destinationSlug: destination,
        productSlug: String(x.productSlug),
      };
    });
    days.push({
      id: stableId(`${fingerprint}:day:${dayNumber}`),
      dayNumber,
      date: date.toISOString().slice(0, 10),
      title: `Day ${dayNumber} · ${destination.replaceAll("-", " ")}`,
      items,
    });
  }
  return { fingerprint, days };
}
function score(x: Record<string, unknown>, i: TravelPlanInput): number {
  const hits = (a: unknown, b: string[] | undefined, w: number) =>
    (a as string[]).filter((v) => (b ?? []).includes(v)).length * w;
  return (
    hits(x.productTypeSlugs, i.productTypeSlugs, 8) +
    hits(x.categorySlugs, i.categorySlugs, 6) +
    hits(x.tagSlugs, i.tagSlugs, 4) +
    hits(x.categorySlugs, i.interests, 2) +
    hits(x.tagSlugs, i.interests, 2)
  );
}
function stableId(value: string): string {
  const b = createHash("sha256").update(value).digest();
  const h = (n: number) => b[n]!.toString(16).padStart(2, "0");
  return `${h(3)}${h(2)}${h(1)}${h(0)}-${h(5)}${h(4)}-${h(7)}${h(6)}-${h(8)}${h(9)}-${Array.from({ length: 6 }, (_, i) => h(10 + i)).join("")}`;
}
