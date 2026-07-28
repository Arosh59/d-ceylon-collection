"use client";

import type { WishlistEntry } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { saveWishlistEntry } from "@/app/portal/customer/actions";

import { FormStatus } from "./form-status";

export function WishlistForm({ entry }: { entry?: WishlistEntry }) {
  const [state, action] = useActionState(saveWishlistEntry, initialCustomerActionState);

  return (
    <form action={action} className="customer-form">
      {entry ? (
        <>
          <input name="id" type="hidden" value={entry.id} />
          <input name="concurrencyToken" type="hidden" value={entry.concurrencyToken} />
        </>
      ) : (
        <label className="filter-field">
          <span>Published experience slug</span>
          <input
            maxLength={200}
            name="productSlug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="tea-country-rail-estate-walk"
            required
          />
        </label>
      )}
      <label className="filter-field">
        <span>Private note</span>
        <textarea defaultValue={entry?.note ?? ""} maxLength={500} name="note" rows={2} />
      </label>
      <FormStatus state={state} submitLabel={entry ? "Update note" : "Add to wishlist"} />
    </form>
  );
}
