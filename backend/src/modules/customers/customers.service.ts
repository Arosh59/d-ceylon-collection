import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { optionalIsoDate } from "../../common/date-validation";
import { DatabaseService } from "../../database/database.service";

export interface CustomerInput {
  givenName?: string;
  familyName?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  countryCode?: string | null;
  preferredLocale?: string;
  preferredContactMethod?: string;
  marketingConsent?: boolean;
}

export interface TravellerInput {
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string | null;
  accessibilityNeeds?: string | null;
  dietaryNeeds?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface SavedItineraryInput {
  title?: string;
  summary?: string | null;
  travelStartDate?: string | null;
  travelEndDate?: string | null;
  primaryDestinationSlug?: string | null;
}

type CustomerTable = "customer_profiles" | "saved_itineraries" | "travellers" | "wishlist_entries";

@Injectable()
export class CustomersService {
  public constructor(private readonly database: DatabaseService) {}

  public async getProfile(customerId: string): Promise<Record<string, unknown>> {
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT id, given_name AS "givenName", family_name AS "familyName",
             contact_email AS "contactEmail", contact_phone AS "contactPhone",
             country_code AS "countryCode", preferred_locale AS "preferredLocale",
             preferred_contact_method AS "preferredContactMethod",
             marketing_consent AS "marketingConsent", concurrency_token AS "concurrencyToken",
             updated_at_utc AS "updatedAtUtc"
        FROM customers_travellers.customer_profiles WHERE customer_id=${customerId}::uuid LIMIT 1
    `);
    if (!rows[0]) throw new DomainError(404, "Customer profile not found.", "Not Found");
    return apiValue(rows[0]);
  }

  public async createProfile(
    customerId: string,
    input: CustomerInput,
  ): Promise<Record<string, unknown>> {
    validateProfile(input);
    const now = new Date();
    try {
      const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
        INSERT INTO customers_travellers.customer_profiles
          (id, customer_id, given_name, family_name, contact_email, contact_phone, country_code,
           preferred_locale, preferred_contact_method, marketing_consent,
           created_at_utc, updated_at_utc, concurrency_token)
        VALUES (${randomUUID()}::uuid, ${customerId}::uuid, ${cleanRequired(input.givenName)},
                ${cleanRequired(input.familyName)}, ${clean(input.contactEmail)}, ${clean(input.contactPhone)},
                ${clean(input.countryCode)?.toUpperCase() ?? null}, ${input.preferredLocale ?? "en-LK"},
                ${input.preferredContactMethod ?? "email"}, ${input.marketingConsent ?? false},
                ${now}, ${now}, ${randomUUID()}::uuid)
        RETURNING id, given_name AS "givenName", family_name AS "familyName",
          contact_email AS "contactEmail", contact_phone AS "contactPhone", country_code AS "countryCode",
          preferred_locale AS "preferredLocale", preferred_contact_method AS "preferredContactMethod",
          marketing_consent AS "marketingConsent", concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
      `);
      return apiValue(rows[0]!);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new DomainError(409, "A customer profile already exists.", "Conflict");
      throw error;
    }
  }

  public async updateProfile(
    customerId: string,
    input: CustomerInput & { concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    validateProfile(input);
    const token = requiredToken(input.concurrencyToken);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      UPDATE customers_travellers.customer_profiles SET
        given_name=${cleanRequired(input.givenName)}, family_name=${cleanRequired(input.familyName)},
        contact_email=${clean(input.contactEmail)}, contact_phone=${clean(input.contactPhone)},
        country_code=${clean(input.countryCode)?.toUpperCase() ?? null}, preferred_locale=${input.preferredLocale ?? "en-LK"},
        preferred_contact_method=${input.preferredContactMethod ?? "email"}, marketing_consent=${input.marketingConsent ?? false},
        updated_at_utc=${new Date()}, concurrency_token=${randomUUID()}::uuid
      WHERE customer_id=${customerId}::uuid AND concurrency_token=${token}::uuid
      RETURNING id, given_name AS "givenName", family_name AS "familyName", contact_email AS "contactEmail",
        contact_phone AS "contactPhone", country_code AS "countryCode", preferred_locale AS "preferredLocale",
        preferred_contact_method AS "preferredContactMethod", marketing_consent AS "marketingConsent",
        concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
    `);
    if (!rows[0]) await this.notFoundOrConflict("customer_profiles", customerId);
    return apiValue(rows[0]!);
  }

  public async getTravellers(
    customerId: string,
    query: PageQuery,
  ): Promise<Record<string, unknown>> {
    const p = pagination(query);
    return this.customerPage(
      "travellers",
      Prisma.sql`family_name, given_name, id`,
      Prisma.sql`id, given_name AS "givenName", family_name AS "familyName", to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        accessibility_needs AS "accessibilityNeeds", dietary_needs AS "dietaryNeeds",
        emergency_contact_name AS "emergencyContactName", emergency_contact_phone AS "emergencyContactPhone",
        concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"`,
      customerId,
      p,
    );
  }

  public getTraveller(customerId: string, id: string): Promise<Record<string, unknown>> {
    return this.customerOne(
      "travellers",
      customerId,
      id,
      Prisma.sql`
      id, given_name AS "givenName", family_name AS "familyName", to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
      accessibility_needs AS "accessibilityNeeds", dietary_needs AS "dietaryNeeds",
      emergency_contact_name AS "emergencyContactName", emergency_contact_phone AS "emergencyContactPhone",
      concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
    `,
    );
  }

  public async createTraveller(
    customerId: string,
    input: TravellerInput,
  ): Promise<Record<string, unknown>> {
    validateTraveller(input);
    const now = new Date();
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      INSERT INTO customers_travellers.travellers
        (id, customer_id, given_name, family_name, date_of_birth, accessibility_needs, dietary_needs,
         emergency_contact_name, emergency_contact_phone, created_at_utc, updated_at_utc, concurrency_token)
      VALUES (${randomUUID()}::uuid, ${customerId}::uuid, ${cleanRequired(input.givenName)}, ${cleanRequired(input.familyName)},
              ${clean(input.dateOfBirth)}::date, ${clean(input.accessibilityNeeds)}, ${clean(input.dietaryNeeds)},
              ${clean(input.emergencyContactName)}, ${clean(input.emergencyContactPhone)}, ${now}, ${now}, ${randomUUID()}::uuid)
      RETURNING id, given_name AS "givenName", family_name AS "familyName", to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        accessibility_needs AS "accessibilityNeeds", dietary_needs AS "dietaryNeeds",
        emergency_contact_name AS "emergencyContactName", emergency_contact_phone AS "emergencyContactPhone",
        concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
    `);
    return apiValue(rows[0]!);
  }

  public async updateTraveller(
    customerId: string,
    id: string,
    input: TravellerInput & { concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(id);
    validateTraveller(input);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      UPDATE customers_travellers.travellers SET
        given_name=${cleanRequired(input.givenName)}, family_name=${cleanRequired(input.familyName)},
        date_of_birth=${clean(input.dateOfBirth)}::date, accessibility_needs=${clean(input.accessibilityNeeds)},
        dietary_needs=${clean(input.dietaryNeeds)}, emergency_contact_name=${clean(input.emergencyContactName)},
        emergency_contact_phone=${clean(input.emergencyContactPhone)}, updated_at_utc=${new Date()},
        concurrency_token=${randomUUID()}::uuid
      WHERE id=${id}::uuid AND customer_id=${customerId}::uuid AND concurrency_token=${requiredToken(input.concurrencyToken)}::uuid
      RETURNING id, given_name AS "givenName", family_name AS "familyName", to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        accessibility_needs AS "accessibilityNeeds", dietary_needs AS "dietaryNeeds",
        emergency_contact_name AS "emergencyContactName", emergency_contact_phone AS "emergencyContactPhone",
        concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"
    `);
    if (!rows[0]) await this.notFoundOrConflict("travellers", customerId, id);
    return apiValue(rows[0]!);
  }

  public async getWishlist(customerId: string, query: PageQuery): Promise<Record<string, unknown>> {
    const p = pagination(query);
    return this.customerPage(
      "wishlist_entries",
      Prisma.sql`created_at_utc DESC, id`,
      Prisma.sql`id, product_slug AS "productSlug", note, concurrency_token AS "concurrencyToken",
        created_at_utc AS "createdAtUtc", updated_at_utc AS "updatedAtUtc"`,
      customerId,
      p,
    );
  }

  public async createWishlist(
    customerId: string,
    input: { productSlug?: string; note?: string | null },
  ): Promise<Record<string, unknown>> {
    const slug = cleanRequired(input.productSlug);
    if (!slugPattern.test(slug) || slug.length > 200 || (input.note?.length ?? 0) > 500) {
      throw validation("Wishlist entry is invalid.");
    }
    const now = new Date();
    try {
      const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
        INSERT INTO customers_travellers.wishlist_entries
          (id, customer_id, product_slug, note, created_at_utc, updated_at_utc, concurrency_token)
        VALUES (${randomUUID()}::uuid, ${customerId}::uuid, ${slug}, ${clean(input.note)}, ${now}, ${now}, ${randomUUID()}::uuid)
        RETURNING id, product_slug AS "productSlug", note, concurrency_token AS "concurrencyToken",
          created_at_utc AS "createdAtUtc", updated_at_utc AS "updatedAtUtc"
      `);
      return apiValue(rows[0]!);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new DomainError(409, "This product is already in the wishlist.", "Conflict");
      throw error;
    }
  }

  public async updateWishlist(
    customerId: string,
    id: string,
    input: { note?: string | null; concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(id);
    if ((input.note?.length ?? 0) > 500) throw validation("Wishlist note is too long.");
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      UPDATE customers_travellers.wishlist_entries SET note=${clean(input.note)}, updated_at_utc=${new Date()}, concurrency_token=${randomUUID()}::uuid
       WHERE id=${id}::uuid AND customer_id=${customerId}::uuid AND concurrency_token=${requiredToken(input.concurrencyToken)}::uuid
       RETURNING id, product_slug AS "productSlug", note, concurrency_token AS "concurrencyToken",
         created_at_utc AS "createdAtUtc", updated_at_utc AS "updatedAtUtc"
    `);
    if (!rows[0]) await this.notFoundOrConflict("wishlist_entries", customerId, id);
    return apiValue(rows[0]!);
  }

  public async getSavedItineraries(
    customerId: string,
    query: PageQuery,
  ): Promise<Record<string, unknown>> {
    const p = pagination(query);
    return this.customerPage(
      "saved_itineraries",
      Prisma.sql`updated_at_utc DESC, id`,
      savedFields,
      customerId,
      p,
      Prisma.sql`AND is_archived=FALSE`,
    );
  }

  public getSavedItinerary(customerId: string, id: string): Promise<Record<string, unknown>> {
    return this.customerOne(
      "saved_itineraries",
      customerId,
      id,
      savedFields,
      Prisma.sql`AND is_archived=FALSE`,
    );
  }

  public async createSavedItinerary(
    customerId: string,
    input: SavedItineraryInput,
  ): Promise<Record<string, unknown>> {
    validateItinerary(input);
    const now = new Date();
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      INSERT INTO customers_travellers.saved_itineraries
        (id, customer_id, title, summary, travel_start_date, travel_end_date, primary_destination_slug,
         is_archived, created_at_utc, updated_at_utc, concurrency_token)
      VALUES (${randomUUID()}::uuid, ${customerId}::uuid, ${cleanRequired(input.title)}, ${clean(input.summary)},
              ${clean(input.travelStartDate)}::date, ${clean(input.travelEndDate)}::date,
              ${clean(input.primaryDestinationSlug)}, FALSE, ${now}, ${now}, ${randomUUID()}::uuid)
      RETURNING ${savedFields}
    `);
    return apiValue(rows[0]!);
  }

  public async updateSavedItinerary(
    customerId: string,
    id: string,
    input: SavedItineraryInput & { concurrencyToken?: string },
  ): Promise<Record<string, unknown>> {
    requireUuid(id);
    validateItinerary(input);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      UPDATE customers_travellers.saved_itineraries SET title=${cleanRequired(input.title)}, summary=${clean(input.summary)},
        travel_start_date=${clean(input.travelStartDate)}::date, travel_end_date=${clean(input.travelEndDate)}::date,
        primary_destination_slug=${clean(input.primaryDestinationSlug)}, updated_at_utc=${new Date()}, concurrency_token=${randomUUID()}::uuid
       WHERE id=${id}::uuid AND customer_id=${customerId}::uuid AND is_archived=FALSE
         AND concurrency_token=${requiredToken(input.concurrencyToken)}::uuid
       RETURNING ${savedFields}
    `);
    if (!rows[0]) await this.notFoundOrConflict("saved_itineraries", customerId, id, true);
    return apiValue(rows[0]!);
  }

  public async delete(
    table: CustomerTable,
    customerId: string,
    id: string | undefined,
    token: string | undefined,
    activeOnly = false,
  ): Promise<void> {
    if (id) requireUuid(id);
    const tableName = Prisma.raw(`customers_travellers.${table}`);
    const result = await this.database.$executeRaw(Prisma.sql`
      DELETE FROM ${tableName}
       WHERE customer_id=${customerId}::uuid
         ${id ? Prisma.sql`AND id=${id}::uuid` : Prisma.empty}
         ${activeOnly ? Prisma.sql`AND is_archived=FALSE` : Prisma.empty}
         AND concurrency_token=${requiredToken(token)}::uuid
    `);
    if (result === 0) await this.notFoundOrConflict(table, customerId, id, activeOnly);
  }

  private async customerPage(
    table: CustomerTable,
    order: Prisma.Sql,
    fields: Prisma.Sql,
    customerId: string,
    p: { pageNumber: number; pageSize: number; skip: number },
    extra = Prisma.empty,
  ): Promise<Record<string, unknown>> {
    const tableName = Prisma.raw(`customers_travellers.${table}`);
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM ${tableName} WHERE customer_id=${customerId}::uuid ${extra}`,
      ),
      this.database.rows<Record<string, unknown>>(
        Prisma.sql`SELECT ${fields} FROM ${tableName} WHERE customer_id=${customerId}::uuid ${extra} ORDER BY ${order} OFFSET ${p.skip} LIMIT ${p.pageSize}`,
      ),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  private async customerOne(
    table: CustomerTable,
    customerId: string,
    id: string,
    fields: Prisma.Sql,
    extra = Prisma.empty,
  ): Promise<Record<string, unknown>> {
    requireUuid(id);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT ${fields} FROM ${Prisma.raw(`customers_travellers.${table}`)}
       WHERE id=${id}::uuid AND customer_id=${customerId}::uuid ${extra} LIMIT 1
    `);
    if (!rows[0])
      throw new DomainError(404, "The requested customer record was not found.", "Not Found");
    return apiValue(rows[0]);
  }

  private async notFoundOrConflict(
    table: CustomerTable,
    customerId: string,
    id?: string,
    activeOnly = false,
  ): Promise<never> {
    const rows = await this.database.rows<{ exists: boolean }>(Prisma.sql`
      SELECT EXISTS(SELECT 1 FROM ${Prisma.raw(`customers_travellers.${table}`)}
       WHERE customer_id=${customerId}::uuid ${id ? Prisma.sql`AND id=${id}::uuid` : Prisma.empty}
       ${activeOnly ? Prisma.sql`AND is_archived=FALSE` : Prisma.empty}) AS exists
    `);
    if (!rows[0]?.exists)
      throw new DomainError(404, "The requested customer record was not found.", "Not Found");
    throw new DomainError(
      409,
      "The supplied concurrency token is not current.",
      "Concurrency conflict",
    );
  }
}

