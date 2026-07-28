import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DayEditor,
  ItemEditor,
  NewItemForm,
  RegenerateDraft,
} from "@/components/customer/itinerary-builder";
import { QuoteRequestForm } from "@/components/quotes/quote-workflow";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getTravelPlanningClient } from "@/lib/travel-planning";

import { handleCustomerPageError } from "../../page-error";

export default async function TravelPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ regenerated?: string }>;
}) {
  const { id } = await params;
  const regenerated = (await searchParams).regenerated === "1";
  const callback = `/portal/customer/travel-plans/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getTravelPlanningClient(authentication.accessToken);
  let plan;
  try {
    plan = await client.getPlan(id);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!plan) notFound();

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-gold/40 bg-[#fff9e9] p-6" role="note">
          <p className="font-bold text-navy">Draft planning result only</p>
          <p className="mt-2 text-sm leading-6 text-ink">
            This itinerary does not confirm live availability, final pricing, a quote, bookability,
            or a booking. Review every item before relying on it.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Revision {String(plan.currentRevision.revisionNumber)}</p>
            <h1 className="mt-3 text-5xl text-navy">{plan.title}</h1>
            <p className="mt-4 text-ink-muted">
              {plan.travelStartDate} to {plan.travelEndDate} · {plan.pace} pace
            </p>
          </div>
          <Link className="button-secondary" href={`${callback}/edit`}>
            Review planner input
          </Link>
        </div>
        <dl className="mt-8 grid gap-5 rounded-2xl bg-white p-6 sm:grid-cols-3">
          <Detail label="Rule version" value={plan.currentRevision.ruleVersion} />
          <Detail
            label="Input fingerprint"
            value={plan.currentRevision.inputFingerprint.slice(0, 16)}
          />
          <Detail label="Status" value="Draft · not bookable" />
        </dl>
        <div className="mt-8">
          {regenerated ? (
            <div
              className="mb-5 rounded-xl border border-emerald-700/30 bg-emerald-50 p-4 text-sm text-emerald-900"
              role="status"
            >
              A new deterministic draft revision was generated.
            </div>
          ) : null}
          <RegenerateDraft plan={plan} />
        </div>
        <div className="mt-8">
          <QuoteRequestForm plan={plan} />
        </div>
        <ol className="mt-10 grid gap-7">
          {plan.currentRevision.days.map((day) => (
            <li
              className="rounded-3xl border border-navy/10 bg-white p-6 shadow-soft sm:p-8"
              key={day.id}
            >
              <p className="eyebrow">{day.date}</p>
              <div className="mt-4">
                <DayEditor day={day} planId={plan.id} />
              </div>
              {day.items.length === 0 ? (
                <p className="mt-6 rounded-xl bg-mist p-4 text-sm text-ink-muted">
                  No published catalogue item matched this day. Add a custom draft item or review
                  the planner preferences.
                </p>
              ) : (
                <ol className="mt-6 grid gap-4">
                  {day.items.map((item) => (
                    <li className="rounded-2xl border border-navy/10 p-5" key={item.id}>
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold tracking-widest text-gold-dark uppercase">
                            Position {String(item.position)} · {item.source}
                          </p>
                          <h2 className="mt-2 text-2xl text-navy">{item.title}</h2>
                          <p className="mt-2 text-sm text-ink-muted">
                            {item.destinationSlug}
                            {item.durationMinutes
                              ? ` · ${String(item.durationMinutes)} minutes`
                              : ""}
                          </p>
                        </div>
                        {item.productSlug ? (
                          <Link
                            className="text-sm font-bold text-navy underline"
                            href={`/catalogue/${item.productSlug}`}
                          >
                            View catalogue reference
                          </Link>
                        ) : null}
                      </div>
                      <ItemEditor days={plan.currentRevision.days} item={item} planId={plan.id} />
                    </li>
                  ))}
                </ol>
              )}
              <NewItemForm
                dayId={day.id}
                destinationSlug={plan.input.destinationSlugs[0] ?? "ella"}
                planId={plan.id}
              />
            </li>
          ))}
        </ol>
      </article>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-widest text-gold-dark uppercase">{label}</dt>
      <dd className="mt-2 break-all text-sm text-ink">{value}</dd>
    </div>
  );
}
