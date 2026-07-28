import type { Metadata } from "next";
import Link from "next/link";

import { PaginationNav } from "@/components/pagination-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { deleteItinerary } from "../actions";
import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "Saved itineraries" };

export default async function SavedItinerariesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = customerPageNumber((await searchParams).page);
  const authentication = await requirePortalAuthentication(
    "customer",
    "/portal/customer/saved-itineraries",
  );
  const client = await getCustomerClient(authentication.accessToken);
  let page;
  try {
    page = await client.getSavedItineraries({ pageNumber, pageSize: 12 });
  } catch (error) {
    handleCustomerPageError(error, "/portal/customer/saved-itineraries");
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Planning metadata</p>
            <h1 className="mt-3 text-5xl text-navy">Saved itineraries</h1>
            <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
              Capture a title, dates, destination, and planning note. Route generation and the
              itinerary builder are intentionally reserved for Phase 7.
            </p>
          </div>
          <Link className="button-primary" href="/portal/customer/saved-itineraries/new">
            Save an itinerary
          </Link>
        </div>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              actionHref="/portal/customer/saved-itineraries/new"
              actionLabel="Save an itinerary"
              description="Create a lightweight planning record when you have an idea to remember."
              title="No itinerary foundations saved."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((itinerary) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={itinerary.id}
                >
                  <h2 className="text-3xl text-navy">{itinerary.title}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {itinerary.primaryDestinationSlug ?? "Destination not set"}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                      className="text-sm font-bold text-navy underline decoration-gold"
                      href={`/portal/customer/saved-itineraries/${itinerary.id}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="text-sm font-bold text-navy underline decoration-gold"
                      href={`/portal/customer/saved-itineraries/${itinerary.id}/edit`}
                    >
                      Edit
                    </Link>
                    <form action={deleteItinerary}>
                      <input name="id" type="hidden" value={itinerary.id} />
                      <input
                        name="concurrencyToken"
                        type="hidden"
                        value={itinerary.concurrencyToken}
                      />
                      <button className="text-sm font-bold text-red-800 underline" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <PaginationNav
            ariaLabel="Saved itinerary pagination"
            basePath="/portal/customer/saved-itineraries"
            pagination={page.pagination}
            query={{}}
          />
        </div>
      </section>
    </main>
  );
}

function customerPageNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 10_000 ? parsed : 1;
}
