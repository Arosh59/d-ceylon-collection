import "server-only";

import { createAccessClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getAccessClient(accessToken: string) {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();
  return createAccessClient({
    accessToken,
    baseUrl: apiBaseUrl,
    correlationId,
  });
}
