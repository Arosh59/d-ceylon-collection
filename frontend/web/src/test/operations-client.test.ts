import { createOperationsClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("operations client", () => {
  it("keeps staff credentials and correlation IDs server-side", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: {} }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createOperationsClient({
      accessToken: "staff-server-token",
      baseUrl: "https://api.example.test",
      correlationId: "operations-correlation",
      fetch: request,
    });

    await client.getSuppliers({ pageNumber: 2, pageSize: 6 });

    const [url, init] = request.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/operations/suppliers?pageNumber=2&pageSize=6",
    );
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer staff-server-token");
    expect(new Headers(init?.headers).get("X-Correlation-ID")).toBe("operations-correlation");
  });
});
