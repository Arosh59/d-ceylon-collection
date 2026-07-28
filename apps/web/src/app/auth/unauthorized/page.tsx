import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 pt-36 pb-20" id="main-content">
      <section className="mx-auto max-w-xl rounded-3xl border border-navy/10 bg-white p-8 shadow-soft">
        <p className="eyebrow">Sign-in required</p>
        <h1 className="mt-3 text-4xl text-navy">This area is protected</h1>
        <p className="mt-4 text-ink-muted">Sign in with an authorised account to continue.</p>
        <Link className="button-primary mt-7" href="/auth/sign-in">
          Sign in
        </Link>
      </section>
    </main>
  );
}
