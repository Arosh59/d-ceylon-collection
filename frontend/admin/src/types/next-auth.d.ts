import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { roles?: string[] };
  }
  interface User {
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
  }
}
