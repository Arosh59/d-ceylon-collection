import Link from "next/link";

export default function AuthenticationErrorPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 pt-36 pb-20" id="main-content">
      <section className="mx-auto max-w-xl rounded-3xl border border-navy/10 bg-white p-8 shadow-soft">
        <p className="eyebrow">Authentication error</p>
        <h1 className="mt-3 text-4xl text-navy">We could not complete sign-in</h1>
        <p className="mt-4 text-ink-muted">
          The secure identity response was missing, invalid, or expired. Please start again.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="button-primary" href="/auth/sign-in">
            Try sign-in again
          </Link>
          <Link className="button-secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
