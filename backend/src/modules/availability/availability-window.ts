import { DomainError } from "../../common/problem-details.filter";

export interface AvailabilityWindowInput {
  startDate?: string;
  endDate?: string;
  adults?: string | number;
  children?: string | number;
  rooms?: string | number;
}

export interface AvailabilityWindow {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  rooms: number;
  dayCount: number;
}

export function availabilityWindow(
  input: AvailabilityWindowInput,
  now = new Date(),
  timeZone = "Asia/Colombo",
): AvailabilityWindow {
  const startDate = dateValue(input.startDate, "startDate");
  const endDate = dateValue(input.endDate, "endDate");
  const start = dateNumber(startDate);
  const end = dateNumber(endDate);
  const today = dateNumber(dateInTimeZone(now, timeZone));
  if (start < today) invalid("startDate", "Start date cannot be in the past.");
  if (end < start) invalid("endDate", "End date cannot be before start date.");
  const dayCount = Math.round((end - start) / 86_400_000);
  if (dayCount > 62) invalid("endDate", "Availability can be checked for at most 62 days.");
  return {
    startDate,
    endDate,
    adults: integer(input.adults ?? 1, "adults", 1, 30),
    children: integer(input.children ?? 0, "children", 0, 20),
    rooms: integer(input.rooms ?? 1, "rooms", 1, 10),
    dayCount,
  };
}

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dateValue(value: string | undefined, field: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    invalid(field, `${field} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    invalid(field, `${field} must be a real calendar date.`);
  }
  return value;
}

function dateNumber(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

function integer(value: string | number, field: string, minimum: number, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    invalid(field, `${field} must be between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

function invalid(field: string, detail: string): never {
  throw new DomainError(400, detail, "Validation failed", { [field]: [detail] });
}
