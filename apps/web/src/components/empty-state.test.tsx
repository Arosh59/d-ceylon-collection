import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./ui/empty-state";

describe("EmptyState", () => {
  it("communicates the state and offers a recovery path", () => {
    render(
      <EmptyState
        actionHref="/catalogue"
        actionLabel="Browse again"
        description="No published journeys matched this view."
        title="Nothing here yet."
      />,
    );

    expect(screen.getByRole("heading", { name: "Nothing here yet." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse again" })).toHaveAttribute(
      "href",
      "/catalogue",
    );
  });
});
