import { ApiRequestError } from "@dceylon/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProductListing } from "@/components/product-listing";
import { Container } from "@/components/ui/container";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Destination",
};

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalogue = await getCatalogueClient();
  const destination = await catalogue.getDestination(slug).catch(handleNotFound);
  const products = await catalogue.getProducts({ destination: slug, pageSize: 12 });

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Destination</p>
          <h1 className="mt-5 text-6xl text-white sm:text-8xl">{destination.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{destination.summary}</p>
        </Container>
      </section>
      <Container className="-mt-8 relative z-10">
        <MediaPlaceholder
          className="aspect-[16/7] rounded-[1.75rem] shadow-soft"
          media={destination.heroMedia}
        />
      </Container>
      <Container className="py-16 sm:py-24">
        <p className="max-w-3xl text-xl leading-9 text-ink-muted">{destination.description}</p>
        <section aria-labelledby="destination-products" className="mt-16">
          <h2 className="mb-8 text-4xl" id="destination-products">
            Explore {destination.name}
          </h2>
          <ProductListing
            emptyDescription="This published destination does not currently contain published catalogue products."
            emptyTitle="No journeys are linked yet."
            products={products}
          />
        </section>
      </Container>
    </main>
  );
}

function handleNotFound(error: unknown): never {
  if (error instanceof ApiRequestError && error.status === 404) {
    notFound();
  }
  throw error;
}
