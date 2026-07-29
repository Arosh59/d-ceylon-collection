import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { getBookingClient } from "@/lib/bookings";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleAgentQuoteError } from "../page-error";

export const metadata: Metadata = { title: "Agent bookings" };

export default async function AgentBookingsPage() {
  const callback = "/portal/agent/bookings";
  const authentication = await requirePortalAuthentication("agent", callback);
  let page;
  try {
    page = await (
      await getBookingClient(authentication.accessToken)
    ).getAgentBookings({
      pageNumber: 1,
      pageSize: 20,
    });
  } catch (error) {
    handleAgentQuoteError(error, callback);
  }
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Organisation-scoped records</p>
        <h1 className="mt-3 text-5xl text-navy">Booking queue</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          View only booking records derived from accepted immutable quotes owned by your
          organisation. This Phase 9 foundation does not include supplier operations or
          administrative controls.
        </p>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              description="No organisation-owned booking records are available."
              title="The booking queue is empty."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {page.items.map((booking) => (
                <li
                  className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                  key={booking.id}
                >
                  <p className="eyebrow">{booking.status}</p>
                  <h2 className="mt-3 text-3xl text-navy">{booking.itineraryTitle}</h2>
                  <p className="mt-3 text-sm text-ink-muted">
                    {booking.travelStartDate} to {booking.travelEndDate}
                  </p>
                  <Link
                    className="mt-6 inline-block text-sm font-bold text-navy underline decoration-gold"
                    href={`/portal/agent/bookings/${booking.id}`}
                  >
                    Review booking
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
