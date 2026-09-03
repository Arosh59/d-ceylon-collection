import { Container } from "./container";
import { EmptyState } from "./empty-state";

interface PlaceholderPageProps {
  description: string;
  eyebrow: string;
  title: string;
}

export function PlaceholderPage({ description, eyebrow, title }: PlaceholderPageProps) {
  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{description}</p>
        </Container>
      </section>
      <Container className="py-16 sm:py-24">
        <EmptyState
          description="Curated content and discovery tools arrive with the Phase 4 catalogue implementation."
          title="More considered stories are coming."
        />
      </Container>
    </main>
  );
}
