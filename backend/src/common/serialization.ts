import { Prisma } from "@prisma/client";

export function apiValue<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
  }
  return value;
}
