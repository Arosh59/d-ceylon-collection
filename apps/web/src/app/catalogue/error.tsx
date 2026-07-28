"use client";

import { Container } from "@/components/ui/container";

interface CatalogueErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CatalogueError({ reset }: CatalogueErrorProps) {
  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">A brief pause</p>
          <h1 className="mt-5 max-w-3xl text-5xl text-white sm:text-7xl">
            We could not reach the catalogue.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            The service may be restarting. No information was lost, and you can safely try again.
          </p>
          <button
            className="mt-9 min-h-12 rounded-full bg-gold px-6 py-3 text-sm font-semibold tracking-[0.08em] text-navy uppercase hover:bg-gold-light"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
        </Container>
      </section>
    </main>
  );
}
