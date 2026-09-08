import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { accessCookieName, type SessionIdentity } from "./bff-auth";

export interface PortalAuthentication {
  accessToken: string;
  customerId?: string | undefined;
  displayName: string;
  organisationId?: string | undefined;
  roles: string[];
  subject: string;
}

export async function getPortalAuthentication(): Promise<PortalAuthentication | null> {
  const accessToken = (await cookies()).get(accessCookieName())?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(new URL("/api/v1/auth/me", apiBaseUrl()), {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const identity = (await response.json()) as SessionIdentity;
    return {
      accessToken,
      subject: identity.subject,
      displayName: identity.displayName,
      roles: identity.roles,
      ...(identity.customerId ? { customerId: identity.customerId } : {}),
      ...(identity.organisationId ? { organisationId: identity.organisationId } : {}),
    };
  } catch {
    return null;
  }
}

export async function requirePortalAuthentication(
  role: "agent" | "customer" | "staff",
  callbackUrl: string,
): Promise<PortalAuthentication> {
  const authentication = await getPortalAuthentication();
  if (!authentication) redirect(`/api/auth/session?returnTo=${encodeURIComponent(callbackUrl)}`);
  if (!authentication.roles.includes(role)) redirect("/auth/forbidden");
  if (
    (role === "customer" && !authentication.customerId) ||
    (role === "agent" && !authentication.organisationId)
  ) {
    redirect("/auth/forbidden");
  }
  return authentication;
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
