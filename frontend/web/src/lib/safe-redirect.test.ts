import { describe, expect, it } from "vitest";

import { safeRedirectTarget } from "./safe-redirect";

describe("safeRedirectTarget", () => {
  it("accepts application-relative paths", () => {
    expect(safeRedirectTarget("/portal/customer?from=home")).toBe("/portal/customer?from=home");
  });

  it("rejects absolute, protocol-relative, and malformed redirects", () => {
    expect(safeRedirectTarget("https://evil.example")).toBe("/");
    expect(safeRedirectTarget("//evil.example/path")).toBe("/");
    expect(safeRedirectTarget("%")).toBe("/");
  });
});
