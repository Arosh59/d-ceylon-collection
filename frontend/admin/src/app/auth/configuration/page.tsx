import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAuthenticationConfigurationError } from "@/lib/auth-environment";

export const dynamic = "force-dynamic";

export default function AuthenticationConfigurationPage() {
  const configurationError = getAdminAuthenticationConfigurationError();
  if (!configurationError) redirect("/auth/sign-in");

  return (
    <main className="auth-page">
      <section className="auth-card max-w-2xl" aria-labelledby="configuration-heading">
        <div className="status-icon status-icon-warning" aria-hidden="true">
          !
        </div>
        <p className="eyebrow mt-6">Setup required</p>
        <h1 className="auth-heading" id="configuration-heading">
          Configure administrator access
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">
          The admin application is running, but its development authentication settings are not
          complete.
        </p>
        <p
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950"
          role="alert"
        >
          {configurationError}
        </p>
        <div className="mt-6 rounded-2xl bg-navy p-5 text-sm text-white">
          <p className="font-semibold">Local setup</p>
          <code className="mt-3 block overflow-x-auto rounded-xl bg-white/10 p-4 text-white/90">
            cp frontend/admin/.env.example frontend/admin/.env.local
          </code>
          <p className="mt-3 leading-6 text-white/70">
            Review the development-only credentials, then restart <code>npm run dev:admin</code>.
          </p>
        </div>
        <Link className="secondary-button mt-7 inline-flex" href="/auth/sign-in">
          Check configuration again
        </Link>
      </section>
    </main>
  );
}
