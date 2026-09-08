export interface AuthenticationIdentity {
  subject: string;
  displayName: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  customerId: string | null;
  organisationId: string | null;
}

export interface AuthenticationTokens {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  identity: AuthenticationIdentity;
}

export interface AuthenticationContext {
  correlationId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}
