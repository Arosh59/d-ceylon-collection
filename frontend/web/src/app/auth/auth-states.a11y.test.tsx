import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import ForbiddenPage from "./forbidden/page";
import UnauthorizedPage from "./unauthorized/page";

describe("authentication state accessibility", () => {
  it.each([
    ["unauthorized", <UnauthorizedPage />],
    ["forbidden", <ForbiddenPage />],
  ])("has no detectable violations for %s", async (_name, page) => {
    const { container } = render(page);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
