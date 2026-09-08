import type { NextAuthOptions, Profile } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";

import {
  getAdminAuthenticationConfigurationError,
  getAdminAuthenticationEnvironment,
  isProductionAdminEnvironment,
} from "./auth-environment";

interface ProviderProfile extends Profile {
  roles?: string[] | string;
}

export function getAuthOptions(): NextAuthOptions {
  const environment = getAdminAuthenticationEnvironment();

  return {
    providers:
      environment.authenticationMode === "local"
        ? [
            CredentialsProvider({
              id: "local",
              name: "Local administrator credentials",
              credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
              },
              async authorize(credentials) {
                const email =
                  typeof credentials?.email === "string" ? credentials.email.trim() : "";
                const password =
                  typeof credentials?.password === "string" ? credentials.password : "";
                if (
                  !email ||
                  !password ||
                  email.toLowerCase() !== environment.localAdminEmail.toLowerCase() ||
                  password !== environment.localAdminPassword
                ) {
                  return null;
                }

                return {
                  id: "local-administrator",
                  name: "Administrator",
                  email,
                  roles: ["administrator"],
                };
              },
            }),
          ]
        : [
            {
              id: "dceylon",
              name: "D Ceylon identity",
              type: "oauth",
              issuer: environment.issuer,
              wellKnown: `${environment.issuer}/.well-known/openid-configuration`,
              clientId: environment.clientId,
              clientSecret: environment.clientSecret,
              authorization: { params: { scope: "openid profile email dceylon.api" } },
              idToken: true,
              checks: ["pkce", "state", "nonce"],
              profile(profile: ProviderProfile) {
                if (!profile.sub) {
                  throw new Error("The identity provider profile omitted the required sub claim.");
                }
                return {
                  id: profile.sub,
                  name: typeof profile.name === "string" ? profile.name : profile.sub,
                  email: typeof profile.email === "string" ? profile.email : undefined,
                  roles: readRoles(profile.roles),
                };
              },
            },
          ],
    secret: environment.sessionSecret,
    session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
    pages: { signIn: "/auth/sign-in", error: "/auth/sign-in" },
    callbacks: {
      async jwt({ token, account, profile, user }) {
        const source = (profile ?? user) as ProviderProfile | undefined;
        if (source) token.roles = readRoles(source.roles);
        if (account?.access_token) token.accessToken = account.access_token;
        return token;
      },
      async session({ session, token }) {
        session.user.roles = token.roles ?? [];
        if (token.accessToken) session.accessToken = token.accessToken;
        return session;
      },
    },
    cookies: {
      sessionToken: {
        name:
          environment.applicationEnvironment === "Production"
            ? "__Secure-dceylon-admin.session-token"
            : "dceylon-admin.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: environment.applicationEnvironment === "Production",
        },
      },
    },
  };
}

export async function requireAdministrator() {
  const configurationError = getAdminAuthenticationConfigurationError();
  if (configurationError) {
    if (isProductionAdminEnvironment()) throw new Error(configurationError);
    redirect("/auth/configuration");
  }

  const session = await getServerSession(getAuthOptions());
  if (!session) redirect("/auth/sign-in");
  if (!session.user.roles?.includes("administrator")) redirect("/auth/forbidden");
  return session;
}

function readRoles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : typeof value === "string"
      ? [value]
      : [];
}
