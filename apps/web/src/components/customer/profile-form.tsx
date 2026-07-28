"use client";

import type { CustomerProfile } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { saveProfile } from "@/app/portal/customer/actions";

import { FormStatus } from "./form-status";

export function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const [state, action] = useActionState(saveProfile, initialCustomerActionState);

  return (
    <form action={action} className="customer-form">
      {profile ? (
        <input name="concurrencyToken" type="hidden" value={profile.concurrencyToken} />
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-field">
          <span>Given name</span>
          <input
            autoComplete="given-name"
            defaultValue={profile?.givenName}
            maxLength={100}
            name="givenName"
            required
          />
        </label>
        <label className="filter-field">
          <span>Family name</span>
          <input
            autoComplete="family-name"
            defaultValue={profile?.familyName}
            maxLength={100}
            name="familyName"
            required
          />
        </label>
        <label className="filter-field">
          <span>Contact email</span>
          <input
            autoComplete="email"
            defaultValue={profile?.contactEmail ?? ""}
            maxLength={320}
            name="contactEmail"
            type="email"
          />
        </label>
        <label className="filter-field">
          <span>Contact phone</span>
          <input
            autoComplete="tel"
            defaultValue={profile?.contactPhone ?? ""}
            maxLength={40}
            name="contactPhone"
            type="tel"
          />
        </label>
        <label className="filter-field">
          <span>Country code</span>
          <input
            autoComplete="country"
            defaultValue={profile?.countryCode ?? "LK"}
            maxLength={2}
            name="countryCode"
            pattern="[A-Za-z]{2}"
          />
        </label>
        <label className="filter-field">
          <span>Preferred locale</span>
          <input
            defaultValue={profile?.preferredLocale ?? "en-LK"}
            maxLength={20}
            name="preferredLocale"
            required
          />
        </label>
        <label className="filter-field">
          <span>Preferred contact method</span>
          <select
            defaultValue={profile?.preferredContactMethod ?? "email"}
            name="preferredContactMethod"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          className="mt-1 size-4"
          defaultChecked={profile?.marketingConsent}
          name="marketingConsent"
          type="checkbox"
        />
        <span>
          I agree to receive optional travel inspiration. This preference can be changed at any
          time.
        </span>
      </label>
      <FormStatus state={state} submitLabel={profile ? "Update profile" : "Create profile"} />
    </form>
  );
}
