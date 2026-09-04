import type { Metadata } from "next";

import { CatalogueFilters } from "@/components/catalogue-filters";
import { PaginationNav } from "@/components/pagination-nav";
import { ProductCard } from "@/components/product-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";
import {
  catalogueQueryRecord,
  parseCatalogueSearchParams,
  type SearchParameters,
} from "@/lib/discovery-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Explore considered journeys, experiences, and stays across Sri Lanka.",
};

interface CataloguePageProps {
  searchParams: Promise<SearchParameters>;
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const search = parseCatalogueSearchParams(await searchParams);
  const catalogue = await getCatalogueClient();
  const [products, productTypes, categories, collections, destinations, tags] = await Promise.all([
    catalogue.getProducts(search),
    catalogue.getProductTypes({ pageSize: 100 }),
    catalogue.getCategories({ pageSize: 100 }),
    catalogue.getCollections({ pageSize: 100 }),
    catalogue.getDestinations({ pageSize: 100 }),
    catalogue.getTags({ pageSize: 100 }),
  ]);

  const filterValues = {
    query: search.query,
    productType: search.productType,
    category: search.category,
    collection: search.collection,
    destination: search.destination,
    tag: search.tag,
    minimumPrice: search.minimumPrice,
    maximumPrice: search.maximumPrice,
    maximumDurationMinutes: search.maximumDurationMinutes,
    sort: search.sort,
  };

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">The catalogue</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Find your way into Sri Lanka.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Search and filter considered journeys, stays, and experiences by place, perspective, and
            pace.
          </p>
        </Container>
      </section>
      <Container className="py-10 sm:py-16">
        <CatalogueFilters
          categories={categories.items}
          collections={collections.items}
          destinations={destinations.items}
          productTypes={productTypes.items}
          tags={tags.items}
          values={filterValues}
        />
        <section aria-labelledby="catalogue-results" className="mt-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Discovery results</p>
              <h2 className="mt-3 text-4xl" id="catalogue-results">
                {products.pagination.totalItems}{" "}
                {Number(products.pagination.totalItems) === 1
                  ? "place to begin"
                  : "places to begin"}
              </h2>
            </div>
            <p className="text-sm text-ink-muted">
              Page {products.pagination.pageNumber} of{" "}
              {Math.max(1, Number(products.pagination.totalPages))}
            </p>
          </div>
          {products.items.length === 0 ? (
            <EmptyState
              description="Try clearing one or more filters, changing the search phrase, or browsing all catalogue entries."
              title="No journeys match these filters."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <PaginationNav
            basePath="/catalogue"
            pagination={products.pagination}
            query={catalogueQueryRecord(search)}
          />
        </section>
      </Container>
    </main>
  );
}
