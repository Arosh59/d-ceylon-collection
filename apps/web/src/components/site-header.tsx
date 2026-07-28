import Link from "next/link";

import { Container } from "./ui/container";

const navigation = [
  { href: "/collections", label: "Collections" },
  { href: "/destinations", label: "Destinations" },
  { href: "/experiences", label: "Experiences" },
  { href: "/accommodation", label: "Stay" },
  { href: "/catalogue", label: "Explore" },
  { href: "/auth/sign-in", label: "Sign in" },
] as const;

function Brand() {
  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="D Ceylon home">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full border border-gold/70 font-serif text-lg text-gold"
      >
        D
      </span>
      <span className="leading-none">
        <span className="block font-serif text-xl text-white">D Ceylon</span>
        <span className="mt-1 block text-[0.58rem] tracking-[0.28em] text-white/60 uppercase">
          Collection
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-navy/35 backdrop-blur-md">
      <Container className="flex min-h-20 items-center justify-between gap-6">
        <Brand />
        <nav aria-label="Primary navigation" className="hidden md:block">
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
        <details className="group relative md:hidden">
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
