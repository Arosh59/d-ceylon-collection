import type { NextAuthOptions, Profile } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";

interface ProviderProfile extends Profile {
  roles?: string[] | string;
}

export const localAuthEnabled =
  process.env.APP_ENVIRONMENT?.trim().toLowerCase() === "development" &&
  process.env.AUTH_MODE?.trim().toLowerCase() === "local";
const issuer = localAuthEnabled ? "http://127.0.0.1" : required("AUTH_ISSUER");
const clientId = localAuthEnabled ? "local-admin" : required("AUTH_CLIENT_ID");
const clientSecret = localAuthEnabled ? "local-admin" : required("AUTH_CLIENT_SECRET");
const secret = required("AUTH_SECRET");

export const authOptions: NextAuthOptions = {
  providers: localAuthEnabled
    ? [
        CredentialsProvider({
          id: "local",
          name: "Local administrator credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const email = typeof credentials?.email === "string" ? credentials.email.trim() : "";
            const password = typeof credentials?.password === "string" ? credentials.password : "";
            if (
              !email ||
              !password ||
              email.toLowerCase() !== required("LOCAL_ADMIN_EMAIL").toLowerCase() ||
              password !== required("LOCAL_ADMIN_PASSWORD")
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
