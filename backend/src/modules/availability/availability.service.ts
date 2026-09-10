import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { availabilityWindow, type AvailabilityWindowInput } from "./availability-window";

interface ProductAvailabilityRow {
  id: string;
  slug: string;
  productType: string;
  startingPrice: Prisma.Decimal | null;
  currency: string;
  bookingMode: string | null;
  pricingUnit: string | null;
  timeZone: string | null;
  instantConfirmation: boolean | null;
  maximumGroupSize: number | null;
}

@Injectable()
export class AvailabilityService {
  public constructor(private readonly database: DatabaseService) {}

  public async product(slug: string, input: AvailabilityWindowInput) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
      throw new DomainError(400, "Product slug format is invalid.", "Validation failed");
    }
    const products = await this.database.rows<ProductAvailabilityRow>(Prisma.sql`
      SELECT p.id, p.slug, pt.slug AS "productType", p.starting_price AS "startingPrice",
             p.currency, profile.booking_mode AS "bookingMode",
             profile.pricing_unit AS "pricingUnit", profile.time_zone AS "timeZone",
             profile.instant_confirmation AS "instantConfirmation",
             profile.maximum_group_size AS "maximumGroupSize"
        FROM catalogue.products p
        JOIN catalogue.product_types pt ON pt.id = p.product_type_id
        LEFT JOIN catalogue.product_booking_profiles profile ON profile.product_id = p.id
       WHERE p.slug = ${slug} AND p.publication_state = 'Published'
       LIMIT 1`);
    const product = products[0];
    if (!product) {
      throw new DomainError(404, "The published product was not found.", "Product not found");
    }
    const window = availabilityWindow(input, new Date(), product.timeZone ?? "Asia/Colombo");
    if (product.productType === "experience") {
      return this.experience(product, window);
    }
    if (["accommodation", "stay"].includes(product.productType)) {
      if (window.dayCount < 1) {
        throw new DomainError(400, "Check-out must be after check-in.", "Validation failed", {
          endDate: ["Check-out must be after check-in."],
        });
      }
      return this.stay(product, window);
    }
    throw new DomainError(
      409,
      "Availability is not configured for this product type.",
      "Availability unavailable",
    );
  }

  private async experience(
    product: ProductAvailabilityRow,
    window: ReturnType<typeof availabilityWindow>,
  ) {
    const participants = window.adults + window.children;
    if (product.maximumGroupSize !== null && participants > product.maximumGroupSize) {
      throw new DomainError(
        400,
        `This experience accepts at most ${product.maximumGroupSize} participants per booking.`,
        "Validation failed",
        { adults: ["The selected group is too large."] },
      );
    }
    const slots = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT s.id, s.starts_at_utc AS "startsAtUtc", s.ends_at_utc AS "endsAtUtc",
             s.capacity - s.reserved_capacity AS "remainingCapacity",
             s.minimum_participants AS "minimumParticipants",
             COALESCE(s.price_override, p.starting_price) AS price,
             s.currency, profile.instant_confirmation AS "instantConfirmation"
        FROM bookings.experience_slots s
        JOIN catalogue.products p ON p.id = s.product_id
        LEFT JOIN catalogue.product_booking_profiles profile ON profile.product_id = p.id
       WHERE s.product_id = ${product.id}::uuid
         AND s.status = 'open'
         AND (s.starts_at_utc AT TIME ZONE COALESCE(profile.time_zone, 'Asia/Colombo'))::date
             BETWEEN ${window.startDate}::date AND ${window.endDate}::date
         AND s.starts_at_utc - make_interval(mins => s.booking_cutoff_minutes) > CURRENT_TIMESTAMP
         AND s.capacity - s.reserved_capacity >= ${participants}
         AND s.minimum_participants <= ${participants}
       ORDER BY s.starts_at_utc`);
    return apiValue({
      kind: "experience",
      productId: product.id,
      productSlug: product.slug,
      bookingMode: product.bookingMode ?? "request",
      pricingUnit: product.pricingUnit ?? "person",
      timeZone: product.timeZone ?? "Asia/Colombo",
      search: { ...window, participants },
      slots,
    });
  }

  private async stay(
    product: ProductAvailabilityRow,
    window: ReturnType<typeof availabilityWindow>,
  ) {
    const rooms = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT rt.id, rt.name, rt.slug, rt.description, rt.maximum_adults AS "maximumAdults",
             rt.maximum_children AS "maximumChildren", rt.beds, rt.bathrooms,
             rt.amenities, rt.meal_plan AS "mealPlan", rt.currency,
             rt.cancellation_policy AS "cancellationPolicy",
             MIN(i.capacity - i.reserved_capacity)::int AS "availableUnits",
             SUM(COALESCE(i.price_override, rt.base_price)) * ${window.rooms} AS "totalPrice",
             MAX(i.minimum_stay_nights)::int AS "minimumStayNights"
        FROM catalogue.room_types rt
        JOIN bookings.room_night_inventory i ON i.room_type_id = rt.id
       WHERE rt.product_id = ${product.id}::uuid AND rt.is_active = TRUE
         AND rt.maximum_adults * ${window.rooms} >= ${window.adults}
         AND rt.maximum_children * ${window.rooms} >= ${window.children}
         AND i.stay_date >= ${window.startDate}::date AND i.stay_date < ${window.endDate}::date
       GROUP BY rt.id
      HAVING COUNT(*) = ${window.dayCount}
         AND BOOL_AND(i.is_closed = FALSE)
         AND MIN(i.capacity - i.reserved_capacity) >= ${window.rooms}
         AND ${window.dayCount} >= MAX(i.minimum_stay_nights)
       ORDER BY SUM(COALESCE(i.price_override, rt.base_price)), rt.name`);
    return apiValue({
      kind: "stay",
      productId: product.id,
      productSlug: product.slug,
      bookingMode: product.bookingMode ?? "request",
      pricingUnit: product.pricingUnit ?? "night",
      timeZone: product.timeZone ?? "Asia/Colombo",
      search: window,
      roomTypes: rooms,
    });
  }
}
