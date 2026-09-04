import "server-only";

export type CatalogueModule =
  | "products"
  | "product-types"
  | "categories"
  | "collections"
  | "destinations"
  | "tags";

export interface CatalogueRecord {
  id: string;
  name: string;
  slug: string;
  summary?: string;
  productType?: { name?: string };
  status?: string;
}

export interface CatalogueModuleData {
  items: CatalogueRecord[];
  totalItems: number;
  pageNumber: number;
  totalPages: number;
}

export async function getCatalogueModuleData(
  resource: CatalogueModule,
  query?: string,
  pageNumber = 1,
  sort?: string,
): Promise<CatalogueModuleData> {
  const apiBaseUrl = required("API_BASE_URL");
  const url = new URL(`/api/v1/catalogue/${resource}`, apiBaseUrl);
  url.searchParams.set("pageSize", "25");
  url.searchParams.set("pageNumber", String(pageNumber));
  if (resource === "products" && query?.trim()) url.searchParams.set("query", query.trim());
  if (resource === "products" && sort) url.searchParams.set("sort", sort);

  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`The catalogue API returned HTTP ${response.status}.`);
  const data = (await response.json()) as {
    items?: CatalogueRecord[];
    pagination?: { totalItems?: number; pageNumber?: number; totalPages?: number };
  };
  return {
    items: data.items ?? [],
    totalItems: Number(data.pagination?.totalItems ?? 0),
    pageNumber: Number(data.pagination?.pageNumber ?? 1),
    totalPages: Math.max(1, Number(data.pagination?.totalPages ?? 1)),
  };
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
