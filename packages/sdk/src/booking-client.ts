import type {
  BookingResponse,
  CreateBookingRequest,
  CreateCustomerBookingV1Responses,
  CreateCustomerPaymentV1Responses,
  CreatePaymentRequest,
  GetAgentBookingV1Responses,
  GetAgentBookingsV1Responses,
  GetCustomerBookingV1Responses,
  GetCustomerBookingsV1Responses,
  GetCustomerPaymentV1Responses,
  GetCustomerPaymentsV1Responses,
} from "./generated";

export type Booking = BookingResponse;
export type CustomerBookingPage = GetCustomerBookingsV1Responses[200];
export type AgentBookingPage = GetAgentBookingsV1Responses[200];
export type Payment = GetCustomerPaymentV1Responses[200];
export type PaymentPage = GetCustomerPaymentsV1Responses[200];
export type { CreateBookingRequest, CreatePaymentRequest };

export interface BookingClientOptions {
  accessToken: string;
  baseUrl: string;
  correlationId?: string;
  fetch?: typeof globalThis.fetch;
}

export interface BookingPagination {
  pageNumber?: number;
  pageSize?: number;
}

export interface BookingClient {
  getCustomerBookings(query?: BookingPagination): Promise<CustomerBookingPage>;
  getCustomerBooking(id: string): Promise<Booking | null>;
  createCustomerBooking(
    input: CreateBookingRequest,
  ): Promise<CreateCustomerBookingV1Responses[201]>;
  getAgentBookings(query?: BookingPagination): Promise<AgentBookingPage>;
  getAgentBooking(id: string): Promise<GetAgentBookingV1Responses[200] | null>;
  getCustomerPayments(bookingId: string, query?: BookingPagination): Promise<PaymentPage>;
  getCustomerPayment(id: string): Promise<Payment | null>;
  createCustomerPayment(
    bookingId: string,
    input: CreatePaymentRequest,
  ): Promise<CreateCustomerPaymentV1Responses[201]>;
}

interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class BookingApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId?: string,
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "BookingApiError";
  }
}

export function createBookingClient(options: BookingClientOptions): BookingClient {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const pagePath = (path: string, query: BookingPagination = {}) => {
    const url = new URL(path, baseUrl);
    if (query.pageNumber !== undefined)
      url.searchParams.set("pageNumber", String(query.pageNumber));
    if (query.pageSize !== undefined) url.searchParams.set("pageSize", String(query.pageSize));
    return `${url.pathname}${url.search}`;
  };
  async function send<T>(
    method: "GET" | "POST",
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
      throw new BookingApiError(
        problem?.detail ?? problem?.title ?? `Booking API request failed with ${response.status}.`,
        response.status,
        problem?.correlationId ?? response.headers.get("X-Correlation-ID") ?? undefined,
        problem?.errors,
      );
    }
    return (await response.json()) as T;
  }
  return {
    getCustomerBookings: async (query) =>
      (await send<CustomerBookingPage>("GET", pagePath("/api/v1/customer/bookings", query)))!,
    getCustomerBooking: (id) =>
      send<Booking>("GET", `/api/v1/customer/bookings/${encodeURIComponent(id)}`, undefined, true),
    createCustomerBooking: async (input) =>
      (await send<CreateCustomerBookingV1Responses[201]>(
        "POST",
        "/api/v1/customer/bookings",
        input,
      ))!,
    getAgentBookings: async (query) =>
      (await send<AgentBookingPage>("GET", pagePath("/api/v1/agent/bookings", query)))!,
    getAgentBooking: (id) =>
      send<GetAgentBookingV1Responses[200]>(
        "GET",
        `/api/v1/agent/bookings/${encodeURIComponent(id)}`,
        undefined,
        true,
      ),
    getCustomerPayments: async (bookingId, query) =>
      (await send<PaymentPage>(
        "GET",
        pagePath(`/api/v1/customer/bookings/${encodeURIComponent(bookingId)}/payments`, query),
      ))!,
    getCustomerPayment: (id) =>
      send<Payment>("GET", `/api/v1/customer/payments/${encodeURIComponent(id)}`, undefined, true),
    createCustomerPayment: async (bookingId, input) =>
      (await send<CreateCustomerPaymentV1Responses[201]>(
        "POST",
        `/api/v1/customer/bookings/${encodeURIComponent(bookingId)}/payments`,
        input,
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
