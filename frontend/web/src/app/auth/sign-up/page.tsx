import Link from "next/link";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import {
  getAuthenticationConfigurationError,
  getAuthenticationEnvironment,
} from "@/lib/auth-environment";
import { safeRedirectTarget } from "@/lib/safe-redirect";

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const value = (await searchParams).callbackUrl;
  const callbackUrl = safeRedirectTarget(
    Array.isArray(value) ? value[0] : value,
    "/portal/customer",
  );
  const configurationError = getAuthenticationConfigurationError();
  const testingEnabled =
    !configurationError && getAuthenticationEnvironment().applicationEnvironment === "Testing";

  return (
    <main className="min-h-screen bg-canvas px-5 pt-36 pb-20" id="main-content">
      <section
        aria-labelledby="sign-up-heading"
        className="mx-auto max-w-lg rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10"
      >
        <p className="eyebrow">Your journey, saved</p>
        <h1 className="mt-3 text-4xl text-navy" id="sign-up-heading">
          Create your D Ceylon account
        </h1>
        <p className="mt-4 text-ink-muted">
          Register securely with our identity provider to save itineraries and request a quote. D
          Ceylon does not store your password.
        </p>
        <div className="mt-8">
          <SignInPanel
            callbackUrl={callbackUrl}
            configurationError={configurationError}
            mode="sign-up"
            testingEnabled={testingEnabled}
          />
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            className="font-semibold text-navy underline hover:text-gold-dark"
            href={`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Sign in
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
