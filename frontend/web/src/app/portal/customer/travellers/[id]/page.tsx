import Link from "next/link";
import { notFound } from "next/navigation";

import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import { handleCustomerPageError } from "../../page-error";

export default async function TravellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const callback = `/portal/customer/travellers/${encodeURIComponent(id)}`;
  const authentication = await requirePortalAuthentication("customer", callback);
  const client = await getCustomerClient(authentication.accessToken);
  let traveller;
  try {
    traveller = await client.getTraveller(id);
  } catch (error) {
    handleCustomerPageError(error, callback);
  }
  if (!traveller) {
    notFound();
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-12" id="main-content">
      <article className="mx-auto max-w-4xl rounded-3xl border border-navy/10 bg-white p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Traveller record</p>
        <h1 className="mt-3 text-5xl text-navy">
          {traveller.givenName} {traveller.familyName}
        </h1>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <Detail label="Date of birth" value={traveller.dateOfBirth} />
          <Detail label="Dietary needs" value={traveller.dietaryNeeds} />
          <Detail label="Accessibility needs" value={traveller.accessibilityNeeds} />
          <Detail
            label="Emergency contact"
            value={
              traveller.emergencyContactName && traveller.emergencyContactPhone
                ? `${traveller.emergencyContactName} — ${traveller.emergencyContactPhone}`
                : null
            }
          />
        </dl>
        <Link className="button-primary mt-10" href={`${callback}/edit`}>
          Edit traveller
        </Link>
      </article>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-widest text-gold-dark uppercase">{label}</dt>
      <dd className="mt-2 leading-7 text-ink">{value || "Not provided"}</dd>
    </div>
  );
}
