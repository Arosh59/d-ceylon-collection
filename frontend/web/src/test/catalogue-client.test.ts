import { createCatalogueClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("catalogue client", () => {
  it("uses the versioned endpoint and forwards the correlation ID", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          pagination: {
            pageNumber: 2,
            pageSize: 6,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: true,
            hasNextPage: false,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    const client = createCatalogueClient({
      baseUrl: "https://api.example.test",
      correlationId: "phase4-test",
      fetch: request,
    });

    await client.getProducts({
      query: "railway",
      collection: "flow",
      pageNumber: 2,
      pageSize: 6,
    });

    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/catalogue/products?query=railway&collection=flow&pageNumber=2&pageSize=6",
    );
    expect(new Headers(init?.headers).get("X-Correlation-ID")).toBe("phase4-test");
    expect(init?.cache).toBe("no-store");
  });

  it("turns network failures into an actionable service-unavailable error", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    const client = createCatalogueClient({
      baseUrl: "http://127.0.0.1:8081",
      correlationId: "network-failure-test",
      fetch: request,
    });

    await expect(client.getProducts()).rejects.toMatchObject({
      name: "ApiRequestError",
      message: "The catalogue API could not be reached.",
      status: 503,
      correlationId: "network-failure-test",
    });
  });

  it("checks product availability with explicit dates and party size", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ kind: "experience", slots: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createCatalogueClient({
      baseUrl: "https://api.example.test",
      fetch: request,
    });

    await client.getProductAvailability("tea-estate", {
      startDate: "2026-10-10",
      endDate: "2026-10-10",
      adults: 2,
      children: 1,
    });

    expect(String(request.mock.calls[0]?.[0])).toBe(
      "https://api.example.test/api/v1/catalogue/products/tea-estate/availability?startDate=2026-10-10&endDate=2026-10-10&adults=2&children=1",
    );
  });

  it("keeps API problem details for HTTP errors", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "The catalogue database is unavailable.",
          correlationId: "backend-failure-test",
        }),
        {
          status: 500,
          headers: { "content-type": "application/problem+json" },
        },
      ),
    );
    const client = createCatalogueClient({
      baseUrl: "https://api.example.test",
      fetch: request,
    });

    await expect(client.getProducts()).rejects.toMatchObject({
      message: "The catalogue database is unavailable.",
      status: 500,
      correlationId: "backend-failure-test",
    });
  });
});
