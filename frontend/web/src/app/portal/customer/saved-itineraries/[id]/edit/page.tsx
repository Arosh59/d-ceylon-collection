import { notFound } from "next/navigation";

import { ItineraryForm } from "@/components/customer/itinerary-form";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../../../page-error";

export default async function EditSavedItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const callback = `/portal/customer/saved-itineraries/${encodeURIComponent(id)}/edit`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getCustomerClient(authentication.accessToken);
  let itinerary;
  try {
    itinerary = await client.getSavedItinerary(id);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!itinerary) {
    notFound();
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Edit planning metadata</p>
        <h1 className="mt-3 text-4xl text-navy">Edit saved itinerary</h1>
        <div className="mt-8">
          <ItineraryForm itinerary={itinerary} />
        </div>
      </section>
    </main>
  );
}
