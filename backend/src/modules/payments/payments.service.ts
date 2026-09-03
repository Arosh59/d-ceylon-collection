import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class PaymentsService {
  public constructor(
    private readonly db: DatabaseService,
    private readonly bookings: BookingsService,
  ) {}

  public async list(customerId: string, bookingId: string, query: PageQuery) {
    requireUuid(bookingId, "bookingId");
    const p = pagination(query);
    const [counts, rows] = await Promise.all([
      this.db.rows<{ count: bigint }>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM payments.payments
        WHERE customer_id = ${customerId}::uuid AND booking_id = ${bookingId}::uuid`),
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, booking_id AS "bookingId", kind, gateway, status, currency, amount,
          reconciliation_status AS "reconciliationStatus", captured_at_utc AS "capturedAtUtc",
          concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
        FROM payments.payments
        WHERE customer_id = ${customerId}::uuid AND booking_id = ${bookingId}::uuid
        ORDER BY created_at_utc DESC OFFSET ${p.skip} LIMIT ${p.pageSize}`),
    ]);
    return apiValue(page(rows, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async get(customerId: string, paymentId: string) {
    requireUuid(paymentId, "paymentId");
    const rows = await this.db.rows<Record<string, unknown>>(Prisma.sql`
      SELECT id, booking_id AS "bookingId", customer_id AS "customerId", kind, gateway, status,
        currency, amount, reconciliation_status AS "reconciliationStatus",
        payment_link_url IS NOT NULL AS "hasPaymentLink",
        payment_link_expires_at_utc AS "paymentLinkExpiresAtUtc", captured_at_utc AS "capturedAtUtc",
        failed_reason AS "failedReason", concurrency_token AS "concurrencyToken",
        created_at_utc AS "createdAtUtc", updated_at_utc AS "updatedAtUtc"
      FROM payments.payments
      WHERE id = ${paymentId}::uuid AND customer_id = ${customerId}::uuid LIMIT 1`);
    if (!rows[0]) throw paymentNotFound();
    const [transactions, refunds] = await Promise.all([
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, gateway, gateway_reference AS "gatewayReference", event_type AS "eventType",
          amount, currency, occurred_at_utc AS "occurredAtUtc",
          webhook_signature_verified AS "webhookSignatureVerified"
        FROM payments.payment_transactions WHERE payment_id = ${paymentId}::uuid
        ORDER BY occurred_at_utc`),
      this.db.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, amount, currency, reason, status, created_at_utc AS "createdAtUtc"
        FROM payments.refunds WHERE payment_id = ${paymentId}::uuid ORDER BY created_at_utc`),
    ]);
    return apiValue({ ...rows[0], transactions, refunds });
  }

  public async create(customerId: string, bookingId: string, body: Record<string, unknown>) {
    const source = await this.bookings.paymentSource(customerId, bookingId);
    if (!source) throw new DomainError(404, "The owner-scoped booking was not found.", "Not found");
    const status = String(source.status);
    if (["cancelled", "refunded", "completed"].includes(status)) {
      throw conflict("This booking cannot accept a payment.", "Payment transition conflict");
    }
    const amount = round(Number(source.totalAmount) - Number(source.paidAmount));
    if (amount <= 0) throw conflict("The booking has no outstanding amount.");

    const kind = required(body.kind, "kind", 30).toLowerCase();
    const gateway = required(body.gateway, "gateway", 30).toLowerCase();
    if (
      !["deposit", "balance", "manual-transfer", "payment-link"].includes(kind) ||
      !["stripe", "local", "manual"].includes(gateway)
    ) {
      throw conflict(
        "The payment kind or gateway is not supported.",
        "Payment transition conflict",
      );
    }
    const idempotencyKey = required(body.idempotencyKey, "idempotencyKey", 64);
    if (idempotencyKey.length < 16 || /\s/u.test(idempotencyKey)) {
      throw new DomainError(
        400,
        "The idempotency key must be 16 to 64 non-whitespace characters.",
        "Validation failed",
        { idempotencyKey: ["The idempotency key must be 16 to 64 non-whitespace characters."] },
      );
    }
    const duplicate = await this.db.rows<{ exists: boolean }>(Prisma.sql`
      SELECT EXISTS(SELECT 1 FROM payments.payments WHERE idempotency_key = ${idempotencyKey}) AS exists`);
    if (duplicate[0]?.exists) {
      throw conflict(
        "A payment with this idempotency key already exists. Do not retry with the same key.",
      );
    }
    const currency = String(source.currency).toUpperCase();
    if (!["EUR", "GBP", "LKR", "USD"].includes(currency)) {
      throw conflict("The booking currency is not supported.", "Payment transition conflict");
    }
    const id = randomUUID();
    const now = new Date();
    try {
      await this.db.$executeRaw`
        INSERT INTO payments.payments(
          id, booking_id, customer_id, idempotency_key, kind, gateway, status, currency, amount,
          reconciliation_status, created_at_utc, updated_at_utc, concurrency_token)
        VALUES(
          ${id}::uuid, ${bookingId}::uuid, ${customerId}::uuid, ${idempotencyKey}, ${kind},
          ${gateway}, 'pending', ${currency}, ${amount}, 'unreconciled', ${now}, ${now}, ${randomUUID()}::uuid)`;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict(
          "A payment with this idempotency key already exists. Do not retry with the same key.",
        );
      }
      throw error;
    }
    return this.get(customerId, id);
  }
}

function required(value: unknown, field: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) {
    throw new DomainError(400, `${field} is invalid.`, "Validation failed");
  }
  return value.trim();
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function conflict(message: string, title = "Payment conflict") {
  return new DomainError(409, message, title);
}

function paymentNotFound() {
  return new DomainError(404, "The owner-scoped payment was not found.", "Not found");
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2002" || (error.code === "P2010" && String(error.meta?.code) === "23505");
}
