import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

export default function ForbiddenPage() {
  return (
    <main className="auth-page">
      <section className="auth-card max-w-lg text-center" aria-labelledby="forbidden-heading">
        <div className="status-icon status-icon-warning mx-auto" aria-hidden="true">
          !
        </div>
        <p className="eyebrow mt-6">Access denied</p>
        <h1 className="auth-heading" id="forbidden-heading">
          Administrator role required
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          This account is signed in but does not have permission to open the administration
          workspace.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <SignOutButton />
          <Link className="secondary-button" href="/auth/sign-in">
            Return to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
