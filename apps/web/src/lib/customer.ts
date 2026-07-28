import "server-only";

import { createCustomerClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getCustomerClient(accessToken: string) {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();
  return createCustomerClient({
    accessToken,
    baseUrl: apiBaseUrl,
    correlationId,
  });
}
