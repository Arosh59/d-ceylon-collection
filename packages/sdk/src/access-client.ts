import type {
  GetAgentPortalV1Responses,
  GetCurrentAccessV1Responses,
  GetCustomerPortalV1Responses,
} from "./generated";

export type CurrentAccess = GetCurrentAccessV1Responses[200];
export type PortalAccess = GetCustomerPortalV1Responses[200] | GetAgentPortalV1Responses[200];

export interface AccessClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface AccessClient {
  getAgentPortal(organisationId: string): Promise<PortalAccess>;
  getCurrent(): Promise<CurrentAccess>;
  getCustomerPortal(customerId: string): Promise<PortalAccess>;
}

export function createAccessClient(options: AccessClientOptions): AccessClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function get<T>(path: string): Promise<T> {
    const response = await request(new URL(path, baseUrl), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.accessToken}`,
        ...(options.correlationId ? { "X-Correlation-ID": options.correlationId } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new AccessRequestError(
        response.status,
        response.headers.get("X-Correlation-ID") ?? undefined,
      );
    }

    return (await response.json()) as T;
  }

  return {
    getCurrent: () => get<CurrentAccess>("/api/v1/access/me"),
    getCustomerPortal: (customerId) =>
      get<PortalAccess>(`/api/v1/access/customer/${encodeURIComponent(customerId)}`),
    getAgentPortal: (organisationId) =>
      get<PortalAccess>(`/api/v1/access/agent/${encodeURIComponent(organisationId)}`),
  };
}

export class AccessRequestError extends Error {
  public constructor(
    public readonly status: number,
    public readonly correlationId?: string,
  ) {
    super(`Protected API request failed with status ${status}.`);
    this.name = "AccessRequestError";
  }
}

function normalizeBaseUrl(value: string): URL {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TypeError("The API base URL must use HTTP or HTTPS.");
  }

  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}
