"use client";

import { useState } from "react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={compact ? "sign-out-button sign-out-button-compact" : "sign-out-button"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          window.location.assign("/auth/sign-in");
        }
      }}
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
