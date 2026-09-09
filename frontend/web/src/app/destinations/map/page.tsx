import type { Metadata } from "next";

import { DestinationMap } from "@/components/destination-map";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogueClient } from "@/lib/catalogue";
import { destinationImageUrl } from "@/lib/destination-media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Sri Lanka",
  description: "Explore D Ceylon Collection destinations across an interactive map of Sri Lanka.",
};

export default async function DestinationMapPage() {
  // NEXT_PUBLIC_* values are frozen into a Next.js bundle at build time. Prefer an
  // unprefixed server variable so one Docker image can be configured safely at runtime.
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"]?.trim();
  const catalogue = await getCatalogueClient();
  const destinations = await catalogue.getDestinations({ pageNumber: 1, pageSize: 100 });
  const regions = destinations.items.map((destination) => ({
    categories: destination.categories ?? [],
    district: destination.district ?? null,
    id: destination.id,
    imageUrl: destinationImageUrl(destination.heroMedia?.assetKey) ?? null,
    latitude: destination.latitude ?? null,
    longitude: destination.longitude ?? null,
    name: destination.name,
    productCount: Number(destination.publishedProductCount ?? 0),
    province: destination.province ?? null,
    slug: destination.slug,
    summary: destination.summary,
  }));

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow text-gold-light">Destination map</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">Explore Sri Lanka</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Move from coast to highlands and cultural heartlands. Search the island, choose a
            marker, and continue into experiences shaped around that destination.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        {regions.length === 0 ? (
          <EmptyState
            description="Published destinations will appear on the accessible map when ready."
            title="No map destinations are currently published."
          />
        ) : (
          <DestinationMap apiKey={googleMapsApiKey} destinations={regions} />
        )}
      </section>
    </main>
  );
}
