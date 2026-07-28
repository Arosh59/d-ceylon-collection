import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 pt-36 pb-20" id="main-content">
      <section className="mx-auto max-w-xl rounded-3xl border border-navy/10 bg-white p-8 shadow-soft">
        <p className="eyebrow">Access denied</p>
        <h1 className="mt-3 text-4xl text-navy">Your account cannot open this portal</h1>
        <p className="mt-4 text-ink-muted">
          You are signed in, but this area requires a different role or organisation.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="button-primary" href="/">
            Return home
          </Link>
          <Link className="button-secondary" href="/auth/sign-in">
            Use another account
          </Link>
        </div>
      </section>
    </main>
  );
}
