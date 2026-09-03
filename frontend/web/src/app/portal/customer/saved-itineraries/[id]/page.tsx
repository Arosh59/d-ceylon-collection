import Link from "next/link";
import { notFound } from "next/navigation";

import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../../page-error";

export default async function SavedItineraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const callback = `/portal/customer/saved-itineraries/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getCustomerClient(authentication.accessToken);
  let itinerary;
  try {
    itinerary = await client.getSavedItinerary(id);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!itinerary) {
    notFound();
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Saved itinerary foundation</p>
        <h1 className="mt-3 text-5xl text-navy">{itinerary.title}</h1>
        <p className="mt-5 leading-7 text-ink-muted">
          {itinerary.summary ?? "No planning note supplied."}
        </p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-3">
          <Detail label="Start" value={itinerary.travelStartDate} />
          <Detail label="End" value={itinerary.travelEndDate} />
          <Detail label="Destination" value={itinerary.primaryDestinationSlug} />
        </dl>
        <Link className="button-primary mt-10" href={`${callback}/edit`}>
          Edit saved itinerary
        </Link>
      </article>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-widest text-gold-dark uppercase">{label}</dt>
      <dd className="mt-2 leading-7 text-ink">{value || "Not set"}</dd>
    </div>
  );
}
