import Link from "next/link";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import {
  getAuthenticationConfigurationError,
  getAuthenticationEnvironment,
} from "@/lib/auth-environment";
import { safeRedirectTarget } from "@/lib/safe-redirect";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const value = (await searchParams).callbackUrl;
  const callbackUrl = safeRedirectTarget(Array.isArray(value) ? value[0] : value);
  const configurationError = getAuthenticationConfigurationError();
  const testingEnabled =
    !configurationError && getAuthenticationEnvironment().applicationEnvironment === "Testing";

  return (
    <main className="min-h-screen bg-canvas px-5 pt-36 pb-20" id="main-content">
      <section
        aria-labelledby="sign-in-heading"
        className="mx-auto max-w-lg rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10"
      >
        <p className="eyebrow">Secure access</p>
        <h1 className="mt-3 text-4xl text-navy" id="sign-in-heading">
          Sign in to your portal
        </h1>
        <p className="mt-4 text-ink-muted">
          Your identity provider verifies your account. D Ceylon does not store your password.
        </p>
        <div className="mt-8">
          <SignInPanel
            callbackUrl={callbackUrl}
            configurationError={configurationError}
            testingEnabled={testingEnabled}
          />
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          New to D Ceylon?{" "}
          <Link
            className="font-semibold text-navy underline hover:text-gold-dark"
            href={`/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Create an account
          </Link>
        </p>
        <p className="mt-7 text-sm text-ink-muted">
          <Link className="underline hover:text-navy" href="/">
            Return to the public site
          </Link>
        </p>
      </section>
    </main>
  );
}
