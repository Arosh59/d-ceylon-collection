import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DestinationMotionGallery, SigiriyaMotionGallery } from "./sigiriya-motion-gallery";

describe("SigiriyaMotionGallery", () => {
  it("provides a labelled static destination image without motion controls", () => {
    render(<SigiriyaMotionGallery alt="Sigiriya Rock Fortress" />);

    const image = screen.getByRole("img", { name: "Sigiriya Rock Fortress" });
    expect(image).toBeVisible();
    expect(screen.queryByRole("button", { name: /motion/iu })).not.toBeInTheDocument();
  });

  it("uses the first curated image when several images are supplied", () => {
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

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Galle Fort ramparts" })).not.toBeInTheDocument();
  });
});
