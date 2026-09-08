import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminAccessCookieName, type AdminIdentity } from "./bff-auth";

export interface AdministratorSession {
  accessToken: string;
  user: {
    name: string;
    email: string | null;
    roles: string[];
  };
}

export async function requireAdministrator(returnTo = "/"): Promise<AdministratorSession> {
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const accessToken = (await cookies()).get(adminAccessCookieName())?.value;
  if (!accessToken) redirect(`/api/auth/session?returnTo=${encodeURIComponent(safeReturnTo)}`);

  let response: Response;
  try {
    response = await fetch(new URL("/api/v1/auth/me", apiBaseUrl()), {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new Error("The authentication service is unavailable.");
  }
  if (response.status === 401) {
    redirect(`/api/auth/session?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }
  if (!response.ok) throw new Error("The administrator identity could not be loaded.");
  const identity = (await response.json()) as AdminIdentity;
  if (!identity.roles.includes("administrator")) redirect("/auth/forbidden");
  return {
    accessToken,
    user: { name: identity.displayName, email: identity.email, roles: identity.roles },
  };
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
