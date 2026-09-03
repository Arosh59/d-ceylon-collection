import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getBookingClient } from "@/lib/bookings";

import { handleCustomerPageError } from "../page-error";

export const metadata: Metadata = { title: "My bookings" };

export default async function CustomerBookingsPage() {
  const callback = "/portal/customer/bookings";
  const authentication = await requirePortalAuthentication("customer", callback);
  let page;
  try {
    page = await (
      await getBookingClient(authentication.accessToken)
    ).getCustomerBookings({
      pageNumber: 1,
      pageSize: 20,
    });
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Accepted quote records</p>
        <h1 className="mt-3 text-5xl text-navy">My bookings</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          Bookings retain an immutable accepted-quote snapshot. They do not claim availability,
          payment receipt, or supplier confirmation.
        </p>
        <div className="mt-10">
          {page.items.length === 0 ? (
            <EmptyState
              actionHref="/portal/customer/quotes"
              actionLabel="Review quotes"
              description="Create a booking record only after accepting an immutable sent quote version."
              title="No booking records yet."
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
                  <p className="mt-4 font-bold text-navy">
                    {money(booking.totalAmount, booking.currency)}
                  </p>
                  <Link
                    className="mt-6 inline-block text-sm font-bold text-navy underline decoration-gold"
                    href={`/portal/customer/bookings/${booking.id}`}
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

function money(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount));
}
