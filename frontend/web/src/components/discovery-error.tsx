"use client";

import { Container } from "./ui/container";

export function DiscoveryError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content">
      <Container className="py-20 text-center sm:py-24">
        <p className="eyebrow">Connection interrupted</p>
        <h1 className="mt-5 text-5xl">This part of the journey is temporarily unavailable.</h1>
        <p className="mx-auto mt-6 max-w-xl leading-7 text-ink-muted">
          The catalogue service could not complete the request. Try again without losing your place.
        </p>
        <button className="button-primary mt-8" onClick={reset} type="button">
          Try again
        </button>
      </Container>
    </main>
  );
}
