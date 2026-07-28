import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Explore considered journeys, experiences, and stays across Sri Lanka.",
};

export default async function CataloguePage() {
  const catalogue = await getCatalogueClient();
  const [products, productTypes] = await Promise.all([
    catalogue.getProducts({ pageNumber: 1, pageSize: 12 }),
    catalogue.getProductTypes({ pageNumber: 1, pageSize: 20 }),
  ]);

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">The catalogue</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Find your way into Sri Lanka.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            A considered collection of journeys, stays, experiences, and services—designed to be
            explored without hurry.
          </p>
          {productTypes.items.length > 0 ? (
            <ul aria-label="Available product types" className="mt-8 flex flex-wrap gap-2">
              {productTypes.items.map((productType) => (
                <li
                  className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/78"
                  key={productType.id}
                >
                  {productType.name}
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </section>
      <Container className="py-16 sm:py-24">
        {products.items.length === 0 ? (
          <EmptyState
            description="The API connection is healthy and the catalogue is ready for the curated product data arriving in Phase 4."
            title="The first journeys are being curated."
          />
        ) : (
          <>
            <p className="mb-8 text-sm text-ink-muted">
              Showing {products.items.length} of {products.pagination.totalItems} journeys
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </Container>
    </main>
  );
}
