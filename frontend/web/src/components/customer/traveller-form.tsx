"use client";

import type { Traveller } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { saveTraveller } from "@/app/portal/customer/actions";

import { FormStatus } from "./form-status";

export function TravellerForm({ traveller }: { traveller?: Traveller }) {
  const [state, action] = useActionState(saveTraveller, initialCustomerActionState);

  return (
    <form action={action} className="customer-form">
      {traveller ? (
        <>
          <input name="id" type="hidden" value={traveller.id} />
          <input name="concurrencyToken" type="hidden" value={traveller.concurrencyToken} />
        </>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-field">
          <span>Given name</span>
          <input
            autoComplete="given-name"
            defaultValue={traveller?.givenName}
            maxLength={100}
            name="givenName"
            required
          />
        </label>
        <label className="filter-field">
          <span>Family name</span>
          <input
            autoComplete="family-name"
            defaultValue={traveller?.familyName}
            maxLength={100}
            name="familyName"
            required
          />
        </label>
        <label className="filter-field">
          <span>Date of birth</span>
          <input defaultValue={traveller?.dateOfBirth ?? ""} name="dateOfBirth" type="date" />
        </label>
      </div>
      <fieldset className="grid gap-5 rounded-2xl border border-navy/10 p-5">
        <legend className="px-2 font-bold text-navy">Optional sensitive information</legend>
        <p className="text-sm leading-6 text-ink-muted">
          Add only what is needed to support this traveller. Avoid passport numbers and document
          details.
        </p>
        <label className="filter-field">
          <span>Accessibility needs</span>
          <textarea
            defaultValue={traveller?.accessibilityNeeds ?? ""}
            maxLength={1000}
            name="accessibilityNeeds"
            rows={3}
          />
        </label>
        <label className="filter-field">
          <span>Dietary needs</span>
          <textarea
            defaultValue={traveller?.dietaryNeeds ?? ""}
            maxLength={1000}
            name="dietaryNeeds"
            rows={3}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="filter-field">
            <span>Emergency contact name</span>
            <input
              defaultValue={traveller?.emergencyContactName ?? ""}
              maxLength={200}
              name="emergencyContactName"
            />
          </label>
          <label className="filter-field">
            <span>Emergency contact phone</span>
            <input
              defaultValue={traveller?.emergencyContactPhone ?? ""}
              maxLength={40}
              name="emergencyContactPhone"
              type="tel"
            />
          </label>
        </div>
      </fieldset>
      <FormStatus state={state} submitLabel={traveller ? "Update traveller" : "Add traveller"} />
    </form>
  );
}
