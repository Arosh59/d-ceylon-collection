import type { ReactNode } from "react";

import { PortalBar } from "@/components/auth/portal-bar";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function OperationsPortalLayout({ children }: { children: ReactNode }) {
  const authentication = await requirePortalAuthentication("staff", "/portal/operations");
  return (
    <>
      <PortalBar displayName={authentication.displayName} portalName="Operations portal" />
      {children}
    </>
  );
}
