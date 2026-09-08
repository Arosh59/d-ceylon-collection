import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getDashboardData } from "./admin-dashboard";

describe("getDashboardData", () => {
  beforeEach(() => {
    process.env.API_BASE_URL = "http://api.example.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.API_BASE_URL;
  });

  it("returns catalogue totals for a local administrator session", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ pagination: { totalItems: 10 } }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ pagination: { totalItems: 6 } }), { status: 200 }),
        ),
    );

    await expect(getDashboardData("access-token")).resolves.toMatchObject({
      counts: { publishedProducts: 10, publishedDestinations: 6 },
      source: "catalogue-api",
    });
  });

  it("keeps the signed-in dashboard usable when the catalogue API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
        .mockRejectedValueOnce(new TypeError("connection refused")),
    );

    await expect(getDashboardData("access-token")).resolves.toMatchObject({
      counts: { publishedProducts: null, publishedDestinations: null },
      source: "unavailable",
      warning: expect.stringContaining("backend catalogue is unavailable"),
    });
  });
});
