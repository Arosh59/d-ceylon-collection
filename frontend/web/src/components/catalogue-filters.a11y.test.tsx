import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { CatalogueFilters } from "./catalogue-filters";

describe("catalogue filters accessibility", () => {
  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(
      <CatalogueFilters
        categories={[]}
        collections={[]}
        destinations={[]}
        productTypes={[]}
        tags={[]}
        values={{}}
      />,
    );
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
