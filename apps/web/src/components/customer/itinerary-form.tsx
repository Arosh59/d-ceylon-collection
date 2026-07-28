"use client";

import type { SavedItinerary } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { saveItinerary } from "@/app/portal/customer/actions";

import { FormStatus } from "./form-status";

export function ItineraryForm({ itinerary }: { itinerary?: SavedItinerary }) {
  const [state, action] = useActionState(saveItinerary, initialCustomerActionState);

  return (
    <form action={action} className="customer-form">
      {itinerary ? (
        <>
          <input name="id" type="hidden" value={itinerary.id} />
          <input name="concurrencyToken" type="hidden" value={itinerary.concurrencyToken} />
        </>
      ) : null}
      <label className="filter-field">
        <span>Title</span>
        <input defaultValue={itinerary?.title} maxLength={200} name="title" required />
      </label>
      <label className="filter-field">
        <span>Planning note</span>
        <textarea
          defaultValue={itinerary?.summary ?? ""}
          maxLength={2000}
          name="summary"
          rows={4}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-field">
          <span>Travel start</span>
          <input
            defaultValue={itinerary?.travelStartDate ?? ""}
            name="travelStartDate"
            type="date"
          />
        </label>
        <label className="filter-field">
          <span>Travel end</span>
          <input defaultValue={itinerary?.travelEndDate ?? ""} name="travelEndDate" type="date" />
        </label>
      </div>
      <label className="filter-field">
        <span>Primary destination slug</span>
        <input
          defaultValue={itinerary?.primaryDestinationSlug ?? ""}
          maxLength={200}
          name="primaryDestinationSlug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="ella"
        />
      </label>
      <p className="text-sm leading-6 text-ink-muted">
        This saves planning metadata only. The deterministic travel planner begins in Phase 7.
      </p>
      <FormStatus
        state={state}
        submitLabel={itinerary ? "Update saved itinerary" : "Save itinerary"}
      />
    </form>
  );
}
