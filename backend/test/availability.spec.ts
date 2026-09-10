import type { DatabaseService } from "../src/database/database.service";
import { AvailabilityAdministrationService } from "../src/modules/availability/availability-admin.service";
import { AvailabilityService } from "../src/modules/availability/availability.service";
import { availabilityWindow } from "../src/modules/availability/availability-window";

describe("availability business rules", () => {
  it("normalizes traveller and room counts within a bounded future window", () => {
    expect(
      availabilityWindow(
        {
          startDate: "2026-10-10",
          endDate: "2026-10-13",
          adults: "2",
          children: "1",
          rooms: "2",
        },
        new Date("2026-09-10T12:00:00.000Z"),
      ),
    ).toEqual({
      startDate: "2026-10-10",
      endDate: "2026-10-13",
      adults: 2,
      children: 1,
      rooms: 2,
      dayCount: 3,
    });
  });

  it.each([
    [{ startDate: "2026-09-09", endDate: "2026-09-10" }, "past"],
    [{ startDate: "2026-02-30", endDate: "2026-03-01" }, "calendar"],
    [{ startDate: "2026-10-10", endDate: "2027-01-01" }, "62 days"],
    [{ startDate: "2026-10-10", endDate: "2026-10-11", adults: 0 }, "between 1 and 30"],
  ])("rejects an invalid window (%s)", (input, message) => {
    expect(() => availabilityWindow(input, new Date("2026-09-10T12:00:00.000Z"))).toThrow(message);
  });

  it("returns only server-calculated experience slots", async () => {
    const rows = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "10000000-0000-4000-8000-000000000001",
          slug: "tea-estate",
          productType: "experience",
          startingPrice: 45,
          currency: "USD",
          bookingMode: "instant",
          pricingUnit: "person",
          timeZone: "Asia/Colombo",
          instantConfirmation: true,
          maximumGroupSize: 8,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "20000000-0000-4000-8000-000000000001",
          startsAtUtc: "2099-10-10T03:30:00.000Z",
          remainingCapacity: 6,
          price: 45,
          currency: "USD",
        },
      ]);
    const service = new AvailabilityService({ rows } as unknown as DatabaseService);

    const result = (await service.product("tea-estate", {
      startDate: "2099-10-10",
      endDate: "2099-10-10",
      adults: 2,
    })) as Record<string, unknown>;

    expect(result).toMatchObject({
      kind: "experience",
      bookingMode: "instant",
      search: { participants: 2 },
    });
    expect(result.slots).toHaveLength(1);
    expect(rows).toHaveBeenCalledTimes(2);
  });

  it("requires every stay to include at least one night", async () => {
    const rows = jest.fn().mockResolvedValueOnce([
      {
        id: "10000000-0000-4000-8000-000000000002",
        slug: "canopy-stay",
        productType: "accommodation",
        startingPrice: 180,
        currency: "USD",
        bookingMode: "request",
        pricingUnit: "night",
        timeZone: "Asia/Colombo",
        instantConfirmation: false,
        maximumGroupSize: null,
      },
    ]);
    const service = new AvailabilityService({ rows } as unknown as DatabaseService);

    await expect(
      service.product("canopy-stay", {
        startDate: "2099-10-10",
        endDate: "2099-10-10",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(rows).toHaveBeenCalledTimes(1);
  });
});

describe("availability administration rules", () => {
  const product = {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Tea trail",
    slug: "tea-trail",
    currency: "USD",
    productType: { slug: "experience" },
  };

  it("rejects a stay pricing unit for an experience", async () => {
    const database = {
      product: { findUnique: jest.fn().mockResolvedValue(product) },
    } as unknown as DatabaseService;
    const service = new AvailabilityAdministrationService(database);

    await expect(
      service.saveProfile(product.id, {
        bookingMode: "request",
        pricingUnit: "night",
        timeZone: "Asia/Colombo",
        pickupAvailable: false,
        languages: [],
        inclusions: [],
        exclusions: [],
        whatToBring: [],
        importantInformation: [],
        instantConfirmation: false,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("does not allow capacity to drop below reservations", async () => {
    const database = {
      product: { findUnique: jest.fn().mockResolvedValue(product) },
      experienceSlot: {
        findFirst: jest.fn().mockResolvedValue({
          id: "20000000-0000-4000-8000-000000000001",
          reservedCapacity: 4,
          concurrencyToken: "30000000-0000-4000-8000-000000000001",
        }),
      },
    } as unknown as DatabaseService;
    const service = new AvailabilityAdministrationService(database);

    await expect(
      service.updateExperienceSlot(product.id, "20000000-0000-4000-8000-000000000001", {
        startsAtUtc: "2099-10-10T03:30:00.000Z",
        capacity: 3,
        minimumParticipants: 1,
        currency: "USD",
        status: "open",
        bookingCutoffMinutes: 0,
        concurrencyToken: "30000000-0000-4000-8000-000000000001",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
