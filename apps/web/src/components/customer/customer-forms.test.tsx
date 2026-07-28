import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FormStatus } from "./form-status";
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

describe("customer portal forms", () => {
  it("renders profile and traveller data-minimisation controls", () => {
    const { rerender } = render(<ProfileForm profile={null} />);
    expect(screen.getByLabelText("Contact email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Preferred contact method")).toBeInTheDocument();

    rerender(<TravellerForm />);
    expect(
      screen.getByRole("group", { name: "Optional sensitive information" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Avoid passport numbers/u)).toBeInTheDocument();
    expect(screen.getByLabelText("Emergency contact phone")).toHaveAttribute("type", "tel");
  });

  it("renders wishlist and metadata-only itinerary controls", () => {
    const { rerender } = render(<WishlistForm />);
    expect(screen.getByLabelText("Published experience slug")).toBeRequired();

    rerender(<ItineraryForm />);
    expect(screen.getByLabelText("Travel start")).toHaveAttribute("type", "date");
    expect(screen.getByText(/Open the travel planner/u)).toBeInTheDocument();
  });

  it("announces optimistic-concurrency conflicts", () => {
    render(
      <form>
        <FormStatus
          state={{
            message: "This record changed. Reload and retry.",
            status: "conflict",
          }}
        />
      </form>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This record changed");
  });
});
