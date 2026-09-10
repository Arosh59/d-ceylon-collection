import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { requireUuid } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import type {
  BookingProfileWriteRequest,
  ExperienceSlotWriteRequest,
  RoomInventoryWriteRequest,
  RoomTypeWriteRequest,
} from "./availability-admin.dto";

@Injectable()
export class AvailabilityAdministrationService {
  public constructor(private readonly database: DatabaseService) {}

  public async summary(productIdValue: string) {
    const product = await this.product(productIdValue);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const recent = new Date(today);
    recent.setUTCDate(recent.getUTCDate() - 90);
    const [profile, experienceSlots, roomTypes] = await Promise.all([
      this.database.productBookingProfile.findUnique({ where: { productId: product.id } }),
      this.database.experienceSlot.findMany({
        where: { productId: product.id, startsAtUtc: { gte: recent } },
        orderBy: { startsAtUtc: "asc" },
        take: 200,
      }),
      this.database.roomType.findMany({
        where: { productId: product.id },
        include: {
          inventory: {
            where: { stayDate: { gte: today } },
            orderBy: { stayDate: "asc" },
            take: 366,
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);
    return apiValue({ product, profile, experienceSlots, roomTypes });
  }

  public async saveProfile(productIdValue: string, body: BookingProfileWriteRequest) {
    const product = await this.product(productIdValue);
    const experience = product.productType.slug === "experience";
    if (!experience && !["accommodation", "stay"].includes(product.productType.slug)) {
      throw new DomainError(
        409,
        "Availability profiles are supported only for experiences and accommodation.",
        "Wrong product type",
      );
    }
    const allowedUnits = experience ? ["person", "group"] : ["night", "room"];
    if (!allowedUnits.includes(body.pricingUnit)) {
      throw validation("pricingUnit", "Pricing unit does not match this product type.");
    }
    const data = {
      bookingMode: body.bookingMode,
      pricingUnit: body.pricingUnit,
      timeZone: timeZone(body.timeZone),
      meetingPoint: clean(body.meetingPoint),
      pickupAvailable: body.pickupAvailable,
      pickupInstructions: clean(body.pickupInstructions),
      languages: list(body.languages, 80),
      minimumAge: body.minimumAge ?? null,
      maximumGroupSize: body.maximumGroupSize ?? null,
      accessibilityInformation: clean(body.accessibilityInformation),
      inclusions: list(body.inclusions, 500),
      exclusions: list(body.exclusions, 500),
      whatToBring: list(body.whatToBring, 500),
      importantInformation: list(body.importantInformation, 500),
      cancellationPolicy: clean(body.cancellationPolicy),
      weatherPolicy: clean(body.weatherPolicy),
      instantConfirmation: body.instantConfirmation,
      updatedAtUtc: new Date(),
      concurrencyToken: randomUUID(),
    };
    const existing = await this.database.productBookingProfile.findUnique({
      where: { productId: product.id },
    });
    if (!existing) {
      try {
        return apiValue(
          await this.database.productBookingProfile.create({
            data: { productId: product.id, ...data },
          }),
        );
      } catch (error) {
        uniqueConflict(
          error,
          "A booking profile was created by another request. Reload and retry.",
        );
      }
    }
    if (!body.concurrencyToken || existing.concurrencyToken !== body.concurrencyToken) conflict();
    const changed = await this.database.productBookingProfile.updateMany({
      where: { productId: product.id, concurrencyToken: body.concurrencyToken },
      data,
    });
    if (changed.count !== 1) conflict();
    return apiValue(
      await this.database.productBookingProfile.findUniqueOrThrow({
        where: { productId: product.id },
      }),
    );
  }

  public async createExperienceSlot(productIdValue: string, body: ExperienceSlotWriteRequest) {
    const product = await this.product(productIdValue, "experience");
    const data = slotData(body);
    try {
      return apiValue(
        await this.database.experienceSlot.create({ data: { productId: product.id, ...data } }),
      );
    } catch (error) {
      uniqueConflict(error, "A slot already exists at this start time.");
    }
  }

  public async updateExperienceSlot(
    productIdValue: string,
    slotIdValue: string,
    body: ExperienceSlotWriteRequest,
  ) {
    const product = await this.product(productIdValue, "experience");
    const slotId = requireUuid(slotIdValue, "slotId");
    if (!body.concurrencyToken) conflict();
    const existing = await this.database.experienceSlot.findFirst({
      where: { id: slotId, productId: product.id },
    });
    if (!existing) notFound("Experience slot");
    if (existing.concurrencyToken !== body.concurrencyToken) conflict();
    if (body.capacity < existing.reservedCapacity) {
      throw validation("capacity", "Capacity cannot be lower than already reserved places.");
    }
    try {
      const changed = await this.database.experienceSlot.updateMany({
        where: {
          id: slotId,
          productId: product.id,
          concurrencyToken: body.concurrencyToken,
          reservedCapacity: { lte: body.capacity },
        },
        data: slotData(body),
      });
      if (changed.count !== 1) conflict();
      return apiValue(
        await this.database.experienceSlot.findUniqueOrThrow({ where: { id: slotId } }),
      );
    } catch (error) {
      uniqueConflict(error, "A slot already exists at this start time.");
    }
  }

  public async createRoomType(productIdValue: string, body: RoomTypeWriteRequest) {
    const product = await this.product(productIdValue, "accommodation");
    try {
      return apiValue(
        await this.database.roomType.create({ data: { productId: product.id, ...roomData(body) } }),
      );
    } catch (error) {
      uniqueConflict(error, "A room type with this slug already exists for the property.");
    }
  }

  public async updateRoomType(
    productIdValue: string,
    roomTypeIdValue: string,
    body: RoomTypeWriteRequest,
  ) {
    const product = await this.product(productIdValue, "accommodation");
    const roomTypeId = requireUuid(roomTypeIdValue, "roomTypeId");
    if (!body.concurrencyToken) conflict();
    const existing = await this.database.roomType.findFirst({
      where: { id: roomTypeId, productId: product.id },
    });
    if (!existing) notFound("Room type");
    if (existing.concurrencyToken !== body.concurrencyToken) conflict();
    const inventoryMaximum = await this.database.roomNightInventory.aggregate({
      where: { roomTypeId },
      _max: { capacity: true },
    });
    if ((inventoryMaximum._max.capacity ?? 0) > body.roomQuantity) {
      throw validation(
        "roomQuantity",
        "Physical room quantity cannot be lower than configured nightly inventory.",
      );
    }
    try {
      const changed = await this.database.roomType.updateMany({
        where: { id: roomTypeId, productId: product.id, concurrencyToken: body.concurrencyToken },
        data: roomData(body),
      });
      if (changed.count !== 1) conflict();
      return apiValue(
        await this.database.roomType.findUniqueOrThrow({ where: { id: roomTypeId } }),
      );
    } catch (error) {
      uniqueConflict(error, "A room type with this slug already exists for the property.");
    }
  }

  public async saveRoomInventory(
    productIdValue: string,
    roomTypeIdValue: string,
    body: RoomInventoryWriteRequest,
  ) {
    const product = await this.product(productIdValue, "accommodation");
    const roomTypeId = requireUuid(roomTypeIdValue, "roomTypeId");
    const room = await this.database.roomType.findFirst({
      where: { id: roomTypeId, productId: product.id },
    });
    if (!room) notFound("Room type");
    if (body.capacity > room.roomQuantity) {
      throw validation("capacity", "Nightly capacity cannot exceed the room quantity.");
    }
    const stayDate = calendarDate(body.stayDate);
    const existing = await this.database.roomNightInventory.findUnique({
      where: { roomTypeId_stayDate: { roomTypeId, stayDate } },
    });
    const data = {
      stayDate,
      capacity: body.capacity,
      priceOverride: body.priceOverride ?? null,
      minimumStayNights: body.minimumStayNights,
      isClosed: body.isClosed,
      updatedAtUtc: new Date(),
      concurrencyToken: randomUUID(),
    };
    if (!existing) {
      return apiValue(
        await this.database.roomNightInventory.create({ data: { roomTypeId, ...data } }),
      );
    }
    if (!body.concurrencyToken || existing.concurrencyToken !== body.concurrencyToken) conflict();
    if (body.capacity < existing.reservedCapacity) {
      throw validation("capacity", "Capacity cannot be lower than already reserved rooms.");
    }
    const changed = await this.database.roomNightInventory.updateMany({
      where: {
        id: existing.id,
        concurrencyToken: body.concurrencyToken,
        reservedCapacity: { lte: body.capacity },
      },
      data,
    });
    if (changed.count !== 1) conflict();
    return apiValue(
      await this.database.roomNightInventory.findUniqueOrThrow({ where: { id: existing.id } }),
    );
  }

  private async product(idValue: string, expectedType?: "accommodation" | "experience") {
    const id = requireUuid(idValue, "productId");
    const product = await this.database.product.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, currency: true, productType: true },
    });
    if (!product) notFound("Product");
    if (
      expectedType &&
      product.productType.slug !== expectedType &&
      !(expectedType === "accommodation" && product.productType.slug === "stay")
    ) {
      throw new DomainError(
        409,
        `This operation requires an ${expectedType} product.`,
        "Wrong product type",
      );
    }
    return product;
  }
}

function slotData(body: ExperienceSlotWriteRequest) {
  const startsAtUtc = new Date(body.startsAtUtc);
  const endsAtUtc = body.endsAtUtc ? new Date(body.endsAtUtc) : null;
  if (endsAtUtc && endsAtUtc <= startsAtUtc) {
    throw validation("endsAtUtc", "End time must be after start time.");
  }
  if (body.minimumParticipants > body.capacity) {
    throw validation("minimumParticipants", "Minimum participants cannot exceed capacity.");
  }
  return {
    startsAtUtc,
    endsAtUtc,
    capacity: body.capacity,
    minimumParticipants: body.minimumParticipants,
    priceOverride: body.priceOverride ?? null,
    currency: body.currency.toUpperCase(),
    status: body.status,
    bookingCutoffMinutes: body.bookingCutoffMinutes,
    updatedAtUtc: new Date(),
    concurrencyToken: randomUUID(),
  };
}

function roomData(body: RoomTypeWriteRequest) {
  return {
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: clean(body.description),
    maximumAdults: body.maximumAdults,
    maximumChildren: body.maximumChildren,
    roomQuantity: body.roomQuantity,
    beds: clean(body.beds),
    bathrooms: body.bathrooms,
    amenities: list(body.amenities, 160),
    mealPlan: clean(body.mealPlan),
    basePrice: body.basePrice,
    currency: body.currency.toUpperCase(),
    cancellationPolicy: clean(body.cancellationPolicy),
    isActive: body.isActive,
    updatedAtUtc: new Date(),
    concurrencyToken: randomUUID(),
  };
}

function calendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value))
    throw validation("stayDate", "Stay date must use YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw validation("stayDate", "Stay date must be a real calendar date.");
  }
  return date;
}

function timeZone(value: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    throw validation("timeZone", "Time zone must be a valid IANA identifier.");
  }
}

function list(values: string[], maximumLength: number): string[] {
  const cleaned = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (cleaned.some((value) => value.length > maximumLength)) {
    throw new DomainError(400, "A list item is too long.", "Validation failed");
  }
  return cleaned;
}

function clean(value: string | undefined): string | null {
  return value?.trim() || null;
}

function validation(field: string, detail: string): DomainError {
  return new DomainError(400, detail, "Validation failed", { [field]: [detail] });
}

function conflict(): never {
  throw new DomainError(409, "The record changed. Reload and try again.", "Conflict");
}

function notFound(label: string): never {
  throw new DomainError(404, `${label} was not found.`, "Not found");
}

function uniqueConflict(error: unknown, detail: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new DomainError(409, detail, "Conflict");
  }
  throw error;
}
