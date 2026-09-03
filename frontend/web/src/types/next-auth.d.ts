import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    identity: {
      customerId?: string | undefined;
      organisationId?: string | undefined;
      roles: string[];
      subject: string;
    };
    user: DefaultSession["user"];
  }

  interface User {
    accessToken?: string | undefined;
    accessTokenExpiresAt?: number | undefined;
    customerId?: string | undefined;
    organisationId?: string | undefined;
    roles?: string[] | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string | undefined;
    accessTokenExpiresAt?: number | undefined;
    customerId?: string | undefined;
    organisationId?: string | undefined;
    roles?: string[] | undefined;
  }
}
