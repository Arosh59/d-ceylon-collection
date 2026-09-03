import "server-only";

import { createBookingClient } from "@dceylon/sdk";
import { headers } from "next/headers";

import { resolveCorrelationId } from "./correlation-id";
import { getWebEnvironment } from "./environment";

export async function getBookingClient(accessToken: string) {
  const requestHeaders = await headers();
  const correlationId = resolveCorrelationId(requestHeaders.get("x-correlation-id"));
  const { apiBaseUrl } = getWebEnvironment();
  return createBookingClient({ accessToken, baseUrl: apiBaseUrl, correlationId });
}
