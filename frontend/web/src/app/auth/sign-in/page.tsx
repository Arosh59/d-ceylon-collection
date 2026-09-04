import Image from "next/image";
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
  const authenticationEnvironment = getAuthenticationEnvironment();
  const configurationError = getAuthenticationConfigurationError();
  const testingEnabled =
    !configurationError && authenticationEnvironment.applicationEnvironment === "Testing";

  return (
    <main className="min-h-screen bg-[#ece9e1] px-4 pt-28 pb-16 sm:px-8 sm:pt-36" id="main-content">
      <section
        aria-labelledby="sign-in-heading"
        className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(14,35,66,0.14)] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div className="relative min-h-[30rem] overflow-hidden bg-navy text-white lg:min-h-[42rem]">
          <Image
            alt="A quiet palm-fringed Sri Lankan coastline in warm dawn light"
            className="object-cover opacity-75"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            src="/images/editorial/coastline-dawn.webp"
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,35,66,0.18),rgba(7,19,36,0.92))]" />
          <div
            aria-hidden="true"
            className="hero-grain absolute inset-0 opacity-20 mix-blend-soft-light"
          />
          <div className="relative flex h-full min-h-[30rem] flex-col justify-between p-7 sm:p-10 lg:min-h-[42rem]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-gold/70 font-serif text-xl text-gold-light">
                D
              </span>
              <span className="text-xs font-semibold tracking-[0.24em] text-white/75 uppercase">
                Your island, your pace
              </span>
            </div>
            <div>
              <p className="eyebrow text-gold-light">Welcome back</p>
              <h2 className="mt-4 max-w-md text-4xl sm:text-5xl">
                Pick up where the feeling left off.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-white/70">
                Your saved places and travel ideas are waiting for you.
              </p>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-12 lg:p-16">
          <p className="eyebrow">Secure access</p>
          <h1 className="mt-3 text-4xl text-navy sm:text-5xl" id="sign-in-heading">
            Sign in to your portal
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-ink-muted">
            Your identity provider verifies your account. D Ceylon does not store your password.
          </p>
          <div className="mt-9">
            <SignInPanel
              callbackUrl={callbackUrl}
              configurationError={configurationError}
              localAuthEnabled={authenticationEnvironment.authenticationMode === "local"}
              testingEnabled={testingEnabled}
            />
          </div>
          <p className="mt-7 text-sm text-ink-muted">
            New to D Ceylon?{" "}
            <Link
              className="font-semibold text-navy underline decoration-gold underline-offset-4 hover:text-gold-dark"
              href={`/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Create an account
            </Link>
          </p>
          <p className="mt-6 text-sm text-ink-muted">
            <Link className="underline underline-offset-4 hover:text-navy" href="/">
              Return to the public site
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
