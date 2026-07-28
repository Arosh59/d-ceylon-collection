"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface SignInPanelProps {
  callbackUrl: string;
  testingEnabled: boolean;
}

export function SignInPanel({ callbackUrl, testingEnabled }: SignInPanelProps) {
  const [busy, setBusy] = useState(false);
  const [persona, setPersona] = useState("customer");
  const [testKey, setTestKey] = useState("");

  async function startExternalSignIn() {
    setBusy(true);
    await signIn("dceylon", { callbackUrl });
    setBusy(false);
  }

  async function startTestingSignIn() {
    setBusy(true);
    await signIn("testing", { callbackUrl, persona, testKey });
    setBusy(false);
  }

  return (
    <div className="grid gap-6">
      <button
        className="button-primary w-full disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        onClick={startExternalSignIn}
        type="button"
      >
        {busy ? "Opening secure sign-in…" : "Continue to secure sign-in"}
      </button>

      {testingEnabled ? (
        <form
          aria-label="Testing identity sign-in"
          className="grid gap-4 border-t border-navy/10 pt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void startTestingSignIn();
          }}
        >
          <p className="rounded-xl bg-gold/15 p-3 text-sm text-ink">
            Testing identities are available only in the isolated Testing environment.
          </p>
          <label className="filter-field">
            <span>Testing persona</span>
            <select value={persona} onChange={(event) => setPersona(event.target.value)}>
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="staff">Staff</option>
              <option value="administrator">Administrator</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Testing access key</span>
            <input
              autoComplete="off"
              onChange={(event) => setTestKey(event.target.value)}
              required
              type="password"
              value={testKey}
            />
          </label>
          <button className="button-secondary" disabled={busy} type="submit">
            Sign in with test identity
          </button>
        </form>
      ) : null}
    </div>
  );
}
