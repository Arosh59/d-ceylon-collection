"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="button-secondary border-white/30 text-white disabled:cursor-wait disabled:opacity-60"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          window.location.assign("/");
        }
      }}
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
