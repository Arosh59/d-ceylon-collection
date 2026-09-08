import "server-only";

import { getServerSession } from "next-auth";

import { getAuthOptions } from "./auth";

export interface DashboardActivity {
  eventType: string;
  outcome: string;
  subject: string | null;
  occurredAtUtc: string;
}

export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardData {
  counts: {
    users: number | null;
    customers: number | null;
    publishedProducts: number;
    publishedDestinations: number;
    bookings: number | null;
    pendingBookings: number | null;
    quoteRequests: number | null;
    pendingQuotes: number | null;
    openTasks: number | null;
  };
  recentActivity: DashboardActivity[];
  bookingStatuses: DashboardStatusCount[];
  quoteStatuses: DashboardStatusCount[];
  source: "administrator-api" | "catalogue-api";
  warning?: string;
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await getServerSession(getAuthOptions());
  const apiBaseUrl = required("API_BASE_URL");
  let administratorWarning: string | undefined;

  if (session?.accessToken) {
    try {
      const response = await fetch(new URL("/api/v1/administration/summary", apiBaseUrl), {
        cache: "no-store",
        headers: { Accept: "application/json", Authorization: `Bearer ${session.accessToken}` },
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) {
        const data = (await response.json()) as Omit<DashboardData, "source">;
        return { ...data, source: "administrator-api" };
      }
      administratorWarning =
        "The protected operational summary is unavailable. Published catalogue totals are shown instead.";
    } catch {
      administratorWarning =
        "The protected operational summary could not be reached. Published catalogue totals are shown instead.";
    }
  }

  const [products, destinations] = await Promise.all([
    catalogueCount(apiBaseUrl, "products"),
    catalogueCount(apiBaseUrl, "destinations"),
  ]);

  return {
    counts: {
      users: null,
      customers: null,
      publishedProducts: products,
      publishedDestinations: destinations,
      bookings: null,
      pendingBookings: null,
      quoteRequests: null,
      pendingQuotes: null,
      openTasks: null,
    },
    recentActivity: [],
    bookingStatuses: [],
    quoteStatuses: [],
    source: "catalogue-api",
    warning:
      administratorWarning ??
      "Local administrator credentials provide catalogue review only. Use managed identity for customer, booking, quote, task, and audit data.",
  };
}

async function catalogueCount(apiBaseUrl: string, resource: string): Promise<number> {
  const response = await fetch(new URL(`/api/v1/catalogue/${resource}?pageSize=1`, apiBaseUrl), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`The catalogue API returned HTTP ${response.status}.`);
  const data = (await response.json()) as { pagination?: { totalItems?: number } };
  return Number(data.pagination?.totalItems ?? 0);
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
