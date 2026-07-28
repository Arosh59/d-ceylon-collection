import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("provides named desktop and mobile navigation landmarks", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "D Ceylon home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();

    await user.click(screen.getByText("Menu"));

    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeVisible();
  });
});