const savedFields = Prisma.sql`id, title, summary, to_char(travel_start_date, 'YYYY-MM-DD') AS "travelStartDate", to_char(travel_end_date, 'YYYY-MM-DD') AS "travelEndDate",
  primary_destination_slug AS "primaryDestinationSlug", is_archived AS "isArchived",
  concurrency_token AS "concurrencyToken", updated_at_utc AS "updatedAtUtc"`;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function clean(value: string | null | undefined): string | null {
  const result = value?.trim();
  return result ? result : null;
}
function cleanRequired(value: string | undefined): string {
  const result = value?.trim();
  if (!result) throw validation("Required fields cannot be empty.");
  return result;
}
function requiredToken(token: string | undefined): string {
  if (!token) throw validation("A concurrency token is required.");
  return requireUuid(token, "concurrencyToken");
}
function validation(message: string): DomainError {
  return new DomainError(400, message, "Validation failed");
}
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2010" &&
    String(error.meta?.message).includes("23505")
  );
}

function validateProfile(input: CustomerInput): void {
  const given = cleanRequired(input.givenName);
  const family = cleanRequired(input.familyName);
  if (given.length > 100 || family.length > 100)
    throw validation("Customer names must be at most 100 characters.");
  if (input.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(input.contactEmail))
    throw validation("Contact email is invalid.");
  if (input.countryCode && !/^[A-Za-z]{2}$/u.test(input.countryCode))
    throw validation("Country code is invalid.");
  const method = input.preferredContactMethod ?? "email";
  if (!["email", "phone"].includes(method))
    throw validation("Preferred contact method is invalid.");
  if (method === "email" && !clean(input.contactEmail))
    throw validation("A contact email is required when email is preferred.");
  if (method === "phone" && !clean(input.contactPhone))
    throw validation("A contact phone is required when phone is preferred.");
}

