import { ItineraryForm } from "@/components/customer/itinerary-form";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function NewSavedItineraryPage() {
  await requirePortalAuthentication("customer", "/portal/customer/saved-itineraries/new");
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">New planning record</p>
        <h1 className="mt-3 text-4xl text-navy">Save an itinerary foundation</h1>
        <div className="mt-8">
          <ItineraryForm />
        </div>
      </section>
    </main>
  );
}
