import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { ItineraryForm } from "./itinerary-form";
import { ProfileForm } from "./profile-form";
import { TravellerForm } from "./traveller-form";
import { WishlistForm } from "./wishlist-form";

vi.mock("@/app/portal/customer/actions", () => ({
  saveItinerary: vi.fn(),
  saveProfile: vi.fn(),
  saveTraveller: vi.fn(),
  saveWishlistEntry: vi.fn(),
}));

describe("customer portal form accessibility", () => {
  it.each([
    ["profile", <ProfileForm key="profile" profile={null} />],
    ["traveller", <TravellerForm key="traveller" />],
    ["wishlist", <WishlistForm key="wishlist" />],
    ["saved itinerary", <ItineraryForm key="itinerary" />],
  ])("has no detectable violations in the %s form", async (_name, form) => {
    const { container } = render(form);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
