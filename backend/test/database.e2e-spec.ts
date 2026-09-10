import { PrismaClient, type Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { DatabaseService } from "../src/database/database.service";
import { AvailabilityService } from "../src/modules/availability/availability.service";

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase("PostgreSQL baseline and reviewed additions", () => {
  const prisma = new PrismaClient();

  afterAll(async () => prisma.$disconnect());

  it("can read every preserved application schema after reviewed migrations", async () => {
    await prisma.$connect();
    const rows = await prisma.$queryRaw<Array<{ schemaName: string }>>`
      SELECT schema_name AS "schemaName"
      FROM information_schema.schemata
      WHERE schema_name IN (
        'catalogue', 'identity_access', 'organisations_agents', 'customers_travellers',
        'itineraries_travel_planning', 'quotes', 'bookings', 'payments', 'supplier_operations'
      )
      ORDER BY schema_name`;
    expect(rows.map((row) => row.schemaName)).toEqual([
      "bookings",
      "catalogue",
      "customers_travellers",
      "identity_access",
      "itineraries_travel_planning",
      "organisations_agents",
      "payments",
      "quotes",
      "supplier_operations",
    ]);

    const [tableCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema IN (
          'catalogue', 'identity_access', 'organisations_agents', 'customers_travellers',
          'itineraries_travel_planning', 'quotes', 'bookings', 'payments', 'supplier_operations'
        )`;
    // 55 cutover tables, four authentication tables, and four availability tables.
    expect(Number(tableCount?.count)).toBe(63);

    const [checkCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'c'
        AND c.conname LIKE 'ck_%'
        AND n.nspname IN (
          'catalogue', 'customers_travellers', 'itineraries_travel_planning',
          'quotes', 'bookings', 'payments'
        )`;
    // The cutover constraints remain, plus reviewed authentication and availability invariants.
    expect(Number(checkCount?.count)).toBe(66);

    const [searchVector] = await prisma.$queryRaw<Array<{ generated: string }>>`
      SELECT is_generated AS generated
      FROM information_schema.columns
      WHERE table_schema = 'catalogue' AND table_name = 'products'
        AND column_name = 'search_vector'`;
    expect(searchVector?.generated).toBe("ALWAYS");
  });

  it("executes capacity and every-night availability rules in PostgreSQL", async () => {
    const rollback = new Error("rollback availability fixtures");
    await expect(
      prisma.$transaction(async (tx) => {
        const productTypes = await tx.$queryRaw<Array<{ id: string; slug: string }>>`
          SELECT id, slug FROM catalogue.product_types
          WHERE slug IN ('experience', 'accommodation')`;
        const experienceType = productTypes.find(({ slug }) => slug === "experience");
        const stayType = productTypes.find(({ slug }) => slug === "accommodation");
        expect(experienceType).toBeDefined();
        expect(stayType).toBeDefined();

        const experienceId = randomUUID();
        const stayId = randomUUID();
        const now = new Date();
        await tx.$executeRaw`
          INSERT INTO catalogue.products(
            id, concurrency_token, created_at_utc, currency, description, name, product_type_id,
            publication_state, short_description, slug, starting_price, updated_at_utc)
          VALUES
            (${experienceId}::uuid, ${randomUUID()}::uuid, ${now}, 'USD', 'Test experience',
             'Availability test experience', ${experienceType!.id}::uuid, 'Published',
             'Test fixture', ${`availability-experience-${experienceId}`}, 50, ${now}),
            (${stayId}::uuid, ${randomUUID()}::uuid, ${now}, 'USD', 'Test stay',
             'Availability test stay', ${stayType!.id}::uuid, 'Published',
             'Test fixture', ${`availability-stay-${stayId}`}, 120, ${now})`;
        await tx.productBookingProfile.createMany({
          data: [
            {
              productId: experienceId,
              bookingMode: "instant",
              pricingUnit: "person",
              timeZone: "Asia/Colombo",
            },
            {
              productId: stayId,
              bookingMode: "request",
              pricingUnit: "night",
              timeZone: "Asia/Colombo",
            },
          ],
        });
        await tx.experienceSlot.create({
          data: {
            productId: experienceId,
            startsAtUtc: new Date("2099-10-10T03:30:00.000Z"),
            capacity: 4,
            reservedCapacity: 3,
            minimumParticipants: 1,
            currency: "USD",
          },
        });
        const room = await tx.roomType.create({
          data: {
            productId: stayId,
            name: "Garden room",
            slug: "garden-room",
            maximumAdults: 2,
            maximumChildren: 1,
            roomQuantity: 2,
            bathrooms: 1,
            basePrice: 120,
            currency: "USD",
          },
        });
        await tx.roomNightInventory.create({
          data: {
            roomTypeId: room.id,
            stayDate: new Date("2099-10-10T00:00:00.000Z"),
            capacity: 2,
          },
        });
        const database = {
          rows: <T>(query: Prisma.Sql) => tx.$queryRaw<T[]>(query),
        } as DatabaseService;
        const availability = new AvailabilityService(database);

        const experience = await availability.product(`availability-experience-${experienceId}`, {
          startDate: "2099-10-10",
          endDate: "2099-10-10",
          adults: 1,
        });
        expect(experience).toMatchObject({ kind: "experience", slots: [{ remainingCapacity: 1 }] });

        const missingNight = await availability.product(`availability-stay-${stayId}`, {
          startDate: "2099-10-10",
          endDate: "2099-10-12",
          adults: 2,
          rooms: 1,
        });
        expect(missingNight).toMatchObject({ kind: "stay", roomTypes: [] });

        await tx.roomNightInventory.create({
          data: {
            roomTypeId: room.id,
            stayDate: new Date("2099-10-11T00:00:00.000Z"),
            capacity: 2,
            priceOverride: 140,
          },
        });
        const completeStay = await availability.product(`availability-stay-${stayId}`, {
          startDate: "2099-10-10",
          endDate: "2099-10-12",
          adults: 2,
          rooms: 1,
        });
        expect(completeStay).toMatchObject({
          kind: "stay",
          roomTypes: [{ name: "Garden room", availableUnits: 2, totalPrice: 260 }],
        });
        const twoRoomStay = await availability.product(`availability-stay-${stayId}`, {
          startDate: "2099-10-10",
          endDate: "2099-10-12",
          adults: 4,
          rooms: 2,
        });
        expect(twoRoomStay).toMatchObject({
          kind: "stay",
          roomTypes: [{ name: "Garden room", availableUnits: 2, totalPrice: 520 }],
        });
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
