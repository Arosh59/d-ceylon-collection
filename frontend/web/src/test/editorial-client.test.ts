import { createEditorialClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("editorial client", () => {
  it("preserves correlation IDs for public editorial requests", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: {} }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createEditorialClient({
      baseUrl: "https://api.example.test",
      correlationId: "editorial-correlation",
      fetch: request,
    });

    await client.getJournal({ pageNumber: 1, pageSize: 12 });

    const [url, init] = request.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/editorial/journal?pageNumber=1&pageSize=12",
    );
    expect(new Headers(init?.headers).get("X-Correlation-ID")).toBe("editorial-correlation");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });
});
