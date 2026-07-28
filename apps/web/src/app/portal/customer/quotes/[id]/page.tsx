import { notFound } from "next/navigation";

import { CustomerQuoteActions } from "@/components/quotes/quote-workflow";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getQuoteClient } from "@/lib/quotes";

import { handleCustomerPageError } from "../../page-error";

export default async function CustomerQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string; updated?: string }>;
}) {
  const { id } = await params;
  const state = await searchParams;
  const callback = `/portal/customer/quotes/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getQuoteClient(authentication.accessToken);
  let quote;
  try {
    quote = await client.getCustomerQuote(id);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!quote) notFound();

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-gold/40 bg-[#fff9e9] p-6" role="note">
          <p className="font-bold text-navy">Quote review — not a booking</p>
          <p className="mt-2 text-sm leading-6 text-ink">
            Prices, assumptions, and expiry apply only to the named immutable version. This page
            does not confirm supplier availability, bookability, payment, or a booking.
          </p>
        </div>
        {state.requested === "1" ? (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900" role="status">
            Your quote request was recorded for this reviewed itinerary revision.
          </p>
        ) : null}
        {state.updated ? (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900" role="status">
            Quote status updated to {quote.status}.
          </p>
        ) : null}
        <p className="eyebrow mt-9">{quote.status}</p>
        <h1 className="mt-3 text-5xl text-navy">{quote.request.itineraryTitle}</h1>
        <p className="mt-4 text-ink-muted">
          {quote.request.travelStartDate} to {quote.request.travelEndDate} · itinerary revision{" "}
          {String(quote.request.itineraryRevisionNumber)}
        </p>
        {quote.request.customerNotes ? (
          <section className="mt-7 rounded-2xl bg-white p-6">
            <h2 className="text-2xl text-navy">Your request notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
              {quote.request.customerNotes}
            </p>
          </section>
        ) : null}
        {quote.versions.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-navy/20 bg-white p-8">
            <h2 className="text-3xl text-navy">Awaiting an agent-prepared version</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              Your request is recorded as a draft. No price has been sent for review.
            </p>
          </section>
        ) : (
          <section className="mt-9">
            <h2 className="text-3xl text-navy">Immutable quote versions</h2>
            <div className="mt-5 grid gap-7">
              {[...quote.versions].reverse().map((version) => (
                <article
                  className="rounded-3xl border border-navy/10 bg-white p-6 shadow-soft sm:p-8"
                  key={version.id}
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="eyebrow">Version {String(version.versionNumber)}</p>
                      <h3 className="mt-2 text-3xl text-navy">
                        {money(version.grandTotal.amount, version.currency)}
                      </h3>
                    </div>
                    <p className="text-sm text-ink-muted">Expires {date(version.expiresAtUtc)}</p>
                  </div>
                  <dl className="mt-6 grid gap-4 rounded-2xl bg-mist p-5 sm:grid-cols-4">
                    <Total
                      label="Subtotal"
                      value={money(version.subtotal.amount, version.currency)}
                    />
                    <Total label="Tax" value={money(version.taxTotal.amount, version.currency)} />
                    <Total
                      label="Adjustments"
                      value={money(version.adjustmentTotal.amount, version.currency)}
                    />
                    <Total
                      label="Total"
                      value={money(version.grandTotal.amount, version.currency)}
                    />
                  </dl>
                  <ol className="mt-6 grid gap-3">
                    {version.lines.map((line) => (
                      <li className="rounded-xl border border-navy/10 p-4" key={line.id}>
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <p className="font-bold text-navy">{line.title}</p>
                            {line.description ? (
                              <p className="mt-1 text-sm text-ink-muted">{line.description}</p>
                            ) : null}
                          </div>
                          <p className="font-bold text-navy">
                            {String(line.quantity)} ×{" "}
                            {money(line.unitPrice.amount, version.currency)} ={" "}
                            {money(line.lineTotal.amount, version.currency)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-7 grid gap-6 md:grid-cols-3">
                    <List title="Assumptions" values={version.assumptions} />
                    <List title="Inclusions" values={version.inclusions} />
                    <List title="Exclusions" values={version.exclusions} />
                  </div>
                  <section className="mt-7">
                    <h4 className="font-bold text-navy">Terms</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
                      {version.terms}
                    </p>
                  </section>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="mt-8">
          <CustomerQuoteActions quote={quote} />
        </div>
      </article>
    </main>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-widest text-gold-dark uppercase">{label}</dt>
      <dd className="mt-2 font-bold text-navy">{value}</dd>
    </div>
  );
}

function List({ title, values }: { title: string; values: string[] }) {
  return (
    <section>
      <h4 className="font-bold text-navy">{title}</h4>
      {values.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">None stated.</p>
      )}
    </section>
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
