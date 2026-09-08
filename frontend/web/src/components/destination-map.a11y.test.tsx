import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { DestinationMap, type MapDestination } from "./destination-map";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const destinations: MapDestination[] = [
  {
    categories: [{ name: "Nature", slug: "nature" }],
    district: "Badulla",
    id: "ella-id",
    imageUrl: null,
    latitude: 6.8667,
    longitude: 81.0466,
    name: "Ella",
    productCount: 2,
    province: "Uva",
    slug: "ella",
    summary: "Tea slopes, cloud forest, and rail journeys in the highlands.",
  },
];

describe("destination map accessibility", () => {
  it("has no automatically detectable violations when the live map is unavailable", async () => {
    const { container } = render(<DestinationMap destinations={destinations} />);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
