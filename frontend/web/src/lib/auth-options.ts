import type { NextAuthOptions, Profile, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getAuthenticationEnvironment } from "./auth-environment";
import { getWebEnvironment } from "./environment";
import { safeRedirectTarget } from "./safe-redirect";

interface ProviderProfile extends Profile {
  customer_id?: string;
  organisation_id?: string;
  preferred_username?: string;
  roles?: string[] | string;
}

interface TestingTokenResponse {
  accessToken: string;
  expiresAtUtc: string;
  identity: {
    customerId?: string | null;
    displayName: string;
    email: string;
    organisationId?: string | null;
    roles: string[];
    subject: string;
  };
}

const authEnvironment = getAuthenticationEnvironment();

const providers: NextAuthOptions["providers"] = [
  {
    id: "dceylon",
    name: "D Ceylon identity",
    type: "oauth",
    wellKnown: `${authEnvironment.issuer}/.well-known/openid-configuration`,
    issuer: authEnvironment.issuer,
    clientId: authEnvironment.clientId,
    clientSecret: authEnvironment.clientSecret,
    authorization: {
      params: {
        scope: authEnvironment.scope,
      },
    },
    idToken: true,
    checks: ["pkce", "state", "nonce"],
    profile(profile: ProviderProfile) {
      if (!profile.sub) {
        throw new Error("The identity provider profile omitted the required sub claim.");
      }

      return {
        id: profile.sub,
        name:
          (typeof profile.name === "string" ? profile.name : undefined) ??
          profile.preferred_username ??
          profile.sub,
        roles: readStringArray(profile.roles),
        ...(profile.email ? { email: profile.email } : {}),
        ...(profile.customer_id ? { customerId: profile.customer_id } : {}),
        ...(profile.organisation_id ? { organisationId: profile.organisation_id } : {}),
      };
    },
  },
];

if (authEnvironment.applicationEnvironment === "Testing") {
  providers.push(
    CredentialsProvider({
      id: "testing",
      name: "Testing identity",
      credentials: {
        persona: { label: "Persona", type: "text" },
        testKey: { label: "Test key", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.persona ||
          !credentials.testKey ||
          credentials.testKey !== authEnvironment.testEndpointKey
        ) {
          return null;
        }

        const { apiBaseUrl } = getWebEnvironment();
        const response = await fetch(new URL("/api/v1/access/testing/token", apiBaseUrl), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Test-Authentication-Key": credentials.testKey,
          },
          body: JSON.stringify({ persona: credentials.persona }),
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          return null;
        }

        const token = (await response.json()) as TestingTokenResponse;
        return {
          id: token.identity.subject,
          name: token.identity.displayName,
          email: token.identity.email,
          accessToken: token.accessToken,
          accessTokenExpiresAt: Math.floor(new Date(token.expiresAtUtc).getTime() / 1_000),
          roles: token.identity.roles,
          customerId: token.identity.customerId ?? undefined,
          organisationId: token.identity.organisationId ?? undefined,
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: authEnvironment.sessionSecret,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      const source = (profile ?? user) as (ProviderProfile & User) | undefined;
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.accessTokenExpiresAt = account.expires_at;
      } else if (user?.accessToken) {
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
      }

      if (source) {
        token.roles = readStringArray(source.roles);
        token.customerId = source.customer_id ?? source.customerId;
        token.organisationId = source.organisation_id ?? source.organisationId;
      }

      return token;
    },
    async session({ session, token }) {
      session.identity = {
        subject: token.sub ?? "",
        roles: token.roles ?? [],
        customerId: token.customerId,
        organisationId: token.organisationId,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return new URL(safeRedirectTarget(url), baseUrl).toString();
      }

      try {
        const candidate = new URL(url);
        return candidate.origin === baseUrl ? candidate.toString() : baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },
  cookies: {
    sessionToken: {
      name:
        authEnvironment.applicationEnvironment === "Production"
          ? "__Secure-dceylon.session-token"
          : "dceylon.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: authEnvironment.applicationEnvironment === "Production",
      },
    },
  },
};

export const authenticationEnvironment = authEnvironment.applicationEnvironment;

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" ? [value] : [];
}
