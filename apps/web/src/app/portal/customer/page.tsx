import { AccessRequestError } from "@dceylon/sdk";
import { redirect } from "next/navigation";

import { getAccessClient } from "@/lib/access";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function CustomerPortalPage() {
  const authentication = await requirePortalAuthentication("customer", "/portal/customer");
  const client = await getAccessClient(authentication.accessToken);
  let displayName: string;

  try {
    const [current, portal] = await Promise.all([
      client.getCurrent(),
      client.getCustomerPortal(authentication.customerId!),
    ]);
    displayName = current.displayName;
    void portal;
  } catch (error) {
    handleAccessError(error);
    throw error;
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-16" id="main-content">
      <section className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-8 shadow-soft sm:p-12">
        <p className="eyebrow">Protected foundation</p>
        <h1 className="mt-3 text-5xl text-navy">Welcome, {displayName}</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">
          Your customer access is verified. Profile, traveller, wishlist, and itinerary features
          begin in Phase 6 and are intentionally not available yet.
        </p>
      </section>
    </main>
  );
}

function handleAccessError(error: unknown): void {
  if (error instanceof AccessRequestError && error.status === 401) {
    redirect("/auth/sign-in?callbackUrl=%2Fportal%2Fcustomer");
  }
  if (error instanceof AccessRequestError && error.status === 403) {
    redirect("/auth/forbidden");
  }
}
