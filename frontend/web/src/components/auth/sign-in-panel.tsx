"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

interface SignInPanelProps {
  callbackUrl: string;
  configurationError?: string | undefined;
  localAuthEnabled?: boolean;
  mode?: "sign-in" | "sign-up" | undefined;
  testingEnabled: boolean;
}

export function SignInPanel({
  callbackUrl,
  configurationError,
  localAuthEnabled = false,
  mode = "sign-in",
  testingEnabled,
}: SignInPanelProps) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [persona, setPersona] = useState("customer");
  const [testKey, setTestKey] = useState("");
  const isSignUp = mode === "sign-up";

  async function startExternalSignIn() {
    setBusy(true);
    if (isSignUp) {
      await signIn("dceylon", { callbackUrl }, { prompt: "login", screen_hint: "signup" });
    } else {
      await signIn("dceylon", { callbackUrl });
    }
    setBusy(false);
  }

  async function startTestingSignIn() {
    setBusy(true);
    await signIn("testing", { callbackUrl, persona, testKey });
    setBusy(false);
  }

  async function startLocalAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (isSignUp && password !== passwordConfirmation) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    if (isSignUp) {
      const response = await fetch("/api/local-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Unable to create the account.");
        setBusy(false);
        return;
      }
    }

    const result = await signIn("local", { callbackUrl, email, password, redirect: false });
    if (!result?.ok) {
      setError("Those credentials could not be verified.");
      setBusy(false);
      return;
    }
    window.location.assign(result.url ?? callbackUrl);
  }

  if (configurationError) {
    return (
      <div
        className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm text-ink"
        role="alert"
      >
        <p className="font-semibold text-navy">
          Secure {isSignUp ? "registration" : "sign-in"} is not configured on this server.
        </p>
        <p className="mt-2">
          Add the server-only OIDC settings from <code>frontend/web/.env.example</code> to an ignored
          <code>frontend/web/.env.local</code> file, then restart the web server.
        </p>
        <p className="mt-2 text-ink-muted">Configuration detail: {configurationError}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {localAuthEnabled ? (
        <form aria-label={isSignUp ? "Create account" : "Sign in"} className="grid gap-4" onSubmit={startLocalAuth}>
          {isSignUp ? (
            <label className="filter-field">
              <span>Your name</span>
              <input
                autoComplete="name"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          ) : null}
          <label className="filter-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="filter-field">
            <span>Password</span>
            <input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {isSignUp ? (
            <label className="filter-field">
              <span>Confirm password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                type="password"
                value={passwordConfirmation}
              />
            </label>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button-primary w-full disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit">
            {busy ? "Please wait…" : isSignUp ? "Create your account" : "Sign in"}
          </button>
          <p className="text-xs leading-5 text-ink-muted">
            Local development mode is active. Passwords are hashed and stored only on this machine.
          </p>
        </form>
      ) : (
        <button
          className="button-primary w-full disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={startExternalSignIn}
          type="button"
        >
          {busy
            ? `Opening secure ${isSignUp ? "registration" : "sign-in"}…`
            : isSignUp
              ? "Create your account securely"
              : "Continue to secure sign-in"}
        </button>
      )}

      {testingEnabled && !isSignUp && !localAuthEnabled ? (
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
