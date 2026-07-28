import type { ReactNode } from "react";

import { PortalBar } from "@/components/auth/portal-bar";
import { CustomerPortalNav } from "@/components/customer/customer-portal-nav";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function CustomerPortalLayout({ children }: { children: ReactNode }) {
  const authentication = await requirePortalAuthentication("customer", "/portal/customer");

  return (
    <>
      <PortalBar displayName={authentication.displayName} portalName="Customer portal" />
      <CustomerPortalNav />
      {children}
    </>
  );
}
