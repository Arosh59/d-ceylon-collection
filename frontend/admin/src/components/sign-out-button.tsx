"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={compact ? "sign-out-button sign-out-button-compact" : "sign-out-button"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOut({ callbackUrl: "/auth/sign-in" });
      }}
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
