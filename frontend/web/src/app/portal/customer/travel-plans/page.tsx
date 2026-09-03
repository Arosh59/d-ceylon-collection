import type { Metadata } from "next";
import Link from "next/link";

import { PaginationNav } from "@/components/pagination-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getTravelPlanningClient } from "@/lib/travel-planning";

import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "Travel planner" };

export default async function TravelPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = pageValue((await searchParams).page);
  const callback = "/portal/customer/travel-plans";
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getTravelPlanningClient(authentication.accessToken);
  let page;
  try {
    page = await client.getPlans({ pageNumber, pageSize: 12 });
  } catch (error) {
    handleCustomerPageError(error, callback);
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Deterministic planning</p>
            <h1 className="mt-3 text-5xl text-navy">Travel planner</h1>
            <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
              Build reviewable itinerary drafts from dates, destinations, travellers, pace, and
              catalogue preferences. Results are repeatable for the same rule version.
            </p>
          </div>
          <Link className="button-primary" href="/portal/customer/travel-plans/new">
            Plan a journey
          </Link>
        </div>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              actionHref="/portal/customer/travel-plans/new"
              actionLabel="Plan a journey"
              description="Add validated planning inputs to generate your first deterministic draft."
              title="No travel plans yet."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((plan) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={plan.id}
                >
                  <p className="eyebrow">Draft revision {String(plan.currentRevisionNumber)}</p>
                  <h2 className="mt-3 text-3xl text-navy">{plan.title}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {plan.travelStartDate} to {plan.travelEndDate} · {plan.pace}
                  </p>
                  <Link
                    className="mt-6 inline-block text-sm font-bold text-navy underline decoration-gold"
                    href={`/portal/customer/travel-plans/${plan.id}`}
                  >
                    Review and edit draft
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <PaginationNav
            ariaLabel="Travel plan pagination"
            basePath="/portal/customer/travel-plans"
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
