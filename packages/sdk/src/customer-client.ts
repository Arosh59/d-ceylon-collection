import type {
  CreateCustomerProfileRequest,
  CreateCustomerProfileV1Responses,
  CreateCustomerSavedItineraryV1Responses,
  CreateCustomerTravellerV1Responses,
  CreateCustomerWishlistEntryV1Responses,
  CreateSavedItineraryRequest,
  CreateTravellerRequest,
  CreateWishlistEntryRequest,
  GetCustomerProfileV1Responses,
  GetCustomerSavedItinerariesV1Responses,
  GetCustomerSavedItineraryV1Responses,
  GetCustomerTravellersV1Responses,
  GetCustomerTravellerV1Responses,
  GetCustomerWishlistV1Responses,
  UpdateCustomerProfileRequest,
  UpdateCustomerProfileV1Responses,
  UpdateCustomerSavedItineraryV1Responses,
  UpdateCustomerTravellerV1Responses,
  UpdateCustomerWishlistEntryV1Responses,
  UpdateSavedItineraryRequest,
  UpdateTravellerRequest,
  UpdateWishlistEntryRequest,
} from "./generated";

export type CustomerProfile = GetCustomerProfileV1Responses[200];
export type Traveller = GetCustomerTravellerV1Responses[200];
export type TravellerPage = GetCustomerTravellersV1Responses[200];
export type WishlistEntry = GetCustomerWishlistV1Responses[200]["items"][number];
export type WishlistPage = GetCustomerWishlistV1Responses[200];
export type SavedItinerary = GetCustomerSavedItineraryV1Responses[200];
export type SavedItineraryPage = GetCustomerSavedItinerariesV1Responses[200];

export type {
  CreateCustomerProfileRequest,
  CreateSavedItineraryRequest,
  CreateTravellerRequest,
  CreateWishlistEntryRequest,
  UpdateCustomerProfileRequest,
  UpdateSavedItineraryRequest,
  UpdateTravellerRequest,
  UpdateWishlistEntryRequest,
};

export interface CustomerClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface CustomerPagination {
  pageNumber?: number;
  pageSize?: number;
}

export interface CustomerClient {
  createProfile(
    input: CreateCustomerProfileRequest,
  ): Promise<CreateCustomerProfileV1Responses[201]>;
  createSavedItinerary(
    input: CreateSavedItineraryRequest,
  ): Promise<CreateCustomerSavedItineraryV1Responses[201]>;
  createTraveller(input: CreateTravellerRequest): Promise<CreateCustomerTravellerV1Responses[201]>;
  createWishlistEntry(
    input: CreateWishlistEntryRequest,
  ): Promise<CreateCustomerWishlistEntryV1Responses[201]>;
  deleteSavedItinerary(id: string, concurrencyToken: string): Promise<void>;
  deleteProfile(concurrencyToken: string): Promise<void>;
  deleteTraveller(id: string, concurrencyToken: string): Promise<void>;
  deleteWishlistEntry(id: string, concurrencyToken: string): Promise<void>;
  getProfile(): Promise<CustomerProfile | null>;
  getSavedItineraries(query?: CustomerPagination): Promise<SavedItineraryPage>;
  getSavedItinerary(id: string): Promise<SavedItinerary | null>;
  getTravellers(query?: CustomerPagination): Promise<TravellerPage>;
  getTraveller(id: string): Promise<Traveller | null>;
  getWishlist(query?: CustomerPagination): Promise<WishlistPage>;
  updateProfile(
    input: UpdateCustomerProfileRequest,
  ): Promise<UpdateCustomerProfileV1Responses[200]>;
  updateSavedItinerary(
    id: string,
    input: UpdateSavedItineraryRequest,
  ): Promise<UpdateCustomerSavedItineraryV1Responses[200]>;
  updateTraveller(
    id: string,
    input: UpdateTravellerRequest,
  ): Promise<UpdateCustomerTravellerV1Responses[200]>;
  updateWishlistEntry(
    id: string,
    input: UpdateWishlistEntryRequest,
  ): Promise<UpdateCustomerWishlistEntryV1Responses[200]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class CustomerApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "CustomerApiError";
  }
}

