import type { Metadata } from "next";
import Link from "next/link";

import { PaginationNav } from "@/components/pagination-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { deleteTraveller } from "../actions";
import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "Travellers" };

export default async function TravellersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = customerPageNumber((await searchParams).page);
  const authentication = await requirePortalAuthentication(
    "customer",
    "/portal/customer/travellers",
  );
  const client = await getCustomerClient(authentication.accessToken);
  let page;
  try {
    page = await client.getTravellers({ pageNumber, pageSize: 12 });
  } catch (error) {
    handleCustomerPageError(error, "/portal/customer/travellers");
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Customer-owned records</p>
            <h1 className="mt-3 text-5xl text-navy">Travellers</h1>
            <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
              Store the minimum information needed for people you may plan for.
            </p>
          </div>
          <Link className="button-primary" href="/portal/customer/travellers/new">
            Add traveller
          </Link>
        </div>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              actionHref="/portal/customer/travellers/new"
              actionLabel="Add a traveller"
              description="Add a traveller when you are ready. Sensitive details remain optional."
              title="No travellers saved yet."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((traveller) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={traveller.id}
                >
                  <h2 className="text-3xl text-navy">
                    {traveller.givenName} {traveller.familyName}
                  </h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {traveller.dateOfBirth ? `Born ${traveller.dateOfBirth}` : "Birth date not set"}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                      className="text-sm font-bold text-navy underline decoration-gold"
                      href={`/portal/customer/travellers/${traveller.id}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="text-sm font-bold text-navy underline decoration-gold"
                      href={`/portal/customer/travellers/${traveller.id}/edit`}
                    >
                      Edit
                    </Link>
                    <form action={deleteTraveller}>
                      <input name="id" type="hidden" value={traveller.id} />
                      <input
                        name="concurrencyToken"
                        type="hidden"
                        value={traveller.concurrencyToken}
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
            ariaLabel="Traveller pagination"
            basePath="/portal/customer/travellers"
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
