import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignInPanel } from "./sign-in-panel";

const { signInWithPopupMock } = vi.hoisted(() => ({ signInWithPopupMock: vi.fn() }));

vi.mock("firebase/auth", () => ({
  signInWithPopup: signInWithPopupMock,
}));
vi.mock("@/lib/firebase-client", () => ({
  firebaseGoogleAuthentication: () => ({ auth: {}, provider: {} }),
}));

describe("SignInPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    signInWithPopupMock.mockReset();
  });

  it("submits customer registration to the BFF without exposing tokens", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Email already registered." }), { status: 409 }),
      );
    const user = userEvent.setup();
    render(<SignInPanel callbackUrl="/portal/customer" mode="sign-up" testingEnabled={false} />);

    await user.type(screen.getByLabelText("Your name"), "Test Customer");
    await user.type(screen.getByLabelText("Email address"), "customer@example.test");
    await user.type(screen.getByLabelText("Password", { selector: "input" }), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create your account" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered.");
  });

  it("keeps testing authentication isolated behind the testing UI", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid testing identity." }), { status: 401 }),
      );
    const user = userEvent.setup();
    render(<SignInPanel callbackUrl="/portal/agent" testingEnabled />);

    await user.selectOptions(screen.getByLabelText("Testing persona"), "agent");
    await user.type(screen.getByLabelText("Testing access key"), "runner-key");
    await user.click(screen.getByRole("button", { name: "Sign in with test identity" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/testing",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("exchanges the Google popup ID token through the BFF", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("firebase-id-token") },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "This account cannot use the customer portal." }), {
        status: 403,
      }),
    );
    const user = userEvent.setup();
    render(<SignInPanel callbackUrl="/portal/customer" testingEnabled={false} />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithPopupMock).toHaveBeenCalledWith({}, {});
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/google",
      expect.objectContaining({
        body: JSON.stringify({ idToken: "firebase-id-token" }),
        method: "POST",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This account cannot use the customer portal.",
    );
  });
});
