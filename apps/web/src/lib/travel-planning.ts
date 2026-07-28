import "server-only";

import { createTravelPlanningClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getTravelPlanningClient(accessToken: string) {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();
  return createTravelPlanningClient({
    accessToken,
    baseUrl: apiBaseUrl,
    correlationId,
  });
}
