"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The reset request could not be completed.");
      }
      setMessage("If that account exists, a single-use password reset link has been sent.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The reset request could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ece9e1] px-4 pt-32 pb-16" id="main-content">
      <section
        className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_30px_100px_rgba(5,29,71,0.16)] sm:p-12"
        aria-labelledby="forgot-heading"
      >
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-3 text-4xl text-navy" id="forgot-heading">
          Reset your password
        </h1>
        <p className="mt-4 leading-7 text-ink-muted">
          Enter your email address. For privacy, the response is the same whether or not an account
          exists.
        </p>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
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
          {message ? (
            <p
              className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900"
              role="status"
            >
              {message}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <button className="button-primary" disabled={busy} type="submit">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <Link
          className="mt-6 inline-block text-sm font-semibold text-navy underline decoration-gold underline-offset-4"
          href="/auth/sign-in"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
