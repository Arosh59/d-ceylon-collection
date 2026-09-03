import "server-only";

import { createCatalogueClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getCatalogueClient() {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();

  return createCatalogueClient({
    baseUrl: apiBaseUrl,
    correlationId,
  });
}
