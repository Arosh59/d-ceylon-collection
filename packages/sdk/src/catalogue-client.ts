import type {
  GetCategoriesV1Responses,
  GetCollectionBySlugV1Responses,
  GetCollectionsV1Responses,
  GetDestinationBySlugV1Responses,
  GetDestinationsV1Responses,
  GetProductBySlugV1Responses,
  GetProductsV1Responses,
  GetProductTypesV1Responses,
  GetTagsV1Responses,
} from "./generated";

export type CataloguePage = GetProductsV1Responses[200];
export type ProductSummary = CataloguePage["items"][number];
export type ProductDetail = GetProductBySlugV1Responses[200];
export type ProductType = GetProductTypesV1Responses[200]["items"][number];
export type CollectionPage = GetCollectionsV1Responses[200];
export type CollectionSummary = CollectionPage["items"][number];
export type CollectionDetail = GetCollectionBySlugV1Responses[200];
export type DestinationPage = GetDestinationsV1Responses[200];
export type DestinationSummary = DestinationPage["items"][number];
export type DestinationDetail = GetDestinationBySlugV1Responses[200];
export type NamedReference = GetCategoriesV1Responses[200]["items"][number];

export interface CataloguePagination {
  pageNumber?: number | undefined;
  pageSize?: number | undefined;
}

export interface CatalogueSearch extends CataloguePagination {
  query?: string | undefined;
  productType?: string | undefined;
  category?: string | undefined;
  collection?: string | undefined;
  destination?: string | undefined;
  tag?: string | undefined;
  minimumPrice?: number | undefined;
  maximumPrice?: number | undefined;
  minimumDurationMinutes?: number | undefined;
  maximumDurationMinutes?: number | undefined;
  sort?: "name" | "price-asc" | "price-desc" | "duration-asc" | undefined;
}

export interface CatalogueClientOptions {
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface CatalogueClient {
  getCategories(query?: CataloguePagination): Promise<GetCategoriesV1Responses[200]>;
  getCollection(slug: string): Promise<CollectionDetail>;
  getCollections(query?: CataloguePagination): Promise<CollectionPage>;
  getDestination(slug: string): Promise<DestinationDetail>;
  getDestinations(query?: CataloguePagination): Promise<DestinationPage>;
  getProduct(slug: string): Promise<ProductDetail>;
  getProducts(query?: CatalogueSearch): Promise<CataloguePage>;
  getProductTypes(query?: CataloguePagination): Promise<GetProductTypesV1Responses[200]>;
  getTags(query?: CataloguePagination): Promise<GetTagsV1Responses[200]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  status?: number;
  title?: string;
  type?: string;
}

type QueryValue = number | string | undefined;

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

  async function get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    const url = new URL(path, baseUrl);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== "") {
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

  const pagination = (query: CataloguePagination): Record<string, QueryValue> => ({
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  });

  return {
    getCategories: (query = {}) =>
      get<GetCategoriesV1Responses[200]>("/api/v1/catalogue/categories", pagination(query)),
    getCollection: (slug) =>
      get<CollectionDetail>(`/api/v1/catalogue/collections/${encodeURIComponent(slug)}`),
    getCollections: (query = {}) =>
      get<CollectionPage>("/api/v1/catalogue/collections", pagination(query)),
    getDestination: (slug) =>
      get<DestinationDetail>(`/api/v1/catalogue/destinations/${encodeURIComponent(slug)}`),
    getDestinations: (query = {}) =>
      get<DestinationPage>("/api/v1/catalogue/destinations", pagination(query)),
    getProduct: (slug) =>
      get<ProductDetail>(`/api/v1/catalogue/products/${encodeURIComponent(slug)}`),
    getProducts: (query = {}) =>
      get<CataloguePage>("/api/v1/catalogue/products", {
        query: query.query,
        productType: query.productType,
        category: query.category,
        collection: query.collection,
        destination: query.destination,
        tag: query.tag,
        minimumPrice: query.minimumPrice,
        maximumPrice: query.maximumPrice,
        minimumDurationMinutes: query.minimumDurationMinutes,
        maximumDurationMinutes: query.maximumDurationMinutes,
        sort: query.sort,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }),
    getProductTypes: (query = {}) =>
      get<GetProductTypesV1Responses[200]>("/api/v1/catalogue/product-types", pagination(query)),
    getTags: (query = {}) =>
      get<GetTagsV1Responses[200]>("/api/v1/catalogue/tags", pagination(query)),
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
