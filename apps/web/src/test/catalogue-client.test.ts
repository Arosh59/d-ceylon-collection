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
      correlationId: "phase3-test",
      fetch: request,
    });

    await client.getProducts({ pageNumber: 2, pageSize: 6 });

    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/catalogue/products?pageNumber=2&pageSize=6",
    );
    expect(new Headers(init?.headers).get("X-Correlation-ID")).toBe("phase3-test");
    expect(init?.cache).toBe("no-store");
  });
});
