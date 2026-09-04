import type { CatalogueSearch } from "@dceylon/sdk";

export type SearchParameters = Record<string, string | string[] | undefined>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sorts = new Set<CatalogueSearch["sort"]>(["name", "price-asc", "price-desc", "duration-asc"]);

export function parseCatalogueSearchParams(parameters: SearchParameters): CatalogueSearch {
  const query = value(parameters.query);
  const sort = value(parameters.sort) as CatalogueSearch["sort"];

  return {
    pageNumber: positiveInteger(value(parameters.page), 1),
    pageSize: 9,
    query: query && query.length >= 2 && query.length <= 100 ? query : undefined,
    productType: slug(value(parameters.productType)),
    category: slug(value(parameters.category)),
    collection: slug(value(parameters.collection)),
    destination: slug(value(parameters.destination)),
    tag: slug(value(parameters.tag)),
    minimumPrice: nonNegativeNumber(value(parameters.minimumPrice)),
    maximumPrice: nonNegativeNumber(value(parameters.maximumPrice)),
    minimumDurationMinutes: positiveIntegerOrUndefined(value(parameters.minimumDurationMinutes)),
    maximumDurationMinutes: positiveIntegerOrUndefined(value(parameters.maximumDurationMinutes)),
    sort: sort && sorts.has(sort) ? sort : "name",
  };
}

export function catalogueQueryRecord(search: CatalogueSearch): Record<string, string | undefined> {
  return {
    query: search.query,
    productType: search.productType,
    category: search.category,
    collection: search.collection,
    destination: search.destination,
    tag: search.tag,
    minimumPrice: search.minimumPrice === undefined ? undefined : String(search.minimumPrice),
    maximumPrice: search.maximumPrice === undefined ? undefined : String(search.maximumPrice),
    minimumDurationMinutes:
      search.minimumDurationMinutes === undefined ? undefined : String(search.minimumDurationMinutes),
    maximumDurationMinutes:
      search.maximumDurationMinutes === undefined ? undefined : String(search.maximumDurationMinutes),
    sort: search.sort === "name" ? undefined : search.sort,
  };
}

function value(input: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(input) ? input[0] : input;
  const normalized = candidate?.trim();
  return normalized ? normalized : undefined;
}

function slug(input: string | undefined): string | undefined {
  return input && slugPattern.test(input) ? input : undefined;
}

function positiveInteger(input: string | undefined, fallback: number): number {
  if (!input || !/^\d+$/.test(input)) {
    return fallback;
  }

  const parsed = Number(input);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 100_000 ? parsed : fallback;
}

function positiveIntegerOrUndefined(input: string | undefined): number | undefined {
  if (!input || !/^\d+$/.test(input)) return undefined;
  const parsed = Number(input);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 100_000 ? parsed : undefined;
}

function nonNegativeNumber(input: string | undefined): number | undefined {
  if (!input || !/^\d+(?:\.\d{1,2})?$/.test(input)) return undefined;
  const parsed = Number(input);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
