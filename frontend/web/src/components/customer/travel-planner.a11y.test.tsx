import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { ItemEditor, RegenerateDraft } from "./itinerary-builder";
import { TravelPlanForm } from "./travel-plan-form";
import { examplePlan } from "./travel-planner.test";

vi.mock("@/app/portal/customer/planner-actions", () => ({
  regenerateTravelPlan: vi.fn(),
  reorderItineraryItem: vi.fn(),
  saveItineraryItem: vi.fn(),
  saveTravelPlan: vi.fn(),
  updateItineraryDay: vi.fn(),
}));

describe("travel planner accessibility", () => {
  it.each([
    ["input", <TravelPlanForm key="input" savedItineraries={[]} travellers={[]} />],
    ["regeneration", <RegenerateDraft key="regenerate" plan={examplePlan()} />],
    [
      "item editing",
      <ItemEditor
        days={examplePlan().currentRevision.days}
        item={examplePlan().currentRevision.days[0]!.items[0]!}
        key="item"
        planId="plan-1"
      />,
    ],
  ])("has no detectable violations in %s controls", async (_name, view) => {
    const { container } = render(view);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
