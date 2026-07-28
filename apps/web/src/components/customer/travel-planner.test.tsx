import type { TravelPlan } from "@dceylon/sdk";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ItemEditor, RegenerateDraft } from "./itinerary-builder";
import { TravelPlanForm } from "./travel-plan-form";

vi.mock("@/app/portal/customer/planner-actions", () => ({
  regenerateTravelPlan: vi.fn(),
  reorderItineraryItem: vi.fn(),
  saveItineraryItem: vi.fn(),
  saveTravelPlan: vi.fn(),
  updateItineraryDay: vi.fn(),
}));

describe("travel planner controls", () => {
  it("exposes validated planner inputs and privacy guidance", () => {
    render(
      <TravelPlanForm
        savedItineraries={[]}
        travellers={[
          {
            id: "traveller-1",
            givenName: "Maya",
            familyName: "Perera",
            dateOfBirth: null,
            accessibilityNeeds: null,
            dietaryNeeds: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            concurrencyToken: "token",
            updatedAtUtc: "2026-07-28T00:00:00Z",
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Travel start")).toBeRequired();
    expect(screen.getByLabelText("Pace")).toHaveValue("balanced");
    expect(screen.getByRole("group", { name: "Associated travellers" })).toBeInTheDocument();
    expect(screen.getByText(/Do not enter medical records/u)).toBeInTheDocument();
  });

  it("offers deterministic regeneration, editing, and reorder controls", () => {
    const plan = examplePlan();
    const { rerender } = render(<RegenerateDraft plan={plan} />);
    expect(screen.getByRole("button", { name: "Regenerate deterministic draft" })).toBeEnabled();
    expect(screen.getByText(/dceylon-deterministic-v1/u)).toBeInTheDocument();

    rerender(
      <ItemEditor
        days={plan.currentRevision.days}
        item={plan.currentRevision.days[0]!.items[0]!}
        planId={plan.id}
      />,
    );
    expect(screen.getByText(/Edit or reorder Tea country walk/u)).toBeInTheDocument();
    expect(screen.getByLabelText("Move to day")).toBeInTheDocument();
  });
});

export function examplePlan(): TravelPlan {
  return {
    id: "plan-1",
    savedItineraryId: null,
    title: "Ella draft",
    travelStartDate: "2027-02-10",
    travelEndDate: "2027-02-11",
    pace: "balanced",
    status: "draft",
    input: {
      destinationSlugs: ["ella"],
      travellerIds: [],
      interests: ["nature"],
      productTypeSlugs: ["experience"],
      categorySlugs: ["nature"],
      tagSlugs: ["slow-travel"],
      accessibilityConsiderations: null,
      dietaryConsiderations: null,
    },
    currentRevision: {
      id: "revision-1",
      revisionNumber: 1,
      ruleVersion: "dceylon-deterministic-v1",
      inputFingerprint: "a".repeat(64),
      generatedAtUtc: "2026-07-28T00:00:00Z",
      days: [
        {
          id: "day-1",
          dayNumber: 1,
          date: "2027-02-10",
          title: "Day 1",
          concurrencyToken: "day-token",
          items: [
            {
              id: "item-1",
              position: 1,
              title: "Tea country walk",
              notes: null,
              durationMinutes: 180,
              destinationSlug: "ella",
              productSlug: "tea-country-rail-estate-walk",
              source: "catalogue",
              concurrencyToken: "item-token",
            },
          ],
        },
        {
          id: "day-2",
          dayNumber: 2,
          date: "2027-02-11",
          title: "Day 2",
          concurrencyToken: "day-token-2",
          items: [],
        },
      ],
    },
    concurrencyToken: "plan-token",
    createdAtUtc: "2026-07-28T00:00:00Z",
    updatedAtUtc: "2026-07-28T00:00:00Z",
  };
}
