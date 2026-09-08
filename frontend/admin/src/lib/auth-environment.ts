import "server-only";

import { readAdminAuthenticationEnvironment } from "./auth-environment-value";

export function getAdminAuthenticationEnvironment() {
  return readAdminAuthenticationEnvironment(process.env);
}

export function getAdminAuthenticationConfigurationError(): string | undefined {
  try {
    getAdminAuthenticationEnvironment();
    return undefined;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Administrator authentication configuration is unavailable.";
  }
}

export function isProductionAdminEnvironment(): boolean {
  return process.env.APP_ENVIRONMENT?.trim().toLowerCase() === "production";
}
