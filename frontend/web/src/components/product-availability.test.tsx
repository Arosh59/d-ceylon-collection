import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductAvailabilityPanel } from "./product-availability";

describe("ProductAvailabilityPanel", () => {
  it("checks experience inventory and presents server-calculated slots", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          kind: "experience",
          productId: "10000000-0000-4000-8000-000000000001",
          productSlug: "tea-estate",
          bookingMode: "instant",
          pricingUnit: "person",
          timeZone: "Asia/Colombo",
          search: {
            startDate: "2099-10-10",
            endDate: "2099-10-10",
            adults: 1,
            children: 0,
            rooms: 1,
            participants: 1,
            dayCount: 0,
          },
          slots: [
            {
              id: "20000000-0000-4000-8000-000000000001",
              startsAtUtc: "2099-10-10T03:30:00.000Z",
              endsAtUtc: "2099-10-10T06:30:00.000Z",
              remainingCapacity: 4,
              minimumParticipants: 1,
              price: 75,
              currency: "USD",
              instantConfirmation: true,
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const user = userEvent.setup();
    render(<ProductAvailabilityPanel productSlug="tea-estate" productType="experience" />);

    await user.click(screen.getByRole("button", { name: "Check availability" }));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/catalogue/products/tea-estate/availability?",
    );
    expect(await screen.findByText("Available times")).toBeInTheDocument();
    expect(screen.getByText(/4 places remaining/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to add to your trip" })).toHaveAttribute(
      "href",
      "/auth/sign-in?callbackUrl=/portal/customer/travel-plans/new",
    );
  });

  it("shows a calm empty state when no room is available for every night", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          kind: "stay",
          productId: "10000000-0000-4000-8000-000000000002",
          productSlug: "canopy-stay",
          bookingMode: "request",
          pricingUnit: "night",
          timeZone: "Asia/Colombo",
          search: {},
          roomTypes: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const user = userEvent.setup();
    render(<ProductAvailabilityPanel productSlug="canopy-stay" productType="accommodation" />);

    await user.click(screen.getByRole("button", { name: "Check availability" }));

    expect(
      await screen.findByText("No room type is available for every night selected."),
    ).toBeInTheDocument();
  });
});
