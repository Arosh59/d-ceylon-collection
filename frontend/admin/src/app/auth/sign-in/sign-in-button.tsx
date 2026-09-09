"use client";

import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { useEffect, useState, type FormEvent } from "react";

import {
  firebaseGoogleAuthentication,
  hasFirebaseGoogleConfiguration,
} from "@/lib/firebase-client";

export function SignInButton() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function completeGoogleSignIn() {
      if (!hasFirebaseGoogleConfiguration()) return;
      try {
        const { auth } = firebaseGoogleAuthentication();
        const result = await getRedirectResult(auth);
        if (!result || !active) return;
        setBusy(true);
        const response = await post("google", { idToken: await result.user.getIdToken() });
        if (!response.ok) throw new Error(await responseError(response));
        const exchange = (await response.json()) as { identity?: { mustChangePassword?: boolean } };
        window.location.assign(
          exchange.identity?.mustChangePassword ? "/auth/change-password" : "/",
        );
      } catch (reason) {
        if (active) setError(messageFor(reason, "Google sign-in could not be completed."));
      } finally {
        if (active) setBusy(false);
      }
    }
    void completeGoogleSignIn();
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await post("login", { email, password });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as { identity?: { mustChangePassword?: boolean } };
      window.location.assign(result.identity?.mustChangePassword ? "/auth/change-password" : "/");
    } catch (reason) {
      setError(messageFor(reason, "Sign-in is temporarily unavailable."));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setError(null);
    try {
      const { auth, provider } = firebaseGoogleAuthentication();
      await signInWithRedirect(auth, provider);
    } catch (reason) {
      setError(messageFor(reason, "Google sign-in is not configured for this site."));
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-5">
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold">
          <span>Email address</span>
          <input
            autoComplete="email"
            className="form-control"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          <span>Password</span>
          <input
            autoComplete="current-password"
            className="form-control"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button className="primary-button mt-1" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in to administration"}
        </button>
      </form>
      <div className="relative border-t border-navy/10 pt-5">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-xs tracking-widest text-slate-500 uppercase">
          or
        </span>
        <button className="secondary-button w-full" disabled={busy} onClick={google} type="button">
          Continue with Google
        </button>
      </div>
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
