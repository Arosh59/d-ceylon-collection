import { createTravelPlanningClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("travel planning client", () => {
  it("keeps bearer and correlation credentials server-side", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          pagination: {
            pageNumber: 1,
            pageSize: 12,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        }),
        { headers: { "content-type": "application/json" }, status: 200 },
      ),
    );
    const client = createTravelPlanningClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      correlationId: "planner-correlation",
      fetch: request,
    });

    await client.getPlans({ pageNumber: 1, pageSize: 12 });

    const [url, init] = request.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/customer/travel-plans?pageNumber=1&pageSize=12",
    );
    expect(headers.get("Authorization")).toBe("Bearer server-token");
    expect(headers.get("X-Correlation-ID")).toBe("planner-correlation");
    expect(init?.cache).toBe("no-store");
  });

  it("maps conflict Problem Details without leaking credentials", async () => {
    const client = createTravelPlanningClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Conflict",
            detail: "Reload and retry.",
            correlationId: "planner-conflict",
          }),
          { headers: { "content-type": "application/problem+json" }, status: 409 },
        ),
      ),
    });

    await expect(client.generate("plan-id", "stale-token")).rejects.toMatchObject({
      correlationId: "planner-conflict",
      message: "Reload and retry.",
      status: 409,
    });
  });

  it("maps an owned-record 404 to an absent plan", async () => {
    const client = createTravelPlanningClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })),
    });

    await expect(client.getPlan("missing")).resolves.toBeNull();
  });
});
