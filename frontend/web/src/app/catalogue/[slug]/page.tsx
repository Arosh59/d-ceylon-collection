import { ApiRequestError } from "@dceylon/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { getCatalogueClient } from "@/lib/catalogue";
import { formatStartingPrice } from "@/lib/format-price";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journey",
};

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const catalogue = await getCatalogueClient();
  const product = await catalogue.getProduct(slug).catch((error: unknown) => {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  });

  const references = [
    { label: "Collections", values: product.collections, path: "/collections" },
    { label: "Destinations", values: product.destinations, path: "/destinations" },
    { label: "Categories", values: product.categories, path: undefined },
    { label: "Tags", values: product.tags, path: undefined },
  ].filter((group) => group.values.length > 0);

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">{product.productType.name}</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">{product.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            {product.shortDescription}
          </p>
        </Container>
      </section>
      <Container className="-mt-8 relative z-10">
        <MediaPlaceholder
          className="aspect-[16/7] rounded-[1.75rem] shadow-soft"
          media={product.media[0] ?? null}
        />
      </Container>
      <Container className="grid gap-10 py-12 sm:py-20 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="journey-overview">
          <p className="eyebrow">Journey overview</p>
          <h2 className="mt-4 text-4xl" id="journey-overview">
            The shape of this experience
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">{product.description}</p>
          {references.map((group) => (
            <div className="mt-9" key={group.label}>
              <h3 className="text-xl">{group.label}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <li className="rounded-full bg-navy/6 px-4 py-2 text-sm" key={value.id}>
                    {group.path ? (
                      <Link href={`${group.path}/${value.slug}`}>{value.name}</Link>
                    ) : (
                      value.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <aside className="h-fit rounded-[1.75rem] border border-navy/10 bg-white p-7 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
            Starting point
          </p>
          <p className="mt-4 font-serif text-3xl text-navy">
            {formatStartingPrice(product.startingPrice, product.currency)}
          </p>
          {product.durationMinutes ? (
            <p className="mt-3 text-sm text-ink-muted">
              Approx. {Math.ceil(Number(product.durationMinutes) / 60)} hours
            </p>
          ) : null}
          <p className="mt-6 border-t border-navy/10 pt-6 text-sm leading-6 text-ink-muted">
            Live availability and quote requests are intentionally deferred to later secured phases.
          </p>
        </aside>
      </Container>
    </main>
  );
}
