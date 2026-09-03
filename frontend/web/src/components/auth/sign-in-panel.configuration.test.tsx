import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignInPanel } from "./sign-in-panel";

describe("SignInPanel configuration state", () => {
  it("explains missing server configuration without exposing a sign-in action", () => {
    render(
      <SignInPanel
        callbackUrl="/portal/customer"
        configurationError="AUTH_ISSUER is required."
        testingEnabled={false}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("AUTH_ISSUER is required.");
    expect(screen.queryByRole("button", { name: /Continue to secure sign-in/i })).toBeNull();
  });
});
