import { Container } from "@/components/ui/container";

export default function CatalogueLoading() {
  return (
    <main aria-busy="true" id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">The catalogue</p>
          <div className="mt-6 h-16 max-w-3xl animate-pulse rounded-2xl bg-white/10" />
          <p className="sr-only" role="status">
            Loading catalogue
          </p>
        </Container>
      </section>
      <Container className="grid gap-6 py-16 sm:grid-cols-2 sm:py-24 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            aria-hidden="true"
            className="h-96 animate-pulse rounded-[1.75rem] bg-navy/8"
            key={index}
          />
        ))}
      </Container>
    </main>
  );
}
