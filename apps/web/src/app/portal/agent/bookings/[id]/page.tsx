import { notFound } from "next/navigation";

import { getBookingClient } from "@/lib/bookings";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleAgentQuoteError } from "../../page-error";

export default async function AgentBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const callback = `/portal/agent/bookings/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("agent", callback);
  let booking;
  try {
    booking = await (await getBookingClient(authentication.accessToken)).getAgentBooking(id);
  } catch (error) {
    handleAgentQuoteError(error, callback);
  }
  if (!booking) notFound();
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-5xl">
        <p className="eyebrow">{booking.status}</p>
        <h1 className="mt-3 text-5xl text-navy">{booking.itineraryTitle}</h1>
        <p className="mt-4 text-ink-muted">
          Reference {booking.bookingReference} · organisation-scoped immutable quote snapshot
        </p>
        <section className="mt-8 rounded-3xl border border-gold/30 bg-[#fff9e9] p-6" role="note">
          <p className="font-bold text-navy">Phase 9 boundary</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            This view provides no supplier operations, availability claims, payment capture, or
            administration actions.
          </p>
        </section>
        <section className="mt-8 rounded-3xl bg-white p-7 shadow-soft">
          <h2 className="text-2xl text-navy">Invoice foundation</h2>
          {booking.invoices.length === 0 ? (
            <p className="mt-3 text-ink-muted">No invoice records.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {booking.invoices.map((invoice) => (
                <li className="rounded-xl bg-mist p-4" key={invoice.id}>
                  {invoice.invoiceNumber} · {invoice.status} · {invoice.grandTotal}{" "}
                  {invoice.currency}
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  );
}
