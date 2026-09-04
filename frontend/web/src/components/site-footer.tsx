import Link from "next/link";

import { Container } from "./ui/container";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <Container className="grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <p className="font-serif text-3xl">D Ceylon Collection</p>
          <p className="mt-4 max-w-sm leading-7 text-white/64">
            Thoughtful Sri Lankan journeys, shaped with local perspective and space to rediscover
            what matters.
          </p>
        </div>
        <nav aria-label="Footer exploration">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Explore</p>
          <ul className="mt-5 space-y-3 text-white/72">
            <li>
              <Link href="/collections">Collections</Link>
            </li>
            <li>
              <Link href="/destinations">Destinations</Link>
            </li>
            <li>
              <Link href="/catalogue">Catalogue</Link>
            </li>
            <li>
              <Link href="/contact">Contact us</Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Plan ahead</p>
          <p className="mt-5 leading-7 text-white/64">
            Save the places you love, then shape a journey around the way you want to feel.
          </p>
          <Link
            className="mt-5 inline-block text-sm font-semibold text-white underline decoration-gold underline-offset-4 hover:text-gold-light"
            href="/auth/sign-up"
          >
            Create your travel space
          </Link>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getUTCFullYear()} D Ceylon Collection</p>
          <p>Discover Ceylon. Rediscover Yourself.</p>
        </Container>
      </div>
    </footer>
  );
}
