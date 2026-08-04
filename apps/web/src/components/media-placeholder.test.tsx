import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MediaPlaceholder } from "./media-placeholder";

describe("MediaPlaceholder", () => {
  it("uses the configured local destination image when a seeded destination asset is available", () => {
    render(
      <MediaPlaceholder
        className="aspect-video"
        media={{
          altText: "Galle Fort beside the Indian Ocean.",
          assetKey: "placeholder:galle",
          height: 1000,
          id: "media-galle",
          width: 1600,
        }}
      />,
    );

    const image = screen.getByRole("img", { name: "Galle Fort beside the Indian Ocean." });
    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
      "/images/destinations/galle-provided.png",
    );
  });
});
