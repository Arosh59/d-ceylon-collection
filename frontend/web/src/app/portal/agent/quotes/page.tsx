import type { Metadata } from "next";
import Link from "next/link";

import { PaginationNav } from "@/components/pagination-nav";
import { PrepareQuoteForm } from "@/components/quotes/quote-workflow";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getQuoteClient } from "@/lib/quotes";

import { handleAgentQuoteError } from "../page-error";

export const metadata: Metadata = { title: "Agent quote queue" };

export default async function AgentQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = pageValue((await searchParams).page);
  const callback = "/portal/agent/quotes";
  const authentication = await requirePortalAuthentication("agent", callback);
  const client = await getQuoteClient(authentication.accessToken);
  let page;
  try {
    page = await client.getAgentQuotes({ pageNumber, pageSize: 20 });
  } catch (error) {
    handleAgentQuoteError(error, callback);
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-6xl">
        <p className="eyebrow">Organisation-scoped workflow</p>
        <h1 className="mt-3 text-5xl text-navy">Quote queue</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          Unassigned requests may be claimed once. Assigned quotes remain visible only to their
          owning organisation. Sent versions are immutable and never create bookings.
        </p>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              description="No unassigned customer requests or organisation-owned quotes are available."
              title="The quote queue is empty."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((quote) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={quote.id}
                >
                  <p className="eyebrow">
                    {quote.isUnassigned ? "Unassigned request" : quote.status}
                  </p>
                  <h2 className="mt-3 text-3xl text-navy">{quote.itineraryTitle}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {quote.travelStartDate} to {quote.travelEndDate}
                  </p>
                  {quote.isUnassigned ? (
                    <div className="mt-6">
                      <PrepareQuoteForm
                        concurrencyToken={quote.concurrencyToken}
                        quoteId={quote.id}
                      />
                    </div>
                  ) : (
                    <Link
                      className="mt-6 inline-block text-sm font-bold text-navy underline decoration-gold"
                      href={`/portal/agent/quotes/${quote.id}`}
                    >
                      Prepare or review quote
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          <PaginationNav
            ariaLabel="Agent quote queue pagination"
            basePath="/portal/agent/quotes"
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
