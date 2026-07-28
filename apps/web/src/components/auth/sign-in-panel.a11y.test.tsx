import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { SignInPanel } from "./sign-in-panel";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("SignInPanel accessibility", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<SignInPanel callbackUrl="/portal/customer" testingEnabled />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
