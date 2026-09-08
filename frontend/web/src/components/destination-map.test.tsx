import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    productCount: 3,
    province: "Uva",
    slug: "ella",
    summary: "Tea country and rail.",
  },
  {
    categories: [{ name: "Heritage", slug: "heritage" }],
    district: "Galle",
    id: "galle-id",
    imageUrl: null,
    latitude: 6.0329,
    longitude: 80.2168,
    name: "Galle",
    productCount: 2,
    province: "Southern",
    slug: "galle",
    summary: "Fort walls and the coast.",
  },
];

describe("DestinationMap", () => {
  it("removes the illustrated fallback and keeps real destination navigation available without an API key", async () => {
    const user = userEvent.setup();
    render(<DestinationMap destinations={destinations} />);

    expect(screen.queryByRole("img", { name: /abstract sri lanka/i })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("The live map could not load");

    await user.click(screen.getByRole("button", { name: /Galle/i }));

    expect(
      screen
        .getAllByRole("link", { name: "Explore" })
        .some((link) => link.getAttribute("href")?.endsWith("destination=galle")),
    ).toBe(true);
  });

  it("updates the connected result list with search and filters", async () => {
    const user = userEvent.setup();
    render(<DestinationMap destinations={destinations} />);

    await user.type(screen.getByRole("searchbox", { name: "Search destinations" }), "coast");
    expect(screen.getByText("1 destination")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Ella/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("2 destinations")).toBeVisible();

    await user.selectOptions(screen.getByRole("combobox", { name: "Province" }), "Uva");
    expect(screen.getByText("1 destination")).toBeVisible();
    expect(screen.getByRole("button", { name: /Ella/i })).toBeVisible();
  });
});
