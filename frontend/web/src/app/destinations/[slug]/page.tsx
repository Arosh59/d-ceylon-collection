import { ApiRequestError } from "@dceylon/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProductListing } from "@/components/product-listing";
import { DestinationMotionGallery } from "@/components/sigiriya-motion-gallery";
import { Container } from "@/components/ui/container";
import { getCatalogueClient } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

const destinationMotionImageBySlug: Partial<Record<string, string>> = {
  colombo: "/images/destinations/colombo-provided.jpg",
  ella: "/images/destinations/ella-provided.jpg",
  galle: "/images/destinations/galle-provided.png",
  kandy: "/images/destinations/kandy-provided.jpg",
  sigiriya: "/images/destinations/sigiriya-provided.jpg",
  tangalle: "/images/destinations/tangalle-provided.jpg",
};

const destinationMotionSlidesBySlug: Partial<
  Record<string, readonly { alt: string; src: string }[]>
> = {
  colombo: [
    {
      alt: "Colombo's modern skyline beside Beira Lake",
      src: "/images/destinations/colombo-provided.jpg",
    },
    {
      alt: "Colombo's lakeside at dusk",
      src: "/images/destinations/colombo-provided-lakeside.jpg",
    },
    {
      alt: "The Colombo National Museum",
      src: "/images/destinations/colombo-provided-museum.jpg",
    },
  ],
  ella: [
    {
      alt: "A train crossing Nine Arch Bridge in Ella",
      src: "/images/destinations/ella-provided.jpg",
    },
    {
      alt: "Ravana Falls near Ella",
      src: "/images/destinations/ella-provided-ravana-falls.jpg",
    },
    {
      alt: "A hill swing overlooking Ella's landscape",
      src: "/images/destinations/ella-provided-swing.webp",
    },
  ],
  galle: [
    {
      alt: "Aerial view of Galle Fort and its lighthouse",
      src: "/images/destinations/galle-provided.png",
    },
    {
      alt: "Galle Fort's clock tower and ramparts",
      src: "/images/destinations/galle-provided-fort.jpg",
    },
    { alt: "A bastion along Galle Fort", src: "/images/destinations/galle-provided-bastion.jpg" },
  ],
  sigiriya: [
    {
      alt: "Aerial view of Sigiriya Rock Fortress",
      src: "/images/destinations/sigiriya-provided.jpg",
    },
    {
      alt: "Sigiriya Rock beyond a pool at dusk",
      src: "/images/destinations/sigiriya-provided-evening.jpg",
    },
  ],
  tangalle: [
    {
      alt: "Aerial view of Tangalle's tropical coast",
      src: "/images/destinations/tangalle-provided.jpg",
    },
    {
      alt: "Wewurukannala Temple near Tangalle",
      src: "/images/destinations/tangalle-provided-buddha.webp",
    },
    {
      alt: "Tangalle's monument by the coast",
      src: "/images/destinations/tangalle-provided-monument.jpg",
    },
  ],
};

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
        {slug === "sigiriya" ||
        slug === "colombo" ||
        slug === "ella" ||
        slug === "galle" ||
        slug === "kandy" ||
        slug === "tangalle" ? (
          <DestinationMotionGallery
            alt={
              destination.heroMedia?.altText ??
              (slug === "colombo"
                ? "Colombo skyline and Beira Lake at dusk"
                : slug === "ella"
                  ? "Ella's misty hill-country landscape"
                  : slug === "galle"
                    ? "Galle Fort on Sri Lanka's southern coast"
                    : slug === "kandy"
                      ? "Kandy Lake in Sri Lanka's central highlands"
                      : slug === "tangalle"
                        ? "Tangalle's palm-lined southern coast"
                        : "Sigiriya Rock Fortress in central Sri Lanka")
            }
            caption={
              slug === "colombo"
                ? "A slow city drift reveals Colombo's lake, skyline, and evening lights."
                : slug === "ella"
                  ? "A slow hill-country drift reveals Ella's green valley and railway landscape."
                  : slug === "galle"
                    ? "A slow coastal drift reveals Galle Fort and its ocean-facing walls."
                    : slug === "kandy"
                      ? "A calm lakeside drift reveals Kandy's water, gardens, and hill-country setting."
                      : slug === "tangalle"
                        ? "A slow shoreline drift reveals Tangalle's tropical coast."
                        : "A slow panoramic motion reveals the Sigiriya Rock Fortress and its surrounding gardens."
            }
            imageSrc={destinationMotionImageBySlug[slug] ?? `/images/destinations/${slug}.jpg`}
            slides={destinationMotionSlidesBySlug[slug]}
            variant={slug}
          />
        ) : (
          <MediaPlaceholder
            className="aspect-[16/7] rounded-[1.75rem] shadow-soft"
            media={destination.heroMedia}
          />
        )}
      </Container>
      <Container className="py-12 sm:py-20">
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
