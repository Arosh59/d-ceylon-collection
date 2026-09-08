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
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const catalogue = await getCatalogueClient();
  const destinations = await catalogue.getDestinations({ pageNumber: 1, pageSize: 100 });
  const regions = destinations.items.map((destination) => ({
    categories: destination.categories,
    district: destination.district,
    id: destination.id,
    imageUrl: destinationImageUrl(destination.heroMedia?.assetKey) ?? null,
    latitude: destination.latitude,
    longitude: destination.longitude,
    name: destination.name,
    productCount: Number(destination.publishedProductCount),
    province: destination.province,
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
