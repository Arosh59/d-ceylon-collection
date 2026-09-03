import "server-only";

import { createOperationsClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getOperationsClient(accessToken: string) {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();
  return createOperationsClient({ accessToken, baseUrl: apiBaseUrl, correlationId });
}
