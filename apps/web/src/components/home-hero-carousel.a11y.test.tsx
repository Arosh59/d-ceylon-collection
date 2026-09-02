import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { HomeHeroCarousel } from "./home-hero-carousel";

describe("HomeHeroCarousel accessibility", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<HomeHeroCarousel />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
