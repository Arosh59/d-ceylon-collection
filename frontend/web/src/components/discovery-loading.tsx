import { Container } from "./ui/container";

export function DiscoveryLoading() {
  return (
    <main aria-busy="true" aria-live="polite" id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Loading discovery</p>
          <div className="mt-6 h-16 max-w-2xl animate-pulse rounded-2xl bg-white/12" />
        </Container>
      </section>
      <Container className="grid gap-6 py-16 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            className="h-80 animate-pulse rounded-[1.75rem] border border-navy/8 bg-white"
            key={item}
          />
        ))}
      </Container>
    </main>
  );
}
