import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeHeroCarousel } from "./home-hero-carousel";

describe("HomeHeroCarousel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("automatically advances and lets visitors pause the slideshow", () => {
    vi.useFakeTimers();
    const { container } = render(<HomeHeroCarousel />);
    const track = container.querySelector(".home-hero-carousel__track");

    expect(track).toHaveAttribute("data-slide-index", "0");
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    act(() => vi.advanceTimersByTime(7000));

    expect(track).toHaveAttribute("data-slide-index", "1");

    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    act(() => vi.advanceTimersByTime(14000));

    expect(track).toHaveAttribute("data-slide-index", "1");
    expect(screen.getByRole("button", { name: "Play slideshow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
