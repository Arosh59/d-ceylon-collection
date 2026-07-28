import { notFound } from "next/navigation";

import { AgentQuoteDraftForm, AgentQuoteLifecycle } from "@/components/quotes/quote-workflow";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getQuoteClient } from "@/lib/quotes";

import { handleAgentQuoteError } from "../../page-error";

export default async function AgentQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prepared?: string; sent?: string; updated?: string }>;
}) {
  const { id } = await params;
  const state = await searchParams;
  const callback = `/portal/agent/quotes/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("agent", callback);
  const client = await getQuoteClient(authentication.accessToken);
  let quote;
  try {
    quote = await client.getAgentQuote(id);
  } catch (error) {
    handleAgentQuoteError(error, callback);
  }
  if (!quote) notFound();
  const expiry = new Date();
  expiry.setUTCDate(expiry.getUTCDate() + 30);

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-gold/40 bg-[#fff9e9] p-6" role="note">
          <p className="font-bold text-navy">Commercial draft boundary</p>
          <p className="mt-2 text-sm leading-6 text-ink">
            Prices are fixed-precision quote values, not live supplier availability. Sending creates
            an immutable version; acceptance still does not create a booking or payment.
          </p>
        </div>
        {state.prepared === "1" || state.sent === "1" || state.updated ? (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900" role="status">
            Quote workflow updated successfully.
          </p>
        ) : null}
        <p className="eyebrow mt-9">{quote.status}</p>
        <h1 className="mt-3 text-5xl text-navy">{quote.request.itineraryTitle}</h1>
        <p className="mt-4 text-ink-muted">
          {quote.request.travelStartDate} to {quote.request.travelEndDate} · itinerary revision{" "}
          {String(quote.request.itineraryRevisionNumber)}
        </p>
        <section className="mt-7 rounded-2xl bg-white p-6">
          <h2 className="text-2xl text-navy">Customer request notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
            {quote.request.customerNotes ?? "No customer notes were supplied."}
          </p>
        </section>
        {quote.status === "draft" ? (
          <div className="mt-8">
            <AgentQuoteDraftForm quote={quote} />
          </div>
        ) : null}
        <section className="mt-10">
          <h2 className="text-3xl text-navy">Preserved sent versions</h2>
          {quote.versions.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-navy/20 bg-white p-6 text-ink-muted">
              No immutable version has been sent.
            </p>
          ) : (
            <ol className="mt-5 grid gap-4">
              {[...quote.versions].reverse().map((version) => (
                <li className="rounded-2xl border border-navy/10 bg-white p-6" key={version.id}>
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="eyebrow">Version {String(version.versionNumber)}</p>
                      <h3 className="mt-2 text-3xl text-navy">
                        {money(version.grandTotal.amount, version.currency)}
                      </h3>
                    </div>
                    <p className="text-sm text-ink-muted">
                      Sent {date(version.sentAtUtc)} · expires {date(version.expiresAtUtc)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <div className="mt-8">
          <AgentQuoteLifecycle defaultExpiry={expiry.toISOString().slice(0, 10)} quote={quote} />
        </div>
      </article>
    </main>
  );
}

function money(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount));
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(value),
  );
}
