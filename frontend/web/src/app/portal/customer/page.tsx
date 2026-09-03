import Link from "next/link";

import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "./page-error";

export default async function CustomerPortalPage() {
  const authentication = await requirePortalAuthentication("customer", "/portal/customer");
  const client = await getCustomerClient(authentication.accessToken);
  let summary: {
    itineraries: number | string;
    profile: boolean;
    travellers: number | string;
    wishlist: number | string;
  };

  try {
    const [profile, travellers, wishlist, itineraries] = await Promise.all([
      client.getProfile(),
      client.getTravellers({ pageSize: 1 }),
      client.getWishlist({ pageSize: 1 }),
      client.getSavedItineraries({ pageSize: 1 }),
    ]);
    summary = {
      profile: profile !== null,
      travellers: travellers.pagination.totalItems,
      wishlist: wishlist.pagination.totalItems,
      itineraries: itineraries.pagination.totalItems,
    };
  } catch (error) {
    handleCustomerPageError(error, "/portal/customer");
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-16" id="main-content">
      <section className="mx-auto max-w-5xl">
        <p className="eyebrow">Your private travel space</p>
        <h1 className="mt-3 text-5xl text-navy">Welcome, {authentication.displayName}</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">
          Keep the people and ideas for a future journey organised. Only your authenticated customer
          account can access these records.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <DashboardCard
            detail={summary.profile ? "Profile created" : "Profile needs your details"}
            href="/portal/customer/profile"
            title="Profile"
          />
          <DashboardCard
            detail={`${summary.travellers} saved`}
            href="/portal/customer/travellers"
            title="Travellers"
          />
          <DashboardCard
            detail={`${summary.wishlist} saved`}
            href="/portal/customer/wishlist"
            title="Wishlist"
          />
          <DashboardCard
            detail={`${summary.itineraries} saved`}
            href="/portal/customer/saved-itineraries"
            title="Itinerary foundations"
          />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({ detail, href, title }: { detail: string; href: string; title: string }) {
  return (
    <Link
      className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft transition-transform hover:-translate-y-1"
      href={href}
    >
      <h2 className="text-3xl text-navy">{title}</h2>
      <p className="mt-3 text-sm text-ink-muted">{detail}</p>
    </Link>
  );
}
