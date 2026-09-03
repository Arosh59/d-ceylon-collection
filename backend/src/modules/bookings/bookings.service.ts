import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { QuotesService } from "../quotes/quotes.service";

interface BookingRow {
  id: string;
  bookingReference: string;
  quoteId: string;
  quoteVersionId: string;
  customerId: string;
  organisationId: string | null;
  itineraryTitle: string;
  travelStartDate: string;
  travelEndDate: string;
  status: string;
  currency: string;
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  customerNotes: string | null;
  confirmedAtUtc: Date | null;
  cancelledAtUtc: Date | null;
  cancellationReason: string | null;
  concurrencyToken: string;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}

@Injectable()
export class BookingsService {
  public constructor(
    private readonly db: DatabaseService,
    private readonly quotes: QuotesService,
  ) {}

  public customerList(customerId: string, query: PageQuery) {
    return this.list(Prisma.sql`customer_id = ${customerId}::uuid`, query);
  }

  public agentList(organisationId: string, query: PageQuery) {
    return this.list(Prisma.sql`organisation_id = ${organisationId}::uuid`, query);
  }

  public customerGet(customerId: string, bookingId: string) {
    return this.get(Prisma.sql`customer_id = ${customerId}::uuid`, bookingId);
  }

  public agentGet(organisationId: string, bookingId: string) {
    return this.get(Prisma.sql`organisation_id = ${organisationId}::uuid`, bookingId);
  }

  public async customerVoucher(customerId: string, bookingId: string, voucherId: string) {
    requireUuid(bookingId, "bookingId");
    requireUuid(voucherId, "voucherId");
    const rows = await this.db.rows<Record<string, unknown>>(Prisma.sql`
      SELECT v.id, v.voucher_code AS "voucherCode", v.title, v.description,
        to_char(v.valid_from, 'YYYY-MM-DD') AS "validFrom",
        to_char(v.valid_until, 'YYYY-MM-DD') AS "validUntil", v.status,
        v.redeemed_at_utc AS "redeemedAtUtc", v.issued_at_utc AS "issuedAtUtc",
        v.document_key IS NOT NULL AS "hasDocument", v.concurrency_token AS "concurrencyToken"
      FROM bookings.vouchers v
      JOIN bookings.bookings b ON b.id = v.booking_id
      WHERE b.id = ${bookingId}::uuid AND b.customer_id = ${customerId}::uuid
        AND v.id = ${voucherId}::uuid
      LIMIT 1`);
    if (!rows[0]) throw bookingNotFound();
    return apiValue(rows[0]);
  }

