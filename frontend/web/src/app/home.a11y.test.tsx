import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("home accessibility", () => {
  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(<HomePage />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
