"use client";

import type { ProductAvailability } from "@dceylon/sdk";
import Link from "next/link";
import { useState, type FormEvent } from "react";

interface ProductAvailabilityProps {
  productSlug: string;
  productType: string;
  timeZone?: string;
}

export function ProductAvailabilityPanel({
  productSlug,
  productType,
  timeZone = "Asia/Colombo",
}: ProductAvailabilityProps) {
  const today = dateInTimeZone(new Date(), timeZone);
  const tomorrow = offsetDate(today, 1);
  const stay = productType === "accommodation" || productType === "stay";
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(stay ? tomorrow : today);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [result, setResult] = useState<ProductAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const query = new URLSearchParams({
      startDate,
      endDate: stay ? endDate : startDate,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    try {
      const response = await fetch(
        `/api/catalogue/products/${encodeURIComponent(productSlug)}/availability?${query}`,
        { headers: { Accept: "application/json" } },
      );
      const body = (await response.json().catch(() => null)) as
        ProductAvailability | { detail?: string; error?: string; title?: string } | null;
      if (!response.ok) {
        throw new Error(
          (body && "detail" in body && body.detail) ||
            (body && "error" in body && body.error) ||
            "Availability could not be checked.",
        );
      }
      setResult(body as ProductAvailability);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Availability could not be checked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="availability-heading">
      <p className="text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
        Plan your journey
      </p>
      <h2 className="mt-3 text-2xl text-navy" id="availability-heading">
        Check availability
      </h2>
      <form className="mt-5 grid gap-4" onSubmit={check}>
        <label className="filter-field">
          <span>{stay ? "Check-in" : "Date"}</span>
          <input
            min={today}
            onChange={(event) => {
              const value = event.target.value;
              setStartDate(value);
              if (stay && endDate <= value) setEndDate(offsetDate(value, 1));
            }}
            required
            type="date"
            value={startDate}
          />
        </label>
        {stay ? (
          <label className="filter-field">
            <span>Check-out</span>
            <input
              min={offsetDate(startDate, 1)}
              onChange={(event) => setEndDate(event.target.value)}
              required
              type="date"
              value={endDate}
            />
          </label>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Count label="Adults" max={30} min={1} onChange={setAdults} value={adults} />
          <Count label="Children" max={20} min={0} onChange={setChildren} value={children} />
          {stay ? <Count label="Rooms" max={10} min={1} onChange={setRooms} value={rooms} /> : null}
        </div>
        <button className="button-primary w-full" disabled={busy} type="submit">
          {busy ? "Checking…" : "Check availability"}
        </button>
      </form>
      <div aria-live="polite" className="mt-5">
        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {result?.kind === "experience" ? <ExperienceResults availability={result} /> : null}
        {result?.kind === "stay" ? <StayResults availability={result} /> : null}
      </div>
    </section>
  );
}

function ExperienceResults({
  availability,
}: {
  availability: Extract<ProductAvailability, { kind: "experience" }>;
}) {
  if (!availability.slots.length)
    return <Unavailable message="No bookable times are available for this date." />;
  return (
    <div>
      <p className="font-semibold text-navy">Available times</p>
      <ul className="mt-3 grid gap-3">
        {availability.slots.map((slot) => (
          <li className="rounded-xl border border-navy/10 p-4" key={slot.id}>
            <strong className="block text-navy">
              {new Intl.DateTimeFormat("en-LK", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: availability.timeZone,
              }).format(new Date(slot.startsAtUtc))}
            </strong>
            <span className="mt-1 block text-sm text-ink-muted">
              {money(slot.price, slot.currency)} {pricingUnit(availability.pricingUnit)} ·{" "}
              {slot.remainingCapacity} places remaining
            </span>
          </li>
        ))}
      </ul>
      <ContinueAction />
    </div>
  );
}

function StayResults({
  availability,
}: {
  availability: Extract<ProductAvailability, { kind: "stay" }>;
}) {
  if (!availability.roomTypes.length)
    return <Unavailable message="No room type is available for every night selected." />;
  return (
    <div>
      <p className="font-semibold text-navy">Available rooms</p>
      <ul className="mt-3 grid gap-3">
        {availability.roomTypes.map((room) => (
          <li className="rounded-xl border border-navy/10 p-4" key={room.id}>
            <strong className="block text-navy">{room.name}</strong>
            <span className="mt-1 block text-sm text-ink-muted">
              {money(room.totalPrice, room.currency)} total · {room.availableUnits} available
            </span>
            {room.beds ? (
              <span className="mt-1 block text-xs text-ink-muted">{room.beds}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <ContinueAction />
    </div>
  );
}

function ContinueAction() {
  return (
    <Link
      className="button-secondary mt-4 block w-full text-center"
      href="/auth/sign-in?callbackUrl=/portal/customer/travel-plans/new"
    >
      Sign in to add to your trip
    </Link>
  );
}

function Unavailable({ message }: { message: string }) {
  return <p className="rounded-xl bg-mist p-4 text-sm leading-6 text-ink-muted">{message}</p>;
}

function Count({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        required
        type="number"
        value={value}
      />
    </label>
  );
}

function money(amount: number | null, currency: string): string {
  if (amount === null) return "Price on request";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

function pricingUnit(value: "person" | "group"): string {
  return value === "person" ? "per person" : "per group";
}

function offsetDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