  public async create(customerId: string, body: Record<string, unknown>) {
    const quoteId = uuid(body.quoteId, "quoteId");
    const quoteVersionId = uuid(body.quoteVersionId, "quoteVersionId");
    const customerNotes = optional(body.customerNotes, 2000);
    const source = await this.quotes.acceptedSource(customerId, quoteId, quoteVersionId);
    if (!source) {
      throw new DomainError(404, "The accepted current quote version was not found.", "Not found");
    }
    const duplicate = await this.db.rows<{ exists: boolean }>(Prisma.sql`
      SELECT EXISTS(SELECT 1 FROM bookings.bookings WHERE quote_id = ${quoteId}::uuid) AS exists`);
    if (duplicate[0]?.exists) throw conflict("A booking already exists for this quote.");

    const id = randomUUID();
    const now = new Date();
    const token = randomUUID();
    const currency = String(source.currency);
    const lines = source.lines as Record<string, unknown>[];
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO bookings.bookings(
          id, booking_reference, quote_id, quote_version_id, customer_id, organisation_id,
          status, currency, total_amount, paid_amount, travel_start_date, travel_end_date,
          itinerary_title, customer_notes, created_at_utc, updated_at_utc, concurrency_token)
        VALUES(
          ${id}::uuid, ${reference("BK", id, 14)}, ${quoteId}::uuid, ${quoteVersionId}::uuid,
          ${customerId}::uuid, ${nullableUuid(source.organisationId)}, 'pending-confirmation', ${currency},
          ${Number(source.grandTotal)}, 0, ${String(source.travelStartDate)}::date,
          ${String(source.travelEndDate)}::date, ${String(source.itineraryTitle)}, ${customerNotes},
          ${now}, ${now}, ${token}::uuid)`;
      for (const [index, line] of lines.entries()) {
        await tx.$executeRaw`
          INSERT INTO bookings.booking_items(
            id, booking_id, position, title, description, quantity, unit_amount, line_total,
            created_at_utc, updated_at_utc, concurrency_token)
          VALUES(
            ${randomUUID()}::uuid, ${id}::uuid, ${index + 1}, ${String(line.title)},
            ${line.description == null ? null : String(line.description)}, ${Number(line.quantity)},
            ${Number(line.unitAmount)}, ${Number(line.lineTotal)}, ${now}, ${now}, ${randomUUID()}::uuid)`;
      }
      await tx.$executeRaw`
        INSERT INTO bookings.invoices(
          id, booking_id, invoice_number, status, currency, subtotal, tax_total,
          adjustment_total, grand_total, created_at_utc, updated_at_utc, concurrency_token)
        VALUES(
          ${randomUUID()}::uuid, ${id}::uuid, ${reference("INV", id, 15)}, 'draft', ${currency},
          ${Number(source.subtotal)}, ${Number(source.taxTotal)}, ${Number(source.adjustmentTotal)},
          ${Number(source.grandTotal)}, ${now}, ${now}, ${randomUUID()}::uuid)`;
    });
    return this.customerGet(customerId, id);
  }

  public async requestCancellation(
    customerId: string,
    bookingId: string,
    body: Record<string, unknown>,
  ) {
    const booking = await this.row(Prisma.sql`customer_id = ${customerId}::uuid`, bookingId);
    const token = uuid(body.concurrencyToken, "concurrencyToken");
    if (booking.concurrencyToken !== token) {
      throw conflict("The booking was modified by another request. Reload and retry.");
    }
    if (["cancelled", "refunded", "completed", "cancellation-requested"].includes(booking.status)) {
      throw conflict(`Cannot request cancellation of a ${booking.status} booking.`);
    }
    const reason = optional(body.reason, 500);
    const changed = await this.db.$executeRaw`
      UPDATE bookings.bookings SET status = 'cancellation-requested', cancellation_reason = ${reason},
        updated_at_utc = ${new Date()}, concurrency_token = ${randomUUID()}::uuid
      WHERE id = ${bookingId}::uuid AND customer_id = ${customerId}::uuid
        AND concurrency_token = ${token}::uuid`;
    if (changed !== 1)
      throw conflict("The booking was modified by another request. Reload and retry.");
    return this.customerGet(customerId, bookingId);
  }

  public async paymentSource(customerId: string, bookingId: string) {
    requireUuid(bookingId, "bookingId");
    const rows = await this.db.rows<Record<string, unknown>>(Prisma.sql`
      SELECT id AS "bookingId", customer_id AS "customerId", booking_reference AS "bookingReference",
        currency, total_amount AS "totalAmount", paid_amount AS "paidAmount", status
      FROM bookings.bookings
      WHERE id = ${bookingId}::uuid AND customer_id = ${customerId}::uuid LIMIT 1`);
    return rows[0] ? apiValue(rows[0]) : null;
  }

  public async operationsSource(bookingId: string) {
    requireUuid(bookingId, "bookingId");
    const rows = await this.db.rows<Record<string, unknown>>(Prisma.sql`
      SELECT id AS "bookingId", status FROM bookings.bookings WHERE id = ${bookingId}::uuid LIMIT 1`);
    return rows[0] ? apiValue(rows[0]) : null;
  }

  private async list(scope: Prisma.Sql, query: PageQuery) {
    const p = pagination(query);
    const [counts, rows] = await Promise.all([
      this.db.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM bookings.bookings WHERE ${scope}`,
      ),
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, booking_reference AS "bookingReference", itinerary_title AS "itineraryTitle",
          to_char(travel_start_date, 'YYYY-MM-DD') AS "travelStartDate",
          to_char(travel_end_date, 'YYYY-MM-DD') AS "travelEndDate", status, currency,
          total_amount AS "totalAmount", paid_amount AS "paidAmount", confirmed_at_utc AS "confirmedAtUtc",
          concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
        FROM bookings.bookings WHERE ${scope}
        ORDER BY updated_at_utc DESC OFFSET ${p.skip} LIMIT ${p.pageSize}`),
    ]);
    return apiValue(page(rows, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  private async get(scope: Prisma.Sql, bookingId: string) {
    const booking = await this.row(scope, bookingId);
    const [items, invoices, vouchers] = await Promise.all([
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, position, title, description, quantity, unit_amount AS "unitAmount",
          line_total AS "lineTotal", ${booking.currency} AS currency
        FROM bookings.booking_items WHERE booking_id = ${bookingId}::uuid ORDER BY position`),
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, invoice_number AS "invoiceNumber", status, currency, subtotal,
          tax_total AS "taxTotal", adjustment_total AS "adjustmentTotal", grand_total AS "grandTotal",
          issued_at_utc AS "issuedAtUtc", due_at_utc AS "dueAtUtc", paid_at_utc AS "paidAtUtc",
          document_key IS NOT NULL AS "hasDocument", created_at_utc AS "createdAtUtc"
        FROM bookings.invoices WHERE booking_id = ${bookingId}::uuid ORDER BY created_at_utc DESC`),
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, voucher_code AS "voucherCode", title, description,
          to_char(valid_from, 'YYYY-MM-DD') AS "validFrom", to_char(valid_until, 'YYYY-MM-DD') AS "validUntil",
          status, redeemed_at_utc AS "redeemedAtUtc", issued_at_utc AS "issuedAtUtc",
          document_key IS NOT NULL AS "hasDocument", concurrency_token AS "concurrencyToken"
        FROM bookings.vouchers WHERE booking_id = ${bookingId}::uuid ORDER BY issued_at_utc`),
    ]);
    return apiValue({ ...booking, items, invoices, vouchers });
  }

  private async row(scope: Prisma.Sql, bookingId: string): Promise<BookingRow> {
    requireUuid(bookingId, "bookingId");
    const rows = await this.db.rows<BookingRow>(Prisma.sql`
      SELECT id, booking_reference AS "bookingReference", quote_id AS "quoteId",
        quote_version_id AS "quoteVersionId", customer_id AS "customerId",
        organisation_id AS "organisationId", itinerary_title AS "itineraryTitle",
        to_char(travel_start_date, 'YYYY-MM-DD') AS "travelStartDate",
        to_char(travel_end_date, 'YYYY-MM-DD') AS "travelEndDate", status, currency,
        total_amount AS "totalAmount", paid_amount AS "paidAmount", customer_notes AS "customerNotes",
        confirmed_at_utc AS "confirmedAtUtc", cancelled_at_utc AS "cancelledAtUtc",
        cancellation_reason AS "cancellationReason", concurrency_token AS "concurrencyToken",
        created_at_utc AS "createdAtUtc", updated_at_utc AS "updatedAtUtc"
      FROM bookings.bookings WHERE id = ${bookingId}::uuid AND ${scope} LIMIT 1`);
    if (!rows[0]) throw bookingNotFound();
    return rows[0];
  }
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string") throw validation(`${field} is required.`);
  return requireUuid(value, field);
}

function optional(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maximum)
    throw validation("Text input is invalid.");
  return value.trim() || null;
}

function nullableUuid(value: unknown): Prisma.Sql {
  return value == null ? Prisma.sql`NULL` : Prisma.sql`${String(value)}::uuid`;
}

function reference(prefix: string, id: string, length: number): string {
  return `${prefix}-${id.replaceAll("-", "")}`.slice(0, length).toUpperCase();
}

function validation(message: string) {
  return new DomainError(400, message, "Validation failed");
}

function conflict(message: string) {
  return new DomainError(409, message, "Booking conflict");
}

function bookingNotFound() {
  return new DomainError(404, "The owner-scoped booking was not found.", "Not found");
}
