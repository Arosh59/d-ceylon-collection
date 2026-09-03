import { createQuoteClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("quote client", () => {
  it("keeps customer credentials and correlation IDs on the server-side request", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          pagination: {
            pageNumber: 1,
            pageSize: 20,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        }),
        { headers: { "content-type": "application/json" }, status: 200 },
      ),
    );
    const client = createQuoteClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      correlationId: "quote-correlation",
      fetch: request,
    });

    await client.getCustomerQuotes({ pageNumber: 2, pageSize: 10 });

    const [url, init] = request.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/customer/quotes?pageNumber=2&pageSize=10",
    );
    expect(headers.get("Authorization")).toBe("Bearer server-token");
    expect(headers.get("X-Correlation-ID")).toBe("quote-correlation");
    expect(init?.cache).toBe("no-store");
  });

  it("maps a quote conflict Problem Details response", async () => {
    const client = createQuoteClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Conflict",
            detail: "This quote changed. Reload and retry.",
            correlationId: "quote-conflict",
          }),
          { headers: { "content-type": "application/problem+json" }, status: 409 },
        ),
      ),
    });

    await expect(client.withdrawAgentQuote("quote-1", "stale-token")).rejects.toMatchObject({
      correlationId: "quote-conflict",
      message: "This quote changed. Reload and retry.",
      status: 409,
    });
  });

  it("maps an owned quote 404 to an absent record", async () => {
    const client = createQuoteClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })),
    });

    await expect(client.getCustomerQuote("missing")).resolves.toBeNull();
  });
});
