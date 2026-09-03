import { notFound } from "next/navigation";

import { CreatePaymentForm } from "@/components/quotes/quote-workflow";
import { getBookingClient } from "@/lib/bookings";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../../page-error";

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const callback = `/portal/customer/bookings/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getBookingClient(authentication.accessToken);
  let booking;
  let payments;
  try {
    booking = await client.getCustomerBooking(id);
    payments = await client.getCustomerPayments(id, { pageNumber: 1, pageSize: 20 });
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!booking) notFound();
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-5xl">
        <p className="eyebrow">{booking.status}</p>
        <h1 className="mt-3 text-5xl text-navy">{booking.itineraryTitle}</h1>
        <p className="mt-4 text-ink-muted">
          Reference {booking.bookingReference} · accepted quote snapshot
        </p>
        <section className="mt-8 rounded-3xl border border-gold/30 bg-[#fff9e9] p-6" role="note">
          <p className="font-bold text-navy">Booking record limitations</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            This record is not an availability, payment, voucher, or supplier confirmation.
          </p>
        </section>
        <section className="mt-8 rounded-3xl bg-white p-7 shadow-soft">
          <h2 className="text-2xl text-navy">Payment instructions</h2>
          {payments.items.length === 0 ? (
            <p className="mt-3 text-ink-muted">No payment instructions have been created.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {payments.items.map((payment) => (
                <li className="rounded-xl bg-mist p-4" key={payment.id}>
                  {payment.status} · {money(payment.amount, payment.currency)} · {payment.gateway}
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mt-6">
          <CreatePaymentForm bookingId={booking.id} />
        </div>
      </article>
    </main>
  );
}

function money(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount));
}
