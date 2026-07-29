import { createBookingClient } from "@dceylon/sdk";
import { describe, expect, it, vi } from "vitest";

describe("booking client", () => {
  it("keeps owner credentials and correlation IDs on server-side payment requests", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "payment-1" }), {
        headers: { "content-type": "application/json" },
        status: 201,
      }),
    );
    const client = createBookingClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      correlationId: "booking-correlation",
      fetch: request,
    });

    await client.createCustomerPayment("booking-1", {
      gateway: "stripe",
      idempotencyKey: "0123456789abcdef",
      kind: "payment-link",
    });

    const [url, init] = request.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/customer/bookings/booking-1/payments",
    );
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer server-token");
    expect(new Headers(init?.headers).get("X-Correlation-ID")).toBe("booking-correlation");
    expect(init?.body).toBe(
      JSON.stringify({
        gateway: "stripe",
        idempotencyKey: "0123456789abcdef",
        kind: "payment-link",
      }),
    );
  });

  it("maps owner-scoped booking 404 responses to an absent record", async () => {
    const client = createBookingClient({
      accessToken: "server-token",
      baseUrl: "https://api.example.test",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })),
    });

    await expect(client.getCustomerBooking("missing")).resolves.toBeNull();
  });
});
