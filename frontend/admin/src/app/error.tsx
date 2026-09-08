"use client";

import Link from "next/link";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card max-w-xl text-center" aria-labelledby="error-heading">
        <div className="status-icon status-icon-warning mx-auto" aria-hidden="true">
          !
        </div>
        <p className="eyebrow mt-6">Dashboard unavailable</p>
        <h1 className="auth-heading" id="error-heading">
          We could not load the live records
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Confirm the API and database are running at the configured API address, then retry. Your
          administrator session has not been changed.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button className="primary-button" onClick={reset} type="button">
            Try again
          </button>
          <Link className="secondary-button" href="/auth/sign-in">
            Return to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
