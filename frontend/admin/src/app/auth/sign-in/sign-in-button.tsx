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
          const result = await signIn("local", {
            callbackUrl: "/",
            email,
            password,
            redirect: false,
          });
          if (!result?.ok) {
            setError("The administrator credentials could not be verified.");
            setBusy(false);
            return;
          }
          window.location.assign(result.url ?? "/");
        }}
      >
        <label className="grid gap-2 text-sm font-semibold">
          <span>Email address</span>
          <input
            autoComplete="email"
            className="rounded-xl border border-navy/15 px-4 py-3"
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
            className="rounded-xl border border-navy/15 px-4 py-3"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="rounded-full bg-navy px-6 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Signing in…" : "Sign in to administration"}
        </button>
      </form>
    );
  }

  return (
    <button
      className="mt-8 rounded-full bg-navy px-6 py-3 font-semibold text-white"
      onClick={() => signIn("dceylon", { callbackUrl: "/" })}
      type="button"
    >
      Sign in securely
    </button>
  );
}
