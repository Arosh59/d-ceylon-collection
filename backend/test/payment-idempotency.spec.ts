import type { DatabaseService } from "../src/database/database.service";
import type { BookingsService } from "../src/modules/bookings/bookings.service";
import { PaymentsService } from "../src/modules/payments/payments.service";

describe("payment idempotency", () => {
  it("rejects a duplicate client key before inserting another payment", async () => {
    const db = {
      rows: jest.fn().mockResolvedValue([{ exists: true }]),
      $executeRaw: jest.fn(),
    } as unknown as DatabaseService;
    const bookings = {
      paymentSource: jest.fn().mockResolvedValue({
        status: "confirmed",
        totalAmount: 100,
        paidAmount: 0,
        currency: "USD",
      }),
    } as unknown as BookingsService;
    const service = new PaymentsService(db, bookings);
    await expect(
      service.create(
        "10000000-0000-4000-8000-000000000001",
        "20000000-0000-4000-8000-000000000001",
        { kind: "balance", gateway: "manual", idempotencyKey: "same-payment-key-001" },
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it.each(["short", "contains whitespace key", "a".repeat(65)])(
    "rejects invalid idempotency key %s",
    async (idempotencyKey) => {
      const db = {
        rows: jest.fn(),
        $executeRaw: jest.fn(),
      } as unknown as DatabaseService;
      const bookings = {
        paymentSource: jest.fn().mockResolvedValue({
          status: "confirmed",
          totalAmount: 100,
          paidAmount: 0,
          currency: "USD",
        }),
      } as unknown as BookingsService;
      const service = new PaymentsService(db, bookings);
      await expect(
        service.create(
          "10000000-0000-0000-0000-000000000001",
          "20000000-0000-0000-0000-000000000001",
          { kind: "balance", gateway: "manual", idempotencyKey },
        ),
      ).rejects.toMatchObject({ status: 400 });
      expect(db.$executeRaw).not.toHaveBeenCalled();
    },
  );

  it("maps a database uniqueness race to the same idempotency conflict", async () => {
    const db = {
      rows: jest.fn().mockResolvedValue([{ exists: false }]),
      $executeRaw: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("duplicate", {
          code: "P2002",
          clientVersion: "test",
        }),
      ),
    } as unknown as DatabaseService;
    const bookings = {
      paymentSource: jest.fn().mockResolvedValue({
        status: "confirmed",
        totalAmount: 100,
        paidAmount: 0,
        currency: "USD",
      }),
    } as unknown as BookingsService;
    const service = new PaymentsService(db, bookings);
    await expect(
      service.create(
        "10000000-0000-0000-0000-000000000001",
        "20000000-0000-0000-0000-000000000001",
        { kind: "balance", gateway: "manual", idempotencyKey: "payment-race-key-001" },
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it.each(["cancelled", "refunded", "completed"])(
    "rejects creation for a %s booking",
    async (status) => {
      const db = { rows: jest.fn(), $executeRaw: jest.fn() } as unknown as DatabaseService;
      const bookings = {
        paymentSource: jest.fn().mockResolvedValue({
          status,
          totalAmount: 100,
          paidAmount: 0,
          currency: "USD",
        }),
      } as unknown as BookingsService;
      await expect(
        new PaymentsService(db, bookings).create(
          "10000000-0000-0000-0000-000000000001",
          "20000000-0000-0000-0000-000000000001",
          { kind: "balance", gateway: "manual", idempotencyKey: "payment-state-key-001" },
        ),
      ).rejects.toMatchObject({ status: 409 });
    },
  );
});
import { Prisma } from "@prisma/client";
