import type { Metadata } from "next";
import Link from "next/link";

import { WishlistForm } from "@/components/customer/wishlist-form";
import { PaginationNav } from "@/components/pagination-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { deleteWishlistEntry } from "../actions";
import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageNumber = customerPageNumber((await searchParams).page);
  const authentication = await requirePortalAuthentication("customer", "/portal/customer/wishlist");
  const client = await getCustomerClient(authentication.accessToken);
  let page;
  try {
    page = await client.getWishlist({ pageNumber, pageSize: 12 });
  } catch (error) {
    handleCustomerPageError(error, "/portal/customer/wishlist");
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Private discovery shortlist</p>
        <h1 className="mt-3 text-5xl text-navy">Wishlist</h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
          Save published catalogue ideas by slug. This is a shortlist foundation, not a quote or
          booking.
        </p>
        <div className="mt-8 rounded-3xl border border-navy/10 bg-white p-7 shadow-soft">
          <h2 className="text-3xl text-navy">Add an experience</h2>
          <div className="mt-6">
            <WishlistForm />
          </div>
        </div>
        <section aria-labelledby="saved-wishlist" className="mt-12">
          <h2 className="text-3xl text-navy" id="saved-wishlist">
            Saved ideas
          </h2>
          <div className="mt-6">
            {page.items.length === 0 ? (
              <EmptyState
                actionHref="/catalogue"
                actionLabel="Browse the catalogue"
                description="Browse published experiences, then add a product slug above when an idea feels right."
                title="Your wishlist is empty."
              />
            ) : (
              <ul className="grid gap-5">
                {page.items.map((entry) => (
                  <li
                    className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                    key={entry.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl text-navy">{entry.productSlug}</h3>
                        <Link
                          className="mt-2 inline-block text-sm font-bold text-navy underline decoration-gold"
                          href={`/catalogue/${entry.productSlug}`}
                        >
                          View catalogue detail
                        </Link>
                      </div>
                      <form action={deleteWishlistEntry}>
                        <input name="id" type="hidden" value={entry.id} />
                        <input
                          name="concurrencyToken"
                          type="hidden"
                          value={entry.concurrencyToken}
                        />
                        <button className="text-sm font-bold text-red-800 underline" type="submit">
                          Remove
                        </button>
                      </form>
                    </div>
                    <details className="mt-5 rounded-2xl border border-navy/10 p-5">
                      <summary className="cursor-pointer font-bold text-navy">
                        Edit private note
                      </summary>
                      <div className="mt-5">
                        <WishlistForm entry={entry} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <PaginationNav
              ariaLabel="Wishlist pagination"
              basePath="/portal/customer/wishlist"
              pagination={page.pagination}
              query={{}}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function customerPageNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 10_000 ? parsed : 1;
}
