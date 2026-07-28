"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="button-secondary border-white/30 text-white disabled:cursor-wait disabled:opacity-60"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut({ callbackUrl: "/" });
      }}
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
