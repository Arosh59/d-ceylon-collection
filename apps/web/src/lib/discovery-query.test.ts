import { describe, expect, it } from "vitest";

import { parseCatalogueSearchParams } from "./discovery-query";

describe("catalogue discovery query", () => {
  it("normalizes supported filters and pagination", () => {
    expect(
      parseCatalogueSearchParams({
        page: "2",
        query: " railway ",
        collection: "flow",
        sort: "price-asc",
      }),
    ).toMatchObject({
      pageNumber: 2,
      pageSize: 9,
      query: "railway",
      collection: "flow",
      sort: "price-asc",
    });
  });

  it("drops malformed values without forwarding them to the API", () => {
    expect(
      parseCatalogueSearchParams({
        page: "-1",
        query: "x",
        destination: "Not Safe",
        sort: "unknown",
      }),
    ).toMatchObject({
      pageNumber: 1,
      query: undefined,
      destination: undefined,
      sort: "name",
    });
  });
});
