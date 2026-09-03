import {
  bookingStatuses,
  cancel,
  complete,
  confirm,
  recordPayment,
  refund,
  requestCancellation,
  startTravel,
} from "../src/modules/bookings/booking-state";
import { calculate, currencyValue } from "../src/modules/quotes/quotes.service";
import {
  generateDraft,
  validateInput,
} from "../src/modules/travel-planning/travel-planning.service";
import { page, pagination, requireUuid } from "../src/common/pagination";
import { optionalIsoDate, requireIsoDate } from "../src/common/date-validation";

describe("pagination contract", () => {
  it("preserves nested metadata and empty-page behavior", () => {
    expect(page([], 0, 1, 20)).toEqual({
      items: [],
      pagination: {
        pageNumber: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
  });

  it("validates bounds and preserves legacy GUID personas", () => {
    expect(pagination({ pageNumber: "2", pageSize: "100" })).toEqual({
      pageNumber: 2,
      pageSize: 100,
      skip: 100,
    });
    expect(() => pagination({ pageNumber: 0 })).toThrow();
    expect(() => pagination({ pageSize: 101 })).toThrow();
    expect(requireUuid("10000000-0000-0000-0000-000000000001")).toBe(
      "10000000-0000-0000-0000-000000000001",
    );
  });
});

describe("date validation", () => {
  it("accepts real ISO dates and rejects normalized or locale-specific dates", () => {
    expect(requireIsoDate("2028-02-29", "date")).toBe("2028-02-29");
    expect(optionalIsoDate(null, "date")).toBeNull();
    expect(() => requireIsoDate("2027-02-29", "date")).toThrow();
    expect(() => requireIsoDate("03/09/2026", "date")).toThrow();
  });
});

describe("quote pricing", () => {
  it("matches deterministic .NET midpoint-to-even arithmetic", () => {
    const first = calculate(
      [
        { quantity: 1.25, unitAmount: 10.1 },
        { quantity: 2, unitAmount: 5 },
      ],
      [
        { kind: "tax", amount: 1.01 },
        { kind: "adjustment", amount: -0.63 },
      ],
    );
    expect(first).toEqual({
      subtotal: 22.62,
      taxTotal: 1.01,
      adjustmentTotal: -0.63,
      grandTotal: 23,
    });
    expect(
      calculate(
        [
          { quantity: 1.25, unitAmount: 10.1 },
          { quantity: 2, unitAmount: 5 },
        ],
        [
          { kind: "tax", amount: 1.01 },
          { kind: "adjustment", amount: -0.63 },
        ],
      ),
    ).toEqual(first);
  });

  it.each([
    ["EUR", "EUR"],
    ["gbp", "GBP"],
    [" LKR ", "LKR"],
    ["USD", "USD"],
  ])("normalizes supported currency %s", (input, expected) => {
    expect(currencyValue(input)).toBe(expected);
  });

  it("rejects unsupported currencies and excessive monetary precision", () => {
    expect(() => currencyValue("BTC")).toThrow();
    expect(() => calculate([{ quantity: 1, unitAmount: 10.001 }], [])).toThrow();
  });

  it("rounds line totals before applying taxes and adjustments", () => {
    expect(
      calculate(
        [
          { quantity: 3, unitAmount: 10.11 },
          { quantity: 1, unitAmount: 5 },
        ],
        [
          { kind: "tax", amount: 2.5 },
          { kind: "adjustment", amount: -1 },
        ],
      ),
    ).toEqual({ subtotal: 35.33, taxTotal: 2.5, adjustmentTotal: -1, grandTotal: 36.83 });
  });

  it("rejects negative grand totals", () => {
    expect(() =>
      calculate([{ quantity: 1, unitAmount: 1 }], [{ kind: "adjustment", amount: -2 }]),
    ).toThrow("outside the supported range");
  });
});

describe("deterministic travel planner", () => {
  const input = {
    title: "Hill country",
    travelStartDate: "2026-10-01",
    travelEndDate: "2026-10-02",
    pace: "balanced",
    destinationSlugs: ["kandy"],
    travellerIds: [],
    interests: ["tea"],
    productTypeSlugs: [],
    categorySlugs: [],
    tagSlugs: [],
  };
  const catalogue = [
    {
      productSlug: "tea-estate",
      name: "Tea estate",
      durationMinutes: 180,
      destinationSlugs: ["kandy"],
      productTypeSlugs: [],
      categorySlugs: [],
      tagSlugs: ["tea"],
    },
    {
      productSlug: "temple",
      name: "Temple",
      durationMinutes: 90,
      destinationSlugs: ["kandy"],
      productTypeSlugs: [],
      categorySlugs: [],
      tagSlugs: [],
    },
  ];

  it("returns stable fingerprints and identifiers for the same input", () => {
    const first = generateDraft(input, catalogue);
    const second = generateDraft(input, [...catalogue].reverse());
    expect(second).toEqual(first);
    expect(first.days).toHaveLength(2);
  });

  it("makes pace and catalogue snapshot changes reviewable", () => {
    const expandedCatalogue = Array.from({ length: 4 }, (_, index) => ({
      productSlug: `item-${index + 1}`,
      name: `Item ${index + 1}`,
      durationMinutes: 60,
      destinationSlugs: ["kandy"],
      productTypeSlugs: ["experience"],
      categorySlugs: ["nature"],
      tagSlugs: ["tea"],
    }));
    const relaxed = generateDraft({ ...input, pace: "relaxed" }, expandedCatalogue);
    const active = generateDraft({ ...input, pace: "active" }, expandedCatalogue);
    expect(relaxed.days[0]?.items).toHaveLength(1);
    expect(active.days[0]?.items).toHaveLength(3);
    expect(active.fingerprint).not.toBe(relaxed.fingerprint);

    const changed = generateDraft(input, [
      { ...catalogue[0], durationMinutes: 240 },
      catalogue[1]!,
    ]);
    expect(changed.fingerprint).not.toBe(generateDraft(input, catalogue).fingerprint);
  });

  it("rejects invalid dates, pace, duplicate slugs, and empty traveller IDs", () => {
    expect(() =>
      validateInput({ ...input, travelStartDate: "2026-10-03", travelEndDate: "2026-10-02" }),
    ).toThrow();
    expect(() => validateInput({ ...input, pace: "rushed" })).toThrow();
    expect(() => validateInput({ ...input, destinationSlugs: ["kandy", "kandy"] })).toThrow();
    expect(() =>
      validateInput({
        ...input,
        travellerIds: ["00000000-0000-0000-0000-000000000000"],
      }),
    ).toThrow();
  });
});

describe("booking state transitions", () => {
  it("covers every persisted status and the successful lifecycle", () => {
    expect(bookingStatuses).toHaveLength(9);
    let status = confirm("pending-confirmation");
    ({ status } = recordPayment(status, 0, 1000, 250));
    expect(status).toBe("partially-paid");
    ({ status } = recordPayment(status, 250, 1000, 750));
    expect(complete(startTravel(status))).toBe("completed");
    expect(refund(cancel(requestCancellation("confirmed")))).toBe("refunded");
  });

  it("rejects invalid transitions", () => {
    expect(() => startTravel("pending-confirmation")).toThrow();
    expect(() => requestCancellation("completed")).toThrow();
  });

  it.each(["confirmed", "partially-paid", "paid"] as const)("starts travel from %s", (status) =>
    expect(startTravel(status)).toBe("in-progress"),
  );

  it.each(["cancelled", "refunded", "completed"] as const)(
    "rejects payment on %s bookings",
    (status) => expect(() => recordPayment(status, 0, 100, 10)).toThrow(),
  );

  it("enforces confirmation, cancellation, completion, and refund prerequisites", () => {
    expect(confirm("pending-confirmation")).toBe("confirmed");
    expect(() => confirm("confirmed")).toThrow();
    expect(cancel("pending-confirmation")).toBe("cancelled");
    expect(cancel(requestCancellation("confirmed"))).toBe("cancelled");
    expect(() => cancel("confirmed")).toThrow();
    expect(complete("in-progress")).toBe("completed");
    expect(() => complete("paid")).toThrow();
    expect(refund("cancelled")).toBe("refunded");
    expect(() => refund("confirmed")).toThrow();
  });
});
