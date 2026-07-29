"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
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
