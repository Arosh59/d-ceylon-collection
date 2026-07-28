import { describe, expect, it } from "vitest";

import { formatStartingPrice } from "./format-price";

describe("formatStartingPrice", () => {
  it("formats a known currency without insignificant decimals", () => {
    expect(formatStartingPrice(1250, "USD")).toBe("From $1,250");
  });

  it("uses an honest fallback when no price is available", () => {
    expect(formatStartingPrice(null, "LKR")).toBe("Price on request");
  });
});
