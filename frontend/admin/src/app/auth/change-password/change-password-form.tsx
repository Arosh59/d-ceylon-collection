"use client";

import { useState, type FormEvent } from "react";

export function ChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setError("The new passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword,
        }),
      });
      if (!response.ok) {
        const value = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(value?.error ?? "The password could not be changed.");
      }
      window.location.assign("/auth/sign-in?reason=password-changed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The password could not be changed.");
      setBusy(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <PasswordField
        autoComplete="current-password"
        label="Temporary password"
        name="currentPassword"
      />
      <PasswordField autoComplete="new-password" label="New password" name="newPassword" />
      <PasswordField
        autoComplete="new-password"
        label="Confirm new password"
        name="confirmPassword"
      />
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button className="primary-button" disabled={busy} type="submit">
        {busy ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span>{label}</span>
      <input
        autoComplete={autoComplete}
        className="form-control"
        minLength={8}
        name={name}
        required
        type="password"
      />
    </label>
  );
}
