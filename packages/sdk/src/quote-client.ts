import type {
  AcceptCustomerQuoteV1Responses,
  CreateQuoteRequest,
  DeclineCustomerQuoteV1Responses,
  GetAgentQuoteQueueV1Responses,
  GetAgentQuoteV1Responses,
  GetCustomerQuotesV1Responses,
  GetCustomerQuoteV1Responses,
  PrepareAgentQuoteRequest,
  PrepareAgentQuoteV1Responses,
  RequestCustomerQuoteV1Responses,
  ReviseAgentQuoteV1Responses,
  SendAgentQuoteV1Responses,
  SendQuoteRequest,
  UpdateAgentQuoteDraftRequest,
  UpdateAgentQuoteDraftV1Responses,
  WithdrawAgentQuoteV1Responses,
  WithdrawCustomerQuoteV1Responses,
} from "./generated";

export type CustomerQuote = GetCustomerQuoteV1Responses[200];
export type CustomerQuotePage = GetCustomerQuotesV1Responses[200];
export type AgentQuote = GetAgentQuoteV1Responses[200];
export type AgentQuotePage = GetAgentQuoteQueueV1Responses[200];
export type {
  CreateQuoteRequest,
  PrepareAgentQuoteRequest,
  SendQuoteRequest,
  UpdateAgentQuoteDraftRequest,
};

export interface QuoteClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface QuotePagination {
  pageNumber?: number;
  pageSize?: number;
}

export interface QuoteClient {
  getCustomerQuotes(query?: QuotePagination): Promise<CustomerQuotePage>;
  getCustomerQuote(id: string): Promise<CustomerQuote | null>;
  requestQuote(input: CreateQuoteRequest): Promise<RequestCustomerQuoteV1Responses[201]>;
  acceptCustomerQuote(
    id: string,
    versionId: string,
    concurrencyToken: string,
  ): Promise<AcceptCustomerQuoteV1Responses[200]>;
  declineCustomerQuote(
    id: string,
    versionId: string,
    concurrencyToken: string,
  ): Promise<DeclineCustomerQuoteV1Responses[200]>;
  withdrawCustomerQuote(
    id: string,
    concurrencyToken: string,
  ): Promise<WithdrawCustomerQuoteV1Responses[200]>;
  getAgentQuotes(query?: QuotePagination): Promise<AgentQuotePage>;
  getAgentQuote(id: string): Promise<AgentQuote | null>;
  prepareAgentQuote(
    id: string,
    input: PrepareAgentQuoteRequest,
  ): Promise<PrepareAgentQuoteV1Responses[200]>;
  updateAgentDraft(
    id: string,
    input: UpdateAgentQuoteDraftRequest,
  ): Promise<UpdateAgentQuoteDraftV1Responses[200]>;
  sendAgentQuote(id: string, input: SendQuoteRequest): Promise<SendAgentQuoteV1Responses[200]>;
  reviseAgentQuote(id: string, concurrencyToken: string): Promise<ReviseAgentQuoteV1Responses[200]>;
  withdrawAgentQuote(
    id: string,
    concurrencyToken: string,
  ): Promise<WithdrawAgentQuoteV1Responses[200]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class QuoteApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "QuoteApiError";
  }
}

export function createQuoteClient(options: QuoteClientOptions): QuoteClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function send<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: object,
    allowNotFound = false,
  ): Promise<T | null> {
    const response = await request(new URL(path, baseUrl), {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(options.correlationId ? { "X-Correlation-ID": options.correlationId } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(5_000),
    });
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok) {
      const problem = await readProblem(response);
      throw new QuoteApiError(
        problem?.detail ?? problem?.title ?? `Quote API request failed with ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
        problem?.errors,
      );
    }
    return (await response.json()) as T;
  }

  const pagePath = (path: string, query: QuotePagination = {}) => {
    const url = new URL(path, baseUrl);
    if (query.pageNumber !== undefined)
      url.searchParams.set("pageNumber", String(query.pageNumber));
    if (query.pageSize !== undefined) url.searchParams.set("pageSize", String(query.pageSize));
    return `${url.pathname}${url.search}`;
  };

  return {
    getCustomerQuotes: async (query) =>
      (await send<CustomerQuotePage>("GET", pagePath("/api/v1/customer/quotes", query)))!,
    getCustomerQuote: (id) =>
      send<CustomerQuote>(
        "GET",
        `/api/v1/customer/quotes/${encodeURIComponent(id)}`,
        undefined,
        true,
      ),
    requestQuote: async (input) =>
      (await send<RequestCustomerQuoteV1Responses[201]>("POST", "/api/v1/customer/quotes", input))!,
    acceptCustomerQuote: async (id, versionId, concurrencyToken) =>
      (await send<AcceptCustomerQuoteV1Responses[200]>(
        "POST",
        `/api/v1/customer/quotes/${encodeURIComponent(id)}/accept`,
        { versionId, concurrencyToken },
      ))!,
    declineCustomerQuote: async (id, versionId, concurrencyToken) =>
      (await send<DeclineCustomerQuoteV1Responses[200]>(
        "POST",
        `/api/v1/customer/quotes/${encodeURIComponent(id)}/decline`,
        { versionId, concurrencyToken },
      ))!,
    withdrawCustomerQuote: async (id, concurrencyToken) =>
      (await send<WithdrawCustomerQuoteV1Responses[200]>(
        "POST",
        `/api/v1/customer/quotes/${encodeURIComponent(id)}/withdraw`,
        { concurrencyToken },
      ))!,
    getAgentQuotes: async (query) =>
      (await send<AgentQuotePage>("GET", pagePath("/api/v1/agent/quotes", query)))!,
    getAgentQuote: (id) =>
      send<AgentQuote>("GET", `/api/v1/agent/quotes/${encodeURIComponent(id)}`, undefined, true),
    prepareAgentQuote: async (id, input) =>
      (await send<PrepareAgentQuoteV1Responses[200]>(
        "POST",
        `/api/v1/agent/quotes/${encodeURIComponent(id)}/prepare`,
        input,
      ))!,
    updateAgentDraft: async (id, input) =>
      (await send<UpdateAgentQuoteDraftV1Responses[200]>(
        "PUT",
        `/api/v1/agent/quotes/${encodeURIComponent(id)}/draft`,
        input,
      ))!,
    sendAgentQuote: async (id, input) =>
      (await send<SendAgentQuoteV1Responses[200]>(
        "POST",
        `/api/v1/agent/quotes/${encodeURIComponent(id)}/send`,
        input,
      ))!,
    reviseAgentQuote: async (id, concurrencyToken) =>
      (await send<ReviseAgentQuoteV1Responses[200]>(
        "POST",
        `/api/v1/agent/quotes/${encodeURIComponent(id)}/revise`,
        { concurrencyToken },
      ))!,
    withdrawAgentQuote: async (id, concurrencyToken) =>
      (await send<WithdrawAgentQuoteV1Responses[200]>(
        "POST",
        `/api/v1/agent/quotes/${encodeURIComponent(id)}/withdraw`,
        { concurrencyToken },
      ))!,
  };
}

function normalizeBaseUrl(value: string): URL {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw new TypeError("The API base URL must use HTTP or HTTPS.");
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get("content-type")?.includes("application/problem+json")) return undefined;
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}
