import type {
  GetProductBySlugV1Responses,
  GetProductsV1Data,
  GetProductsV1Responses,
  GetProductTypesV1Responses,
} from "./generated";

export type CataloguePage = GetProductsV1Responses[200];
export type ProductSummary = CataloguePage["items"][number];
export type ProductDetail = GetProductBySlugV1Responses[200];
export type ProductType = GetProductTypesV1Responses[200]["items"][number];

type ApiPaginationQuery = NonNullable<GetProductsV1Data["query"]>;

export interface CataloguePagination {
  pageNumber?: Extract<ApiPaginationQuery["PageNumber"], number>;
  pageSize?: Extract<ApiPaginationQuery["PageSize"], number>;
}

export interface CatalogueClientOptions {
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface CatalogueClient {
  getProduct(slug: string): Promise<ProductDetail>;
  getProducts(query?: CataloguePagination): Promise<CataloguePage>;
  getProductTypes(query?: CataloguePagination): Promise<GetProductTypesV1Responses[200]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  status?: number;
  title?: string;
  type?: string;
}

export class ApiRequestError extends Error {
  public readonly correlationId: string | undefined;
  public readonly status: number;

  public constructor(message: string, status: number, correlationId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.correlationId = correlationId;
  }
}

export function createCatalogueClient(options: CatalogueClientOptions): CatalogueClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function get<T>(path: string, query?: Record<string, number | undefined>): Promise<T> {
    const url = new URL(path, baseUrl);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await request(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.correlationId ? { "X-Correlation-ID": options.correlationId } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      const problem = await readProblemDetails(response);
      throw new ApiRequestError(
        problem?.detail ?? problem?.title ?? `API request failed with status ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
      );
    }

    return (await response.json()) as T;
  }

  return {
    getProduct: (slug) =>
      get<ProductDetail>(`/api/v1/catalogue/products/${encodeURIComponent(slug)}`),
    getProducts: (query = {}) =>
      get<CataloguePage>("/api/v1/catalogue/products", {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }),
    getProductTypes: (query = {}) =>
      get<GetProductTypesV1Responses[200]>("/api/v1/catalogue/product-types", {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }),
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

async function readProblemDetails(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get("content-type")?.includes("application/problem+json")) {
    return undefined;
  }

  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}
