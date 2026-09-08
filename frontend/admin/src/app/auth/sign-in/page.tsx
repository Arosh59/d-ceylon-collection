import { SignInButton } from "./sign-in-button";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const reason = (await searchParams).reason;
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-heading">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            DC
          </span>
          <span>
            <strong>D Ceylon</strong>
            <small>Administration</small>
          </span>
        </div>
        <div className="mt-10">
          <span className="mode-badge">
            <span className="mode-dot" aria-hidden="true" />
            Secure administrator access
          </span>
        </div>
        <h1 className="auth-heading" id="sign-in-heading">
          Welcome back
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Sign in with your D Ceylon credentials or Google. Your account must already have the
          administrator role.
        </p>
        {reason === "expired" ? (
          <p
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="status"
          >
            Your administrator session expired. Sign in again to continue.
          </p>
        ) : null}
        <SignInButton />
        <p className="mt-7 border-t border-navy/10 pt-5 text-xs leading-5 text-slate-500">
          Access is restricted to administrator accounts. Activity may be recorded for security and
          support.
        </p>
      </section>
    </main>
  );
}
