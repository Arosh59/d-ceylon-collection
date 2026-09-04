import { ApiRequestError } from "@dceylon/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProductListing } from "@/components/product-listing";
import { Container } from "@/components/ui/container";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collection",
};

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalogue = await getCatalogueClient();
  const collection = await catalogue.getCollection(slug).catch(handleNotFound);
  const products = await catalogue.getProducts({ collection: slug, pageSize: 12 });

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Collection</p>
          <h1 className="mt-5 text-6xl text-white sm:text-8xl">{collection.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{collection.summary}</p>
        </Container>
      </section>
      <Container className="-mt-8 relative z-10">
        <MediaPlaceholder
          className="aspect-[16/7] rounded-[1.75rem] shadow-soft"
          media={collection.heroMedia}
        />
      </Container>
      <Container className="py-12 sm:py-20">
        <p className="max-w-3xl text-xl leading-9 text-ink-muted">{collection.description}</p>
        <section aria-labelledby="collection-products" className="mt-16">
          <h2 className="mb-8 text-4xl" id="collection-products">
            In the {collection.name} collection
          </h2>
          <ProductListing
            emptyDescription="This published collection does not currently contain published catalogue products."
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
