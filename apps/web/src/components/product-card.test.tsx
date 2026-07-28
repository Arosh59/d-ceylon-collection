import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "./product-card";

describe("product card", () => {
  it("renders typed media metadata and destination context", () => {
    render(
      <ProductCard
        product={{
          id: "product-1",
          name: "Tea Country Rail",
          slug: "tea-country-rail",
          shortDescription: "A considered highland journey.",
          productType: { id: "type-1", name: "Journey", slug: "journey" },
          startingPrice: 420,
          currency: "USD",
          durationMinutes: 480,
          primaryMedia: {
            id: "media-1",
            assetKey: "placeholder:tea",
            altText: "Abstract tea country placeholder.",
            width: 1600,
            height: 1200,
          },
          collections: [],
          destinations: [{ id: "destination-1", name: "Ella", slug: "ella" }],
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Abstract tea country placeholder." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Tea Country Rail" })).toHaveAttribute(
      "href",
      "/catalogue/tea-country-rail",
    );
    expect(screen.getByText("Ella")).toBeVisible();
  });
});
