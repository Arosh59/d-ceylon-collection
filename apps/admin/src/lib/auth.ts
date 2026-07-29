import type { NextAuthOptions, Profile } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface ProviderProfile extends Profile {
  roles?: string[] | string;
}

const issuer = required("AUTH_ISSUER");
const clientId = required("AUTH_CLIENT_ID");
const clientSecret = required("AUTH_CLIENT_SECRET");
const secret = required("AUTH_SECRET");

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "dceylon",
      name: "D Ceylon identity",
      type: "oauth",
      issuer,
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId,
      clientSecret,
      authorization: { params: { scope: "openid profile email dceylon.api" } },
      idToken: true,
      checks: ["pkce", "state", "nonce"],
      profile(profile: ProviderProfile) {
        if (!profile.sub) throw new Error("The identity provider profile omitted sub.");
        return {
          id: profile.sub,
          name: typeof profile.name === "string" ? profile.name : profile.sub,
          roles: readRoles(profile.roles),
        };
      },
    },
  ],
  secret,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/auth/sign-in", error: "/auth/sign-in" },
  callbacks: {
    async jwt({ token, profile, user }) {
      const source = (profile ?? user) as ProviderProfile | undefined;
      if (source) token.roles = readRoles(source.roles);
      return token;
    },
    async session({ session, token }) {
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.APP_ENVIRONMENT === "Production"
          ? "__Secure-dceylon-admin.session-token"
          : "dceylon-admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.APP_ENVIRONMENT === "Production",
      },
    },
  },
};

export async function requireAdministrator() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/sign-in");
  if (!session.user.roles?.includes("administrator")) redirect("/auth/forbidden");
  return session;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
function readRoles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : typeof value === "string"
      ? [value]
      : [];
}
