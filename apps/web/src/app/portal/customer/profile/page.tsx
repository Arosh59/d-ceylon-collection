import type { Metadata } from "next";

import { ProfileForm } from "@/components/customer/profile-form";
import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../page-error";
import { deleteProfile } from "../actions";

export const metadata: Metadata = { title: "Customer profile" };

export default async function CustomerProfilePage() {
  const authentication = await requirePortalAuthentication("customer", "/portal/customer/profile");
  const client = await getCustomerClient(authentication.accessToken);
  let profile;
  try {
    profile = await client.getProfile();
  } catch (error) {
    handleCustomerPageError(error, "/portal/customer/profile");
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <section className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Customer-owned record</p>
        <h1 className="mt-3 text-4xl text-navy">Your profile</h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
          Share only the contact details and preferences needed to support future travel
          conversations.
        </p>
        <div className="mt-8">
          <ProfileForm profile={profile} />
        </div>
        {profile ? (
          <div className="mt-10 border-t border-navy/10 pt-8">
            <h2 className="text-2xl text-navy">Remove profile</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              This removes this profile record only. Traveller, wishlist, and saved-itinerary
              records remain separately customer-owned.
            </p>
            <form action={deleteProfile} className="mt-5">
              <input name="concurrencyToken" type="hidden" value={profile.concurrencyToken} />
              <button className="text-sm font-bold text-red-800 underline" type="submit">
                Remove profile
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </main>
  );
}
