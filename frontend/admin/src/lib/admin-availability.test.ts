import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAdminAvailability } from "./admin-availability";

describe("administrator availability data", () => {
  beforeEach(() => {
    process.env.API_BASE_URL = "https://api.example.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.API_BASE_URL;
  });

  it("loads inventory with the administrator bearer token and no cache", async () => {
    const payload = {
      product: {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Tea trail",
        slug: "tea-trail",
        currency: "USD",
        productType: { name: "Experience", slug: "experience" },
      },
      profile: null,
      experienceSlots: [],
      roomTypes: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAdminAvailability("secret-token", payload.product.id)).resolves.toEqual(
      payload,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        `/api/v1/administration/products/${payload.product.id}/availability`,
        "https://api.example.test",
      ),
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer secret-token" }),
      }),
    );
  });

  it("returns the API problem detail instead of hiding it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Product was not found." }), {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    await expect(
      getAdminAvailability("secret-token", "10000000-0000-4000-8000-000000000002"),
    ).rejects.toThrow("Product was not found.");
  });
});
