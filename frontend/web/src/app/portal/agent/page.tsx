import { AccessRequestError } from "@dceylon/sdk";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccessClient } from "@/lib/access";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function AgentPortalPage() {
  const authentication = await requirePortalAuthentication("agent", "/portal/agent");
  const client = await getAccessClient(authentication.accessToken);
  let displayName: string;

  try {
    const [current, portal] = await Promise.all([
      client.getCurrent(),
      client.getAgentPortal(authentication.organisationId!),
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
          Your agent organisation boundary is verified. Prepare versioned itemized quotes while
          bookings, payments, and administration remain intentionally unavailable.
        </p>
        <Link className="button-primary mt-7 inline-block" href="/portal/agent/quotes">
          Open organisation quote queue
        </Link>
      </section>
    </main>
  );
}

function handleAccessError(error: unknown): void {
  if (error instanceof AccessRequestError && error.status === 401) {
    redirect("/auth/sign-in?callbackUrl=%2Fportal%2Fagent");
  }
  if (error instanceof AccessRequestError && error.status === 403) {
    redirect("/auth/forbidden");
  }
}
