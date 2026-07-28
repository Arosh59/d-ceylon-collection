import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

import { SignInPanel } from "./sign-in-panel";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn().mockResolvedValue(undefined),
}));

describe("SignInPanel", () => {
  it("starts the testing flow without exposing a provider secret in markup", async () => {
    const user = userEvent.setup();
    render(<SignInPanel callbackUrl="/portal/agent" testingEnabled />);

    await user.selectOptions(screen.getByLabelText("Testing persona"), "agent");
    await user.type(screen.getByLabelText("Testing access key"), "runner-key");
    await user.click(screen.getByRole("button", { name: "Sign in with test identity" }));

    expect(signIn).toHaveBeenCalledWith("testing", {
      callbackUrl: "/portal/agent",
      persona: "agent",
      testKey: "runner-key",
    });
  });
});
