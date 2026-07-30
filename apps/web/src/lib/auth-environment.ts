import "server-only";

import { readAuthenticationEnvironment } from "./auth-environment-value";

export function getAuthenticationEnvironment() {
  return readAuthenticationEnvironment(process.env);
}

export function getAuthenticationConfigurationError(): string | undefined {
  try {
    getAuthenticationEnvironment();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : "Authentication configuration is unavailable.";
  }
}
