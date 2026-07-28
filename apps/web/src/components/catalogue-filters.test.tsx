import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CatalogueFilters } from "./catalogue-filters";

const reference = { id: "1", name: "Flow", slug: "flow" };

describe("catalogue filters", () => {
  it("renders labelled native controls and preserves selected values", async () => {
    const user = userEvent.setup();
    render(
      <CatalogueFilters
        categories={[{ ...reference, name: "Nature", slug: "nature" }]}
        collections={[{ ...reference, summary: "Summary", heroMedia: null }]}
        destinations={[
          { ...reference, name: "Ella", slug: "ella", summary: "Summary", heroMedia: null },
        ]}
        productTypes={[{ ...reference, name: "Experience", slug: "experience" }]}
        tags={[{ ...reference, name: "Mindful", slug: "mindful" }]}
        values={{ collection: "flow", query: "railway" }}
      />,
    );

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("railway");
    expect(screen.getByRole("combobox", { name: "Collection" })).toHaveValue("flow");
    await user.selectOptions(screen.getByRole("combobox", { name: "Destination" }), "ella");
    expect(screen.getByRole("combobox", { name: "Destination" })).toHaveValue("ella");
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeEnabled();
  });
});
