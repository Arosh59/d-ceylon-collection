import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { SignInPanel } from "./sign-in-panel";

vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
}));
vi.mock("@/lib/firebase-client", () => ({
  firebaseGoogleAuthentication: () => ({ auth: {}, provider: {} }),
}));

describe("SignInPanel accessibility", () => {
  it.each(["sign-in", "sign-up"] as const)(
    "has no detectable accessibility violations in %s mode",
    async (mode) => {
      const { container } = render(
        <SignInPanel callbackUrl="/portal/customer" mode={mode} testingEnabled />,
      );
      const results = await axe.run(container, {
        rules: {
          "color-contrast": { enabled: false },
        },
      });
      expect(results.violations).toEqual([]);
    },
  );
});
