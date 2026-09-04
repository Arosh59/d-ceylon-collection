import type { Metadata } from "next";

import { DestinationMap } from "@/components/destination-map";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sri Lanka destination map",
  description: "An accessible destination explorer for D Ceylon Collection.",
};

export default async function DestinationMapPage() {
  const catalogue = await getCatalogueClient();
  const destinations = await catalogue.getDestinations({ pageNumber: 1, pageSize: 100 });
  const regions = await Promise.all(
    destinations.items.map(async (destination) => {
      const products = await catalogue.getProducts({
        destination: destination.slug,
        pageNumber: 1,
        pageSize: 1,
      });
      return {
        name: destination.name,
        productCount: Number(products.pagination.totalItems),
        slug: destination.slug,
        summary: destination.summary,
      };
    }),
  );

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow text-gold-light">Sri Lanka map</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Follow the island by feeling, not just distance.
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        {regions.length === 0 ? (
          <EmptyState
            description="Published destinations will appear on the accessible map when ready."
            title="No map destinations are currently published."
          />
        ) : (
          <DestinationMap destinations={regions} />
        )}
      </section>
    </main>
  );
}
