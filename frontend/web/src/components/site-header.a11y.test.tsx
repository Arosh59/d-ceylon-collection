import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("site header accessibility", () => {
  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(<SiteHeader />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
