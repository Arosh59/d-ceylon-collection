import type {
  CreateCustomerItineraryItemV1Responses,
  CreateCustomerTravelPlanV1Responses,
  CreateItineraryItemRequest,
  CreateTravelPlanRequest,
  GenerateCustomerTravelPlanV1Responses,
  GetCustomerTravelPlanV1Responses,
  GetCustomerTravelPlansV1Responses,
  ReorderCustomerItineraryItemV1Responses,
  ReorderItineraryItemRequest,
  UpdateCustomerItineraryDayV1Responses,
  UpdateCustomerItineraryItemV1Responses,
  UpdateCustomerTravelPlanInputV1Responses,
  UpdateItineraryDayRequest,
  UpdateItineraryItemRequest,
  UpdateTravelPlanInputRequest,
} from "./generated";

export type TravelPlan = GetCustomerTravelPlanV1Responses[200];
export type TravelPlanPage = GetCustomerTravelPlansV1Responses[200];
export type {
  CreateItineraryItemRequest,
  CreateTravelPlanRequest,
  ReorderItineraryItemRequest,
  UpdateItineraryDayRequest,
  UpdateItineraryItemRequest,
  UpdateTravelPlanInputRequest,
};

export interface TravelPlanningClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface TravelPlanningClient {
  getPlans(query?: { pageNumber?: number; pageSize?: number }): Promise<TravelPlanPage>;
  getPlan(id: string): Promise<TravelPlan | null>;
  createPlan(input: CreateTravelPlanRequest): Promise<CreateCustomerTravelPlanV1Responses[201]>;
  updateInput(
    id: string,
    input: UpdateTravelPlanInputRequest,
  ): Promise<UpdateCustomerTravelPlanInputV1Responses[200]>;
  generate(
    id: string,
    concurrencyToken: string,
  ): Promise<GenerateCustomerTravelPlanV1Responses[200]>;
  updateDay(
    id: string,
    dayId: string,
    input: UpdateItineraryDayRequest,
  ): Promise<UpdateCustomerItineraryDayV1Responses[200]>;
  createItem(
    id: string,
    dayId: string,
    input: CreateItineraryItemRequest,
  ): Promise<CreateCustomerItineraryItemV1Responses[201]>;
  updateItem(
    id: string,
    itemId: string,
    input: UpdateItineraryItemRequest,
  ): Promise<UpdateCustomerItineraryItemV1Responses[200]>;
  reorderItem(
    id: string,
    itemId: string,
    input: ReorderItineraryItemRequest,
  ): Promise<ReorderCustomerItineraryItemV1Responses[200]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class TravelPlanningApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "TravelPlanningApiError";
  }
}

export function createTravelPlanningClient(
  options: TravelPlanningClientOptions,
): TravelPlanningClient {
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
      throw new TravelPlanningApiError(
        problem?.detail ??
          problem?.title ??
          `Travel planning API request failed with status ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
        problem?.errors,
      );
    }
    return (await response.json()) as T;
  }

  return {
    getPlans: async (query = {}) => {
      const url = new URL("/api/v1/customer/travel-plans", baseUrl);
      if (query.pageNumber !== undefined)
        url.searchParams.set("pageNumber", String(query.pageNumber));
      if (query.pageSize !== undefined) url.searchParams.set("pageSize", String(query.pageSize));
      return (await send<TravelPlanPage>("GET", `${url.pathname}${url.search}`))!;
    },
    getPlan: (id) =>
      send<TravelPlan>(
        "GET",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}`,
        undefined,
        true,
      ),
    createPlan: async (input) =>
      (await send<CreateCustomerTravelPlanV1Responses[201]>(
        "POST",
        "/api/v1/customer/travel-plans",
        input,
      ))!,
    updateInput: async (id, input) =>
      (await send<UpdateCustomerTravelPlanInputV1Responses[200]>(
        "PUT",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/input`,
        input,
      ))!,
    generate: async (id, concurrencyToken) =>
      (await send<GenerateCustomerTravelPlanV1Responses[200]>(
        "POST",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/generate`,
        { concurrencyToken },
      ))!,
    updateDay: async (id, dayId, input) =>
      (await send<UpdateCustomerItineraryDayV1Responses[200]>(
        "PUT",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/days/${encodeURIComponent(dayId)}`,
        input,
      ))!,
    createItem: async (id, dayId, input) =>
      (await send<CreateCustomerItineraryItemV1Responses[201]>(
        "POST",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/days/${encodeURIComponent(dayId)}/items`,
        input,
      ))!,
    updateItem: async (id, itemId, input) =>
      (await send<UpdateCustomerItineraryItemV1Responses[200]>(
        "PUT",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
        input,
      ))!,
    reorderItem: async (id, itemId, input) =>
      (await send<ReorderCustomerItineraryItemV1Responses[200]>(
        "POST",
        `/api/v1/customer/travel-plans/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/reorder`,
        input,
      ))!,
  };
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

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get("content-type")?.includes("application/problem+json")) return undefined;
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}
