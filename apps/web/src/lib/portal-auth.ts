import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";

import { getAuthenticationEnvironment } from "./auth-environment";
import { authOptions } from "./auth-options";

export interface PortalAuthentication {
  accessToken: string;
  customerId?: string | undefined;
  displayName: string;
  organisationId?: string | undefined;
  roles: string[];
  subject: string;
}

export async function getPortalAuthentication(): Promise<PortalAuthentication | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const environment = getAuthenticationEnvironment();
  const cookieName =
    environment.applicationEnvironment === "Production"
      ? "__Secure-dceylon.session-token"
      : "dceylon.session-token";
  const cookieStore = await cookies();
  const encodedToken = cookieStore.get(cookieName)?.value;
  if (!encodedToken) {
    return null;
  }

  const token = await decode({
    token: encodedToken,
    secret: environment.sessionSecret,
  });
  const now = Math.floor(Date.now() / 1_000);
  if (
    !token?.accessToken ||
    !token.sub ||
    !token.accessTokenExpiresAt ||
    token.accessTokenExpiresAt <= now
  ) {
    return null;
  }

  return {
    accessToken: token.accessToken,
    subject: token.sub,
    displayName: session.user?.name ?? "Authenticated user",
    roles: token.roles ?? [],
    customerId: token.customerId,
    organisationId: token.organisationId,
  };
}

export async function requirePortalAuthentication(
  role: "agent" | "customer",
  callbackUrl: string,
): Promise<PortalAuthentication> {
  const authentication = await getPortalAuthentication();
  if (!authentication) {
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!authentication.roles.includes(role)) {
    redirect("/auth/forbidden");
  }

  if (
    (role === "customer" && !authentication.customerId) ||
    (role === "agent" && !authentication.organisationId)
  ) {
    redirect("/auth/forbidden");
  }

  return authentication;
}
