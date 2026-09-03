import { DomainError } from "./problem-details.filter";

export interface PageQuery {
  pageNumber?: string | number;
  pageSize?: string | number;
}

export interface Page<T> {
  [key: string]: unknown;
  items: T[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export function pagination(query: PageQuery): {
  pageNumber: number;
  pageSize: number;
  skip: number;
} {
  const pageNumber = Number(query.pageNumber ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new DomainError(400, "Page number must be at least 1.", "Validation failed", {
      pageNumber: ["Page number must be at least 1."],
    });
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new DomainError(400, "Page size must be between 1 and 100.", "Validation failed", {
      pageSize: ["Page size must be between 1 and 100."],
    });
  }
  return { pageNumber, pageSize, skip: (pageNumber - 1) * pageSize };
}

export function page<T>(
  items: T[],
  totalCount: number,
  pageNumber: number,
  pageSize: number,
): Page<T> {
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  return {
    items,
    pagination: {
      pageNumber,
      pageSize,
      totalItems: totalCount,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    },
  };
}

export function requireUuid(value: string, field = "id"): string {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(value)) {
    throw new DomainError(400, `${field} must be a UUID.`, "Validation failed", {
      [field]: [`${field} must be a UUID.`],
    });
  }
  return value;
}
