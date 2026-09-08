"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignInButton({ localAuthEnabled = false }: { localAuthEnabled?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (localAuthEnabled) {
    return (
      <form
        className="mt-8 grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const result = await signIn("local", {
              callbackUrl: "/",
              email,
              password,
              redirect: false,
            });
            if (!result?.ok) {
              setError("The email address or password does not match the local administrator.");
              return;
            }
            window.location.assign(result.url ?? "/");
          } catch {
            setError("Sign-in is temporarily unavailable. Check the server and try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="grid gap-2 text-sm font-semibold">
          <span>Email address</span>
          <input
            autoComplete="email"
            className="form-control"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@dceylon.local"
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
    );
  }

  return (
    <button
      className="primary-button mt-8 w-full"
      onClick={() => signIn("dceylon", { callbackUrl: "/" })}
      type="button"
    >
      Sign in securely
    </button>
  );
}