function validateTraveller(input: TravellerInput): void {
  if (cleanRequired(input.givenName).length > 100 || cleanRequired(input.familyName).length > 100)
    throw validation("Traveller names must be at most 100 characters.");
  if ((input.accessibilityNeeds?.length ?? 0) > 1000 || (input.dietaryNeeds?.length ?? 0) > 1000)
    throw validation("Traveller notes are too long.");
  if (Boolean(clean(input.emergencyContactName)) !== Boolean(clean(input.emergencyContactPhone)))
    throw validation("Emergency contact name and phone must be supplied together.");
  if (input.dateOfBirth) {
    const dateValue = optionalIsoDate(input.dateOfBirth, "dateOfBirth")!;
    const date = new Date(`${dateValue}T00:00:00Z`);
    const now = new Date();
    const oldest = new Date();
    oldest.setUTCFullYear(now.getUTCFullYear() - 120);
    if (!Number.isFinite(date.valueOf()) || date > now || date < oldest)
      throw validation("Date of birth must be in the past and no more than 120 years ago.");
  }
}

function validateItinerary(input: SavedItineraryInput): void {
  if (cleanRequired(input.title).length > 200 || (input.summary?.length ?? 0) > 2000)
    throw validation("Saved itinerary text is too long.");
  if (input.primaryDestinationSlug && !slugPattern.test(input.primaryDestinationSlug))
    throw validation("Primary destination slug is invalid.");
  optionalIsoDate(input.travelStartDate, "travelStartDate");
  optionalIsoDate(input.travelEndDate, "travelEndDate");
  if (input.travelStartDate && input.travelEndDate && input.travelEndDate < input.travelStartDate)
    throw validation("Travel end date cannot be before the start date.");
}
