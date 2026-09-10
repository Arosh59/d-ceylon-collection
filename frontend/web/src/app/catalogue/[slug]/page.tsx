import { ApiRequestError, type ProductBookingProfile } from "@dceylon/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProductAvailabilityPanel } from "@/components/product-availability";
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
          {product.bookingProfile ? <BookingDetails profile={product.bookingProfile} /> : null}
        </section>
        <aside className="h-fit rounded-[1.75rem] border border-navy/10 bg-white p-7 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
            Starting point
          </p>
          <p className="mt-4 font-serif text-3xl text-navy">
            {formatStartingPrice(product.startingPrice, product.currency)}
          </p>
          {product.bookingProfile ? (
            <p className="mt-2 text-sm text-ink-muted">
              {pricingUnit(product.bookingProfile.pricingUnit)} ·{" "}
              {product.bookingProfile.bookingMode === "instant"
                ? "Instant booking"
                : "Request to book"}
            </p>
          ) : null}
          {product.durationMinutes ? (
            <p className="mt-3 text-sm text-ink-muted">
              Approx. {Math.ceil(Number(product.durationMinutes) / 60)} hours
            </p>
          ) : null}
          <p className="mt-6 border-t border-navy/10 pt-6 text-sm leading-6 text-ink-muted">
            Prices and capacity are revalidated by D Ceylon before a reservation is confirmed.
          </p>
          <div className="mt-6 border-t border-navy/10 pt-6">
            <ProductAvailabilityPanel
              productSlug={product.slug}
              productType={product.productType.slug}
              timeZone={product.bookingProfile?.timeZone ?? "Asia/Colombo"}
            />
          </div>
        </aside>
      </Container>
    </main>
  );
}

function BookingDetails({ profile }: { profile: ProductBookingProfile }) {
  const facts = [
    profile.meetingPoint ? ["Meeting point", profile.meetingPoint] : null,
    profile.languages.length ? ["Languages", profile.languages.join(", ")] : null,
    profile.minimumAge !== null ? ["Minimum age", `${profile.minimumAge} years`] : null,
    profile.maximumGroupSize !== null
      ? ["Maximum group size", `${profile.maximumGroupSize} guests`]
      : null,
    profile.pickupAvailable
      ? [
          "Pickup",
          profile.pickupInstructions || "Pickup is available; details follow after booking.",
        ]
      : null,
    profile.accessibilityInformation ? ["Accessibility", profile.accessibilityInformation] : null,
  ].filter((item): item is string[] => item !== null);
  const lists = [
    { heading: "What is included", values: profile.inclusions },
    { heading: "What is not included", values: profile.exclusions },
    { heading: "What to bring", values: profile.whatToBring },
    { heading: "Important information", values: profile.importantInformation },
  ].filter(({ values }) => values.length > 0);

  if (!facts.length && !lists.length && !profile.cancellationPolicy && !profile.weatherPolicy) {
    return null;
  }

  return (
    <section aria-labelledby="booking-details" className="mt-14 border-t border-navy/10 pt-10">
      <p className="eyebrow">Before you book</p>
      <h2 className="mt-4 text-3xl" id="booking-details">
        Practical details
      </h2>
      {facts.length ? (
        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          {facts.map(([term, description]) => (
            <div className="rounded-2xl bg-mist p-5" key={term}>
              <dt className="text-sm font-semibold text-navy">{term}</dt>
              <dd className="mt-2 text-sm leading-6 text-ink-muted">{description}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {lists.map(({ heading, values }) => (
        <div className="mt-8" key={heading}>
          <h3 className="text-xl">{heading}</h3>
          <ul className="mt-3 grid gap-2 text-base leading-7 text-ink-muted">
            {values.map((value) => (
              <li className="flex gap-3" key={value}>
                <span aria-hidden="true" className="text-gold-dark">
                  •
                </span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {profile.cancellationPolicy ? (
        <Policy heading="Cancellation policy" value={profile.cancellationPolicy} />
      ) : null}
      {profile.weatherPolicy ? (
        <Policy heading="Weather policy" value={profile.weatherPolicy} />
      ) : null}
    </section>
  );
}

function Policy({ heading, value }: { heading: string; value: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-navy/10 p-5">
      <h3 className="text-xl">{heading}</h3>
      <p className="mt-3 text-sm leading-7 text-ink-muted">{value}</p>
    </div>
  );
}

function pricingUnit(value: ProductBookingProfile["pricingUnit"]): string {
  const labels = {
    person: "Per person",
    group: "Per group",
    night: "Per night",
    room: "Per room",
  } as const;
  return labels[value];
}
