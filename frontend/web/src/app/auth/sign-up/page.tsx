import Link from "next/link";
import Image from "next/image";

import { SignInPanel } from "@/components/auth/sign-in-panel";
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
  const testingEnabled = process.env.APP_ENVIRONMENT === "Testing";

  return (
    <main className="min-h-screen bg-canvas px-4 pt-28 pb-16 sm:px-8 sm:pt-36" id="main-content">
      <section
        aria-labelledby="sign-up-heading"
        className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(5,29,71,0.16)] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div className="relative min-h-[30rem] overflow-hidden bg-navy text-white lg:min-h-[45rem]">
          <Image
            alt="A stone path beside a warm ochre heritage temple in Sri Lanka's hill country"
            className="object-cover opacity-75"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            src="/images/editorial/kandy-heritage.webp"
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,29,71,0.2),rgba(2,17,43,0.94))]" />
          <div
            aria-hidden="true"
            className="hero-grain absolute inset-0 opacity-20 mix-blend-soft-light"
          />
          <div className="relative flex h-full min-h-[30rem] flex-col justify-between p-7 sm:p-10 lg:min-h-[45rem]">
            <div className="flex items-center gap-3">
              <Image
                alt=""
                className="size-12 rounded-full object-cover"
                height={48}
                src="/brand/d-ceylon-mark-navy.webp"
                width={48}
              />
              <span className="text-xs font-semibold tracking-[0.24em] text-white/75 uppercase">
                A private travel space
              </span>
            </div>
            <div>
              <p className="eyebrow text-gold-light">Keep the feeling close</p>
              <h2 className="mt-4 max-w-md text-4xl sm:text-5xl">
                Your next chapter starts with a little curiosity.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-white/70">
                Save the places that call to you, shape an itinerary at your own pace, and return
                whenever the time feels right.
              </p>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-12 lg:p-16">
          <p className="eyebrow">Your journey, saved</p>
          <h1 className="mt-3 max-w-lg text-4xl text-navy sm:text-5xl" id="sign-up-heading">
            Create your D Ceylon account
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-ink-muted">
            One secure account for the ideas, people, and places you want to carry into your next
            journey.
          </p>

          <ul className="mt-8 grid gap-3 border-y border-navy/10 py-6 text-sm text-ink-muted sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <li className="flex items-center gap-3">
              <span className="text-lg text-gold-dark">✦</span> Save inspiration
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg text-gold-dark">✦</span> Build a wish list
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg text-gold-dark">✦</span> Plan in your time
            </li>
          </ul>

          <div className="mt-8">
            <SignInPanel callbackUrl={callbackUrl} mode="sign-up" testingEnabled={testingEnabled} />
          </div>
          <p className="mt-7 text-sm text-ink-muted">
            Already have an account?{" "}
            <Link
              className="font-semibold text-navy underline decoration-gold underline-offset-4 hover:text-gold-dark"
              href={`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Sign in
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
