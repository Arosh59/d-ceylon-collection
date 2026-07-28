import { TravelPlanForm } from "@/components/customer/travel-plan-form";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../../page-error";

export default async function NewTravelPlanPage() {
  const callback = "/portal/customer/travel-plans/new";
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getCustomerClient(authentication.accessToken);
  let travellers;
  let itineraries;
  try {
    [travellers, itineraries] = await Promise.all([
      client.getTravellers({ pageNumber: 1, pageSize: 100 }),
      client.getSavedItineraries({ pageNumber: 1, pageSize: 100 }),
    ]);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Planner input</p>
        <h1 className="mt-3 text-5xl text-navy">Plan a journey</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          The planner applies fixed, inspectable rules. It does not use generative AI or live
          optimisation services.
        </p>
        <div className="mt-9">
          <TravelPlanForm savedItineraries={itineraries.items} travellers={travellers.items} />
        </div>
      </section>
    </main>
  );
}
