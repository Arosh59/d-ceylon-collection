import type { Request } from "express";

export interface AuthenticatedUser {
  subject: string;
  displayName: string;
  email?: string;
  roles: string[];
  permissions: string[];
  customerId?: string;
  organisationId?: string;
  claims: Record<string, unknown>;
}

export interface AuthenticatedRequest extends Request {
  correlationId: string;
  user?: AuthenticatedUser;
}
