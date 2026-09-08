"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "This reset link is invalid or expired.");
      }
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This reset link is invalid or expired.");
    } finally {
      setBusy(false);
    }
  }

  if (!token)
    return (
      <p className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
        This password reset link is incomplete.
      </p>
    );
  if (complete)
    return (
      <p
        className="mt-7 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900"
        role="status"
      >
        Your password has been changed.{" "}
        <Link className="font-semibold underline" href="/auth/sign-in">
          Sign in
        </Link>
        .
      </p>
    );
  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <label className="filter-field">
        <span>New password</span>
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <label className="filter-field">
        <span>Confirm new password</span>
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
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
      <button className="button-primary" disabled={busy} type="submit">
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
