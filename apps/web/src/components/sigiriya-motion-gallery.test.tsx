import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DestinationMotionGallery, SigiriyaMotionGallery } from "./sigiriya-motion-gallery";

describe("SigiriyaMotionGallery", () => {
  it("provides a labelled image and lets visitors play motion", async () => {
    const user = userEvent.setup();
    render(<SigiriyaMotionGallery alt="Sigiriya Rock Fortress" />);

    const image = screen.getByRole("img", { name: "Sigiriya Rock Fortress" });
    const gallery = image.closest("figure");
    expect(image).toBeVisible();
    expect(gallery).not.toHaveAttribute("data-motion-active", "true");

    await user.hover(image);

    expect(gallery).toHaveAttribute("data-motion-active", "true");

    await user.unhover(image);

    expect(gallery).not.toHaveAttribute("data-motion-active", "true");

    fireEvent.click(screen.getByRole("button", { name: "Play motion" }));

    expect(screen.getByRole("button", { name: "Pause motion" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("lets visitors manually slide through a destination gallery", async () => {
    const user = userEvent.setup();
    render(
      <DestinationMotionGallery
        alt="Galle Fort"
        caption="Galle Fort gallery"
        imageSrc="/images/destinations/galle-provided.png"
        slides={[
          { alt: "Galle Fort aerial view", src: "/images/destinations/galle-provided.png" },
          { alt: "Galle Fort ramparts", src: "/images/destinations/galle-provided-fort.jpg" },
        ]}
        variant="galle"
      />,
    );

    expect(screen.getByRole("img", { name: "Galle Fort aerial view" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next image" }));

    expect(screen.getByRole("img", { name: "Galle Fort ramparts" })).toBeVisible();
    expect(screen.getByText("Image 2 of 2: Galle Fort ramparts")).toBeInTheDocument();
  });
});
