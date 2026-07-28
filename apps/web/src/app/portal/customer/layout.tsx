import type { ReactNode } from "react";

import { PortalBar } from "@/components/auth/portal-bar";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function CustomerPortalLayout({ children }: { children: ReactNode }) {
  const authentication = await requirePortalAuthentication("customer", "/portal/customer");

  return (
    <>
      <PortalBar displayName={authentication.displayName} portalName="Customer portal" />
      {children}
    </>
  );
}
