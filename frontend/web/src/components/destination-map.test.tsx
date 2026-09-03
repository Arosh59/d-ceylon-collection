import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DestinationMap } from "./destination-map";

const destinations = [
  { name: "Ella", productCount: 3, slug: "ella", summary: "Tea country and rail." },
  { name: "Galle", productCount: 2, slug: "galle", summary: "Fort walls and the coast." },
];

describe("DestinationMap", () => {
  it("offers an accessible destination-list equivalent when Google Maps is not configured", async () => {
    const user = userEvent.setup();
    render(<DestinationMap destinations={destinations} />);

    expect(screen.getByRole("img", { name: "Abstract Sri Lanka destination map" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ella" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Select Galle/i }));

    expect(screen.getByRole("heading", { name: "Galle" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Explore Galle" })).toHaveAttribute(
      "href",
      "/destinations/galle",
    );
  });
});
