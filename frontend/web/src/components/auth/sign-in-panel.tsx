"use client";

import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import {
  firebaseGoogleAuthentication,
  hasFirebaseGoogleConfiguration,
} from "@/lib/firebase-client";

interface SignInPanelProps {
  callbackUrl: string;
  configurationError?: string | undefined;
  localAuthEnabled?: boolean;
  mode?: "sign-in" | "sign-up" | undefined;
  testingEnabled: boolean;
}

export function SignInPanel({ callbackUrl, mode = "sign-in", testingEnabled }: SignInPanelProps) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [persona, setPersona] = useState("customer");
  const [testKey, setTestKey] = useState("");
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    let active = true;
    async function finishGoogleRedirect() {
      if (!hasFirebaseGoogleConfiguration()) return;
      try {
        const { auth } = firebaseGoogleAuthentication();
        const result = await getRedirectResult(auth);
        if (!result || !active) return;
        setBusy(true);
        const response = await post("google", { idToken: await result.user.getIdToken() });
        if (!response.ok) throw new Error(await responseError(response));
        window.location.assign(callbackUrl);
      } catch (reason) {
        if (active) setError(messageFor(reason, "Google sign-in could not be completed."));
      } finally {
        if (active) setBusy(false);
      }
    }
    void finishGoogleRedirect();
    return () => {
      active = false;
    };
  }, [callbackUrl]);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (isSignUp && password !== passwordConfirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await post(isSignUp ? "register" : "login", {
        email,
        password,
        ...(isSignUp ? { name } : {}),
      });
      if (!response.ok) throw new Error(await responseError(response));
      window.location.assign(callbackUrl);
    } catch (reason) {
      setError(messageFor(reason, "Authentication is temporarily unavailable."));
    } finally {
      setBusy(false);
    }
  }

  async function startGoogle() {
    setError(null);
    setBusy(true);
    try {
      const { auth, provider } = firebaseGoogleAuthentication();
      await signInWithRedirect(auth, provider);
    } catch (reason) {
      setError(messageFor(reason, "Google sign-in is not configured on this site."));
      setBusy(false);
    }
  }

  async function startTestingSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await post("testing", { persona, testKey });
      if (!response.ok) throw new Error(await responseError(response));
      window.location.assign(callbackUrl);
    } catch (reason) {
      setError(messageFor(reason, "The testing identity could not be verified."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form
        aria-label={isSignUp ? "Create account" : "Sign in"}
        className="grid gap-4"
        onSubmit={submitCredentials}
      >
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
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          className="button-primary w-full disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Please wait…" : isSignUp ? "Create your account" : "Sign in"}
        </button>
        {!isSignUp ? (
          <Link
            className="text-sm font-semibold text-navy underline decoration-gold underline-offset-4"
            href="/auth/forgot-password"
          >
            Forgot your password?
          </Link>
        ) : null}
      </form>

      <div className="relative border-t border-navy/10 pt-6">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-xs tracking-widest text-ink-muted uppercase">
          or
        </span>
        <button
          className="button-secondary w-full disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={startGoogle}
          type="button"
        >
          Continue with Google
        </button>
      </div>

      {testingEnabled && !isSignUp ? (
        <form
          aria-label="Testing identity sign-in"
          className="grid gap-4 border-t border-navy/10 pt-6"
          onSubmit={startTestingSignIn}
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

function post(action: string, body: unknown): Promise<Response> {
  return fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "The request could not be completed.";
}

function messageFor(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}
