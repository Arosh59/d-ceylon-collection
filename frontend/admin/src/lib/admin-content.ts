import "server-only";

export interface AdminContentItem {
  id: string;
  name: string;
  slug: string;
  publicationState: string;
  summary?: string | null;
  typeName?: string;
  typeSlug?: string;
  updatedAtUtc: string;
  concurrencyToken: string;
}

export interface AdminContentPage {
  items: AdminContentItem[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AdminOption {
  id: string;
  name?: string;
  slug?: string;
  assetKey?: string;
  altText?: string;
}
export interface AdminContentOptions {
  productTypes: AdminOption[];
  categories: AdminOption[];
  collections: AdminOption[];
  destinations: AdminOption[];
  tags: AdminOption[];
  media: AdminOption[];
}

export interface AdminContentRecord extends Record<string, unknown> {
  id: string;
  concurrencyToken: string;
  name: string;
  slug: string;
}

export interface AdminContactContent {
  email: string;
  phone?: string;
  eyebrow: string;
  heading: string;
  description: string;
  promise: string;
  concurrencyToken: string;
}

export interface AdminUserItem {
  id: string;
  displayName: string;
  email: string | null;
  isActive: boolean;
  roles: string[];
  updatedAtUtc: string;
}

export interface AdminUserPage {
  items: AdminUserItem[];
  pagination: AdminContentPage["pagination"];
}

export function managedResource(slug: string): { resource: string; productType?: string } | null {
  if (
    [
      "products",
      "collections",
      "destinations",
      "journal",
      "product-types",
      "categories",
      "tags",
      "media",
    ].includes(slug)
  ) {
    return { resource: slug };
  }
  if (slug === "catalogue") return { resource: "products" };
  if (slug === "experiences") return { resource: "products", productType: "experience" };
  if (slug === "accommodation") return { resource: "products", productType: "accommodation" };
  return null;
}

export function publicWebUrl(path = ""): string {
  const base = process.env.PUBLIC_WEB_URL?.trim() || "http://127.0.0.1:3000";
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

export async function getAdminContentPage(
  token: string,
  resource: string,
  query: { page?: number; search?: string; status?: string; productType?: string },
): Promise<AdminContentPage> {
  const parameters = new URLSearchParams({ pageNumber: String(query.page ?? 1), pageSize: "20" });
  if (query.search) parameters.set("query", query.search);
  if (query.status) parameters.set("status", query.status);
  if (query.productType) parameters.set("productType", query.productType);
  return adminGet(token, `/api/v1/administration/content/${resource}?${parameters}`);
}

export function getAdminContentRecord(
  token: string,
  resource: string,
  id: string,
): Promise<AdminContentRecord> {
  return adminGet(token, `/api/v1/administration/content/${resource}/${id}`);
}

export function getAdminContentOptions(token: string): Promise<AdminContentOptions> {
  return adminGet(token, "/api/v1/administration/content/options");
}

export function getAdminContact(token: string): Promise<AdminContactContent> {
  return adminGet(token, "/api/v1/administration/content/contact");
}

export function getAdminUsers(
  token: string,
  page: number,
  search?: string,
): Promise<AdminUserPage> {
  const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
  if (search) query.set("query", search);
  return adminGet(token, `/api/v1/administration/users?${query}`);
}

async function adminGet<T>(token: string, path: string): Promise<T> {
  const response = await fetch(new URL(path, apiBaseUrl()), {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const value = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
    } | null;
    throw new Error(
      value?.detail ?? value?.message ?? `Administration API returned HTTP ${response.status}.`,
    );
  }
  return response.json() as Promise<T>;
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
