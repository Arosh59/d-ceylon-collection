"use client";

export function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-20" id="main-content">
      <section className="mx-auto max-w-xl rounded-3xl border border-navy/10 bg-white p-8 shadow-soft">
        <p className="eyebrow">Portal unavailable</p>
        <h1 className="mt-3 text-4xl text-navy">We could not load secure access</h1>
        <p className="mt-4 text-ink-muted">
          Try again. If the problem continues, share the request reference with support.
        </p>
        {error.digest ? (
          <p className="mt-3 text-sm text-ink-muted">Reference: {error.digest}</p>
        ) : null}
        <button className="button-primary mt-7" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
