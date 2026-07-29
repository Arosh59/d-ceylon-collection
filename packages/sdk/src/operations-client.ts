import type {
  GetBookingOperationTasksV1Responses,
  GetOperationSuppliersV1Responses,
  OperationTaskResponse,
  SupplierResponse,
} from "./generated";

export type OperationSupplier = SupplierResponse;
export type BookingOperationTask = OperationTaskResponse;
export type OperationSupplierPage = GetOperationSuppliersV1Responses[200];
export type BookingOperationTaskPage = GetBookingOperationTasksV1Responses[200];

export interface OperationsClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface OperationsPagination {
  pageNumber?: number;
  pageSize?: number;
}

export interface OperationsClient {
  getSuppliers(query?: OperationsPagination): Promise<OperationSupplierPage>;
  getTasks(query?: OperationsPagination): Promise<BookingOperationTaskPage>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class OperationsApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "OperationsApiError";
  }
}

export function createOperationsClient(options: OperationsClientOptions): OperationsClient {
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
      const problem = await readProblem(response);
      throw new OperationsApiError(
        problem?.detail ??
          problem?.title ??
          `Operations API request failed with ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
        problem?.errors,
      );
    }
    return (await response.json()) as T;
  }

  const pagePath = (path: string, query: OperationsPagination = {}) => {
    const url = new URL(path, baseUrl);
    if (query.pageNumber !== undefined)
      url.searchParams.set("pageNumber", String(query.pageNumber));
    if (query.pageSize !== undefined) url.searchParams.set("pageSize", String(query.pageSize));
    return `${url.pathname}${url.search}`;
  };

  return {
    getSuppliers: (query) =>
      get<OperationSupplierPage>(pagePath("/api/v1/operations/suppliers", query)),
    getTasks: (query) => get<BookingOperationTaskPage>(pagePath("/api/v1/operations/tasks", query)),
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
  if (!response.headers.get("content-type")?.includes("application/problem+json")) {
    return undefined;
  }
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}
