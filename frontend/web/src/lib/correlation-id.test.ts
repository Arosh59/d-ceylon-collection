import { describe, expect, it, vi } from "vitest";

import { resolveCorrelationId } from "./correlation-id";

describe("resolveCorrelationId", () => {
  it("preserves a safe incoming identifier", () => {
    expect(resolveCorrelationId("web-request_123:retry")).toBe("web-request_123:retry");
  });

  it("replaces unsafe identifiers", () => {
    const randomUuid = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");

    expect(resolveCorrelationId("contains spaces")).toBe("00000000-0000-4000-8000-000000000000");
    expect(randomUuid).toHaveBeenCalledOnce();
  });
});
