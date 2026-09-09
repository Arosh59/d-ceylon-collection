import Image from "next/image";
import Link from "next/link";

import { Container } from "./ui/container";

const navigation = [
  { href: "/collections", label: "Collections" },
  { href: "/destinations", label: "Destinations" },
  { href: "/experiences", label: "Experiences" },
  { href: "/accommodation", label: "Stay" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
  { href: "/catalogue", label: "Explore" },
  { href: "/auth/sign-up", label: "Create account" },
  { href: "/auth/sign-in", label: "Sign in" },
] as const;

function Brand() {
  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="D Ceylon home">
      <Image
        alt=""
        className="size-12 rounded-full object-cover shadow-[0_0_0_1px_rgba(231,193,113,0.28)]"
        height={48}
        priority
        src="/brand/d-ceylon-mark-navy.webp"
        width={48}
      />
      <span className="leading-none">
        <span className="block font-serif text-xl text-white">D’Ceylon</span>
        <span className="mt-1 block text-[0.58rem] tracking-[0.28em] text-white/60 uppercase">
          Collection
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-gold/15 bg-navy/95 shadow-[0_12px_35px_rgba(2,14,36,0.16)] backdrop-blur-md">
      <Container className="flex min-h-20 items-center justify-between gap-6">
        <Brand />
        <nav aria-label="Primary navigation" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="text-sm text-white/78 transition-colors hover:text-gold-light"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className="group relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-white/30 px-4 py-2 text-sm text-white marker:content-none">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute top-14 right-0 w-64 rounded-2xl border border-white/15 bg-navy p-3 shadow-2xl"
          >
            <ul>
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    className="block rounded-xl px-4 py-3 text-white/82 hover:bg-white/8 hover:text-gold-light"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </Container>
    </header>
  );
}
