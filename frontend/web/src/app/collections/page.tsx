import type { Metadata } from "next";

import { DiscoveryCard } from "@/components/discovery-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore Root, Flow, Awaken, Breathe, and Rediscover.",
};

export default async function CollectionsPage() {
  const catalogue = await getCatalogueClient();
  const collections = await catalogue.getCollections({ pageSize: 100 });

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Five ways to travel</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Begin with how you want to feel.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Root, Flow, Awaken, Breathe, and Rediscover offer five perspectives on the island.
          </p>
        </Container>
      </section>
      <Container className="py-12 sm:py-20">
        {collections.items.length === 0 ? (
          <EmptyState
            description="Published collections will appear here when they are ready."
            title="No collections are currently published."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {collections.items.map((collection) => (
              <DiscoveryCard
                href={`/collections/${collection.slug}`}
                item={collection}
                key={collection.id}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
