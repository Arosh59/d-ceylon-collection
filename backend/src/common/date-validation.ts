import { DomainError } from "./problem-details.filter";

export function requireIsoDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !isIsoDate(value)) {
    throw invalidDate(field);
  }
  return value;
}

export function optionalIsoDate(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requireIsoDate(value, field);
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function invalidDate(field: string): DomainError {
  return new DomainError(400, `${field} must be a valid YYYY-MM-DD date.`, "Validation failed", {
    [field]: [`${field} must be a valid YYYY-MM-DD date.`],
  });
}
