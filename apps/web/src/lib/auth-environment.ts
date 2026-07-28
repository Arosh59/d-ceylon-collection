import "server-only";

import { readAuthenticationEnvironment } from "./auth-environment-value";

export function getAuthenticationEnvironment() {
  return readAuthenticationEnvironment(process.env);
}
