import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { DestinationMotionGallery, SigiriyaMotionGallery } from "./sigiriya-motion-gallery";

describe("SigiriyaMotionGallery accessibility", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<SigiriyaMotionGallery alt="Sigiriya Rock Fortress" />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it("keeps slideshow controls accessible", async () => {
    const { container } = render(
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
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
