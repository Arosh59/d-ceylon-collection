import "server-only";

import { readWebEnvironment } from "./environment-value";

export function getWebEnvironment() {
  return readWebEnvironment(process.env);
}
