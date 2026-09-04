import type { Metadata } from "next";

import { DiscoveryCard } from "@/components/discovery-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore published D Ceylon Collection destinations.",
};

export default async function DestinationsPage() {
  const catalogue = await getCatalogueClient();
  const destinations = await catalogue.getDestinations({ pageSize: 100 });

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Across the island</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Places with room to look closer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Discover coastal cities, highland landscapes, cultural heartlands, and quieter shores.
          </p>
        </Container>
      </section>
      <Container className="py-12 sm:py-20">
        <Link
          className="mb-8 inline-block font-semibold text-navy underline decoration-gold"
          href="/destinations/map"
        >
          Explore the accessible Sri Lanka map
        </Link>
        {destinations.items.length === 0 ? (
          <EmptyState
            description="Published destinations will appear here when they are ready."
            title="No destinations are currently published."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {destinations.items.map((destination) => (
              <DiscoveryCard
                href={`/destinations/${destination.slug}`}
                item={destination}
                key={destination.id}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
