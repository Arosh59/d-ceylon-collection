import type { Metadata } from "next";
import Link from "next/link";

import { PaginationNav } from "@/components/pagination-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getQuoteClient } from "@/lib/quotes";

import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "My quotes" };

export default async function CustomerQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = pageValue((await searchParams).page);
  const callback = "/portal/customer/quotes";
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getQuoteClient(authentication.accessToken);
  let page;
  try {
    page = await client.getCustomerQuotes({ pageNumber, pageSize: 12 });
  } catch (error) {
    handleCustomerPageError(error, callback);
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Commercial review</p>
        <h1 className="mt-3 text-5xl text-navy">My quotes</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          Review itemized, versioned quotes requested from your itinerary drafts. A quote is not
          availability, a booking, or payment confirmation.
        </p>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              actionHref="/portal/customer/travel-plans"
              actionLabel="Review travel plans"
              description="Open a reviewed itinerary revision to request your first itemized quote."
              title="No quote requests yet."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((quote) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={quote.id}
                >
                  <p className="eyebrow">{quote.status}</p>
                  <h2 className="mt-3 text-3xl text-navy">{quote.itineraryTitle}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {quote.travelStartDate} to {quote.travelEndDate}
                  </p>
                  {quote.currency && quote.grandTotal !== null ? (
                    <p className="mt-4 font-bold text-navy">
                      Latest sent total: {money(quote.grandTotal, quote.currency)}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-ink-muted">
                      Awaiting an itemized sent version.
                    </p>
                  )}
                  <Link
                    className="mt-6 inline-block text-sm font-bold text-navy underline decoration-gold"
                    href={`/portal/customer/quotes/${quote.id}`}
                  >
                    Review quote
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <PaginationNav
            ariaLabel="Quote pagination"
            basePath="/portal/customer/quotes"
            pagination={page.pagination}
            query={{}}
          />
        </div>
      </section>
    </main>
  );
}

function pageValue(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 10_000 ? parsed : 1;
}

function money(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount));
}
