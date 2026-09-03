import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { optionalIsoDate, requireIsoDate } from "../../common/date-validation";
import { DatabaseService } from "../../database/database.service";

export type OperationResource =
  "arrivals" | "assignments" | "drivers" | "guides" | "suppliers" | "tasks" | "vehicles";

const fields: Record<OperationResource, Prisma.Sql> = {
  suppliers: Prisma.sql`"Id" AS id, "Name" AS name, "Category" AS category, "ContactName" AS "contactName", "ContactEmail" AS "contactEmail", "Status" AS status, "ConcurrencyToken" AS "concurrencyToken"`,
  tasks: Prisma.sql`"Id" AS id, "BookingId" AS "bookingId", "SupplierId" AS "supplierId", "Title" AS title, "Status" AS status, to_char("DueDate", 'YYYY-MM-DD') AS "dueDate", "Notes" AS notes, "ConcurrencyToken" AS "concurrencyToken"`,
  vehicles: Prisma.sql`"Id" AS id, "SupplierId" AS "supplierId", "Name" AS name, "RegistrationNumber" AS "registrationNumber", "Capacity" AS capacity, "Status" AS status, "Notes" AS notes, "ConcurrencyToken" AS "concurrencyToken"`,
  drivers: Prisma.sql`"Id" AS id, "Name" AS name, "Phone" AS phone, "LicenceNumber" AS "licenceNumber", "Status" AS status, "ConcurrencyToken" AS "concurrencyToken"`,
  guides: Prisma.sql`"Id" AS id, "Name" AS name, "Phone" AS phone, "Languages" AS languages, "Status" AS status, "ConcurrencyToken" AS "concurrencyToken"`,
  arrivals: Prisma.sql`"Id" AS id, "BookingId" AS "bookingId", "ArrivalAtUtc" AS "arrivalAtUtc", "Airport" AS airport, "FlightNumber" AS "flightNumber", "Status" AS status, "Notes" AS notes, "ConcurrencyToken" AS "concurrencyToken"`,
  assignments: Prisma.sql`"Id" AS id, "BookingId" AS "bookingId", to_char("ServiceDate", 'YYYY-MM-DD') AS "serviceDate", "VehicleId" AS "vehicleId", "DriverId" AS "driverId", "GuideId" AS "guideId", "Status" AS status, "Notes" AS notes, "ConcurrencyToken" AS "concurrencyToken"`,
};
const order: Record<OperationResource, Prisma.Sql> = {
  suppliers: Prisma.sql`"Name", "Id"`,
  tasks: Prisma.sql`"DueDate", "CreatedAtUtc", "Id"`,
  vehicles: Prisma.sql`"Name", "Id"`,
  drivers: Prisma.sql`"Name", "Id"`,
  guides: Prisma.sql`"Name", "Id"`,
  arrivals: Prisma.sql`"ArrivalAtUtc", "Id"`,
  assignments: Prisma.sql`"ServiceDate", "CreatedAtUtc", "Id"`,
};

@Injectable()
export class OperationsService {
  public constructor(private readonly database: DatabaseService) {}

