import { createCustomerClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("customer client", () => {
  it("keeps bearer and correlation credentials in the server request", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          pagination: {
            pageNumber: 2,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: true,
            hasNextPage: false,
          },
        }),
        { headers: { "content-type": "application/json" }, status: 200 },
      ),
    );
    const client = createCustomerClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      correlationId: "customer-correlation",
      fetch: request,
    });

    await client.getTravellers({ pageNumber: 2, pageSize: 10 });

    const [url, init] = request.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/customer/travellers?pageNumber=2&pageSize=10",
    );
    expect(headers.get("Authorization")).toBe("Bearer server-token");
    expect(headers.get("X-Correlation-ID")).toBe("customer-correlation");
    expect(init?.cache).toBe("no-store");
  });

  it("maps validation and conflict Problem Details", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Validation failed",
          detail: "Correct the supplied values.",
          correlationId: "conflict-id",
          errors: { givenName: ["The GivenName field is required."] },
        }),
        {
          headers: { "content-type": "application/problem+json" },
          status: 409,
        },
      ),
    );
    const client = createCustomerClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: request,
    });

    await expect(
      client.createTraveller({ familyName: "Perera", givenName: "" }),
    ).rejects.toMatchObject({
      correlationId: "conflict-id",
      status: 409,
      validationErrors: {
        givenName: ["The GivenName field is required."],
      },
    });
  });

  it("treats an owned-record 404 as an absent detail", async () => {
    const client = createCustomerClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })),
    });

    await expect(client.getTraveller("00000000-0000-0000-0000-000000000001")).resolves.toBeNull();
  });
});