export function createCustomerClient(options: CustomerClientOptions): CustomerClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function send<T>(
    method: "DELETE" | "GET" | "POST" | "PUT",
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

    if (allowNotFound && response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const problem = await readProblemDetails(response);
      throw new CustomerApiError(
        problem?.detail ??
          problem?.title ??
          `Customer API request failed with status ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
        problem?.errors,
      );
    }
    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  }

  const pagePath = (path: string, query: CustomerPagination = {}) => {
    const url = new URL(path, baseUrl);
    if (query.pageNumber !== undefined) {
      url.searchParams.set("pageNumber", String(query.pageNumber));
    }
    if (query.pageSize !== undefined) {
      url.searchParams.set("pageSize", String(query.pageSize));
    }
    return `${url.pathname}${url.search}`;
  };

  return {
    getProfile: () => send<CustomerProfile>("GET", "/api/v1/customer/profile", undefined, true),
    createProfile: async (input) =>
      (await send<CreateCustomerProfileV1Responses[201]>(
        "POST",
        "/api/v1/customer/profile",
        input,
      ))!,
    updateProfile: async (input) =>
      (await send<UpdateCustomerProfileV1Responses[200]>(
        "PUT",
        "/api/v1/customer/profile",
        input,
      ))!,
    deleteProfile: async (concurrencyToken) => {
      await send(
        "DELETE",
        `/api/v1/customer/profile?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
      );
    },
    getTravellers: async (query) =>
      (await send<TravellerPage>("GET", pagePath("/api/v1/customer/travellers", query)))!,
    getTraveller: (id) =>
      send<Traveller>(
        "GET",
        `/api/v1/customer/travellers/${encodeURIComponent(id)}`,
        undefined,
        true,
      ),
    createTraveller: async (input) =>
      (await send<CreateCustomerTravellerV1Responses[201]>(
        "POST",
        "/api/v1/customer/travellers",
        input,
      ))!,
    updateTraveller: async (id, input) =>
      (await send<UpdateCustomerTravellerV1Responses[200]>(
        "PUT",
        `/api/v1/customer/travellers/${encodeURIComponent(id)}`,
        input,
      ))!,
    deleteTraveller: async (id, concurrencyToken) => {
      await send(
        "DELETE",
        `/api/v1/customer/travellers/${encodeURIComponent(id)}?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
      );
    },
    getWishlist: async (query) =>
      (await send<WishlistPage>("GET", pagePath("/api/v1/customer/wishlist", query)))!,
    createWishlistEntry: async (input) =>
      (await send<CreateCustomerWishlistEntryV1Responses[201]>(
        "POST",
        "/api/v1/customer/wishlist",
        input,
      ))!,
    updateWishlistEntry: async (id, input) =>
      (await send<UpdateCustomerWishlistEntryV1Responses[200]>(
        "PUT",
        `/api/v1/customer/wishlist/${encodeURIComponent(id)}`,
        input,
      ))!,
    deleteWishlistEntry: async (id, concurrencyToken) => {
      await send(
        "DELETE",
        `/api/v1/customer/wishlist/${encodeURIComponent(id)}?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
      );
    },
    getSavedItineraries: async (query) =>
      (await send<SavedItineraryPage>(
        "GET",
        pagePath("/api/v1/customer/saved-itineraries", query),
      ))!,
    getSavedItinerary: (id) =>
      send<SavedItinerary>(
        "GET",
        `/api/v1/customer/saved-itineraries/${encodeURIComponent(id)}`,
        undefined,
        true,
      ),
    createSavedItinerary: async (input) =>
      (await send<CreateCustomerSavedItineraryV1Responses[201]>(
        "POST",
        "/api/v1/customer/saved-itineraries",
        input,
      ))!,
    updateSavedItinerary: async (id, input) =>
      (await send<UpdateCustomerSavedItineraryV1Responses[200]>(
        "PUT",
        `/api/v1/customer/saved-itineraries/${encodeURIComponent(id)}`,
        input,
      ))!,
    deleteSavedItinerary: async (id, concurrencyToken) => {
      await send(
        "DELETE",
        `/api/v1/customer/saved-itineraries/${encodeURIComponent(id)}?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
      );
    },
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