  public async list(
    resource: OperationResource,
    query: PageQuery,
  ): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const table = Prisma.raw(`supplier_operations.${tableName(resource)}`);
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM ${table}`,
      ),
      this.database.rows<Record<string, unknown>>(
        Prisma.sql`SELECT ${fields[resource]} FROM ${table} ORDER BY ${order[resource]} OFFSET ${p.skip} LIMIT ${p.pageSize}`,
      ),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async create(
    resource: OperationResource,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const now = new Date(),
      id = randomUUID(),
      token = randomUUID();
    await this.validate(resource, body);
    let query: Prisma.Sql;
    switch (resource) {
      case "suppliers":
        query = Prisma.sql`INSERT INTO supplier_operations.suppliers
        ("Id","Name","Category","ContactName","ContactEmail","Status","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${requiredText(body.name, "name", 200)},${requiredText(body.category, "category", 60)},${text(body.contactName, 120)},${email(body.contactEmail)},'active',${now},${now},${token}::uuid) RETURNING ${fields.suppliers}`;
        break;
      case "tasks":
        query = Prisma.sql`INSERT INTO supplier_operations.booking_operation_tasks
        ("Id","BookingId","SupplierId","Title","Status","DueDate","Notes","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${uuid(body.bookingId, "bookingId")}::uuid,${nullableUuid(body.supplierId)}::uuid,${requiredText(body.title, "title", 200)},'open',${optionalIsoDate(body.dueDate, "dueDate")}::date,${text(body.notes, 2000)},${now},${now},${token}::uuid) RETURNING ${fields.tasks}`;
        break;
      case "vehicles":
        query = Prisma.sql`INSERT INTO supplier_operations.vehicles
        ("Id","SupplierId","Name","RegistrationNumber","Capacity","Status","Notes","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${nullableUuid(body.supplierId)}::uuid,${requiredText(body.name, "name", 160)},${requiredText(body.registrationNumber, "registrationNumber", 40).toUpperCase()},${integer(body.capacity, "capacity", 1, 100)},'active',${text(body.notes, 1000)},${now},${now},${token}::uuid) RETURNING ${fields.vehicles}`;
        break;
      case "drivers":
        query = Prisma.sql`INSERT INTO supplier_operations.drivers
        ("Id","Name","Phone","LicenceNumber","Status","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${requiredText(body.name, "name", 160)},${requiredText(body.phone, "phone", 40)},${text(body.licenceNumber, 80)?.toUpperCase() ?? null},'active',${now},${now},${token}::uuid) RETURNING ${fields.drivers}`;
        break;
      case "guides":
        query = Prisma.sql`INSERT INTO supplier_operations.guides
        ("Id","Name","Phone","Languages","Status","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${requiredText(body.name, "name", 160)},${requiredText(body.phone, "phone", 40)},${text(body.languages, 300)},'active',${now},${now},${token}::uuid) RETURNING ${fields.guides}`;
        break;
      case "arrivals":
        query = Prisma.sql`INSERT INTO supplier_operations.arrivals
        ("Id","BookingId","ArrivalAtUtc","Airport","FlightNumber","Status","Notes","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${uuid(body.bookingId, "bookingId")}::uuid,${requiredDate(body.arrivalAtUtc, "arrivalAtUtc")},${requiredText(body.airport, "airport", 120)},${text(body.flightNumber, 30)?.toUpperCase() ?? null},'expected',${text(body.notes, 1000)},${now},${now},${token}::uuid) RETURNING ${fields.arrivals}`;
        break;
      case "assignments":
        query = Prisma.sql`INSERT INTO supplier_operations.booking_resource_assignments
        ("Id","BookingId","ServiceDate","VehicleId","DriverId","GuideId","Status","Notes","CreatedAtUtc","UpdatedAtUtc","ConcurrencyToken")
        VALUES (${id}::uuid,${uuid(body.bookingId, "bookingId")}::uuid,${requireIsoDate(body.serviceDate, "serviceDate")}::date,${nullableUuid(body.vehicleId)}::uuid,${nullableUuid(body.driverId)}::uuid,${nullableUuid(body.guideId)}::uuid,'planned',${text(body.notes, 1000)},${now},${now},${token}::uuid) RETURNING ${fields.assignments}`;
        break;
    }
    try {
      return apiValue((await this.database.rows<Record<string, unknown>>(query))[0]!);
    } catch (error) {
      if (String(error).includes("23505"))
        throw new DomainError(
          409,
          "The operations record conflicts with an existing record.",
          "Conflict",
        );
      throw error;
    }
  }

  private async validate(
    resource: OperationResource,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (["tasks", "arrivals", "assignments"].includes(resource))
      await this.operationalBooking(uuid(body.bookingId, "bookingId"));
    if (["tasks", "vehicles"].includes(resource) && body.supplierId)
      await this.active("suppliers", uuid(body.supplierId, "supplierId"));
    if (resource === "assignments") {
      if (!body.vehicleId && !body.driverId && !body.guideId)
        throw validation("Assign at least one vehicle, driver, or guide.");
      if (body.vehicleId) await this.active("vehicles", uuid(body.vehicleId, "vehicleId"));
      if (body.driverId) await this.active("drivers", uuid(body.driverId, "driverId"));
      if (body.guideId) await this.active("guides", uuid(body.guideId, "guideId"));
    }
  }
  private async operationalBooking(id: string): Promise<void> {
    const rows = await this.database.rows<{ status: string }>(
      Prisma.sql`SELECT status FROM bookings.bookings WHERE id=${id}::uuid LIMIT 1`,
    );
    if (!rows[0]) throw new DomainError(404, "The booking reference was not found.", "Not Found");
    if (["cancelled", "refunded"].includes(rows[0].status))
      throw new DomainError(
        409,
        "Operations cannot be scheduled for a cancelled or refunded booking.",
        "Conflict",
      );
  }
  private async active(table: string, id: string): Promise<void> {
    const rows = await this.database.rows<{ ok: boolean }>(
      Prisma.sql`SELECT EXISTS(SELECT 1 FROM ${Prisma.raw(`supplier_operations.${table}`)} WHERE "Id"=${id}::uuid AND "Status"='active') AS ok`,
    );
    if (!rows[0]?.ok)
      throw new DomainError(
        404,
        "An active operations resource reference was not found.",
        "Not Found",
      );
  }
}

function tableName(resource: OperationResource): string {
  return resource === "tasks"
    ? "booking_operation_tasks"
    : resource === "assignments"
      ? "booking_resource_assignments"
      : resource;
}
function validation(message: string): DomainError {
  return new DomainError(400, message, "Validation failed");
}
function text(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.trim().length > max)
    throw validation("Text value is invalid.");
  return value.trim() || null;
}
function requiredText(value: unknown, name: string, max: number): string {
  const result = text(value, max);
  if (!result) throw validation(`${name} is required.`);
  return result;
}
function uuid(value: unknown, name: string): string {
  if (typeof value !== "string") throw validation(`${name} is required.`);
  return requireUuid(value, name);
}
function nullableUuid(value: unknown): string | null {
  return value === null || value === undefined ? null : uuid(value, "referenceId");
}
function email(value: unknown): string | null {
  const result = text(value, 320);
  if (result && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(result))
    throw validation("Contact email is invalid.");
  return result;
}
function integer(value: unknown, name: string, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw validation(`${name} is invalid.`);
  return n;
}
function requiredDate(value: unknown, name: string): Date {
  if (typeof value !== "string") throw validation(`${name} is required.`);
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) throw validation(`${name} is invalid.`);
  return date;
}
