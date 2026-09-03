import type { ReactNode } from "react";

import { PortalBar } from "@/components/auth/portal-bar";
import { AgentPortalNav } from "@/components/quotes/agent-portal-nav";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function AgentPortalLayout({ children }: { children: ReactNode }) {
  const authentication = await requirePortalAuthentication("agent", "/portal/agent");

  return (
    <>
      <PortalBar displayName={authentication.displayName} portalName="Agent portal" />
      <AgentPortalNav />
      {children}
    </>
  );
}
