"use client";

import type { SavedItinerary, TravelPlan, TravellerPage } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { saveTravelPlan } from "@/app/portal/customer/planner-actions";

import { FormStatus } from "./form-status";

export function TravelPlanForm({
  plan,
  travellers,
  savedItineraries,
}: {
  plan?: TravelPlan;
  travellers: TravellerPage["items"];
  savedItineraries: SavedItinerary[];
}) {
  const [state, action] = useActionState(saveTravelPlan, initialCustomerActionState);
  const input = plan?.input;
  return (
    <form action={action} className="customer-form">
      {plan ? (
        <>
          <input name="id" type="hidden" value={plan.id} />
          <input name="concurrencyToken" type="hidden" value={plan.concurrencyToken} />
        </>
      ) : null}
      <label className="filter-field">
        <span>Plan title</span>
        <input defaultValue={plan?.title} maxLength={200} name="title" required />
      </label>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="filter-field">
          <span>Travel start</span>
          <input defaultValue={plan?.travelStartDate} name="travelStartDate" required type="date" />
        </label>
        <label className="filter-field">
          <span>Travel end</span>
          <input defaultValue={plan?.travelEndDate} name="travelEndDate" required type="date" />
        </label>
        <label className="filter-field">
          <span>Pace</span>
          <select defaultValue={plan?.pace ?? "balanced"} name="pace" required>
            <option value="relaxed">Relaxed · one item per day</option>
            <option value="balanced">Balanced · two items per day</option>
            <option value="active">Active · three items per day</option>
          </select>
        </label>
      </div>
      <label className="filter-field">
        <span>Destinations (comma separated slugs)</span>
        <input
          defaultValue={input?.destinationSlugs.join(", ") ?? "ella"}
          name="destinationSlugs"
          pattern="[a-z0-9-]+(?:\\s*,\\s*[a-z0-9-]+)*"
          required
        />
      </label>
      <fieldset className="rounded-2xl border border-navy/10 p-5">
        <legend className="px-2 text-sm font-bold text-navy">Associated travellers</legend>
        {travellers.length === 0 ? (
          <p className="text-sm text-ink-muted">No traveller profiles are available.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {travellers.map((traveller) => (
              <label className="flex items-center gap-3" key={traveller.id}>
                <input
                  defaultChecked={input?.travellerIds.includes(traveller.id)}
                  name="travellerIds"
                  type="checkbox"
                  value={traveller.id}
                />
                <span>
                  {traveller.givenName} {traveller.familyName}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <label className="filter-field">
        <span>Link to saved itinerary (optional)</span>
        <select defaultValue={plan?.savedItineraryId ?? ""} name="savedItineraryId">
          <option value="">No saved itinerary link</option>
          {savedItineraries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <Preference name="interests" title="Interests" value={input?.interests} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Preference name="productTypeSlugs" title="Product types" value={input?.productTypeSlugs} />
        <Preference name="categorySlugs" title="Categories" value={input?.categorySlugs} />
        <Preference name="tagSlugs" title="Tags" value={input?.tagSlugs} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-field">
          <span>Accessibility considerations</span>
          <textarea
            defaultValue={input?.accessibilityConsiderations ?? ""}
            maxLength={1000}
            name="accessibilityConsiderations"
            rows={4}
          />
        </label>
        <label className="filter-field">
          <span>Dietary considerations</span>
          <textarea
            defaultValue={input?.dietaryConsiderations ?? ""}
            maxLength={1000}
            name="dietaryConsiderations"
            rows={4}
          />
        </label>
      </div>
      <p className="rounded-xl bg-gold/15 p-4 text-sm leading-6 text-ink">
        These notes are minimised planning inputs. Do not enter medical records, passport details,
        or emergency-contact data here.
      </p>
      <FormStatus
        state={state}
        submitLabel={plan ? "Save input for review" : "Generate deterministic draft"}
      />
    </form>
  );
}

function Preference({
  name,
  title,
  value = [],
}: {
  name: string;
  title: string;
  value: string[] | undefined;
}) {
  return (
    <label className="filter-field">
      <span>{title} (comma separated slugs)</span>
      <input defaultValue={value.join(", ")} name={name} />
    </label>
  );
}
