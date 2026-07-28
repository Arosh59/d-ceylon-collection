import { notFound } from "next/navigation";

import { TravelPlanForm } from "@/components/customer/travel-plan-form";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";
import { getTravelPlanningClient } from "@/lib/travel-planning";

import { handleCustomerPageError } from "../../../page-error";

export default async function EditTravelPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const callback = `/portal/customer/travel-plans/${encodeURIComponent(id)}/edit`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const [client, customerClient] = await Promise.all([
    getTravelPlanningClient(authentication.accessToken),
    getCustomerClient(authentication.accessToken),
  ]);
  let plan;
  let travellers;
  let itineraries;
  try {
    [plan, travellers, itineraries] = await Promise.all([
      client.getPlan(id),
      customerClient.getTravellers({ pageNumber: 1, pageSize: 100 }),
      customerClient.getSavedItineraries({ pageNumber: 1, pageSize: 100 }),
    ]);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!plan) notFound();
  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-5xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Review planner input</p>
        <h1 className="mt-3 text-5xl text-navy">{plan.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          Saving input does not silently regenerate the draft. Return to the plan and explicitly
          generate a new preserved revision.
        </p>
        <div className="mt-9">
          <TravelPlanForm
            plan={plan}
            savedItineraries={itineraries.items}
            travellers={travellers.items}
          />
        </div>
      </section>
    </main>
  );
}
