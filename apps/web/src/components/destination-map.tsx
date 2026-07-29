"use client";

import Link from "next/link";
import { useState } from "react";

export interface MapDestination {
  name: string;
  productCount: number;
  slug: string;
  summary: string;
}

export function DestinationMap({ destinations }: { destinations: MapDestination[] }) {
  const [selectedSlug, setSelectedSlug] = useState(destinations[0]?.slug ?? "");
  const selected = destinations.find((destination) => destination.slug === selectedSlug);

  if (destinations.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="rounded-3xl border border-navy/10 bg-white p-5 shadow-soft">
        <p className="sr-only" id="map-instructions">
          Select a destination marker to update the destination summary. The destination list below
          provides an equivalent non-map experience.
        </p>
        <svg
          aria-describedby="map-instructions"
          aria-label="Abstract Sri Lanka destination map"
          className="h-auto w-full"
          role="img"
          viewBox="0 0 460 620"
        >
          <path
            aria-hidden="true"
            d="M235 30C300 80 346 143 342 217c-4 66 59 91 25 155-23 43-37 120-104 183-44 42-93 5-112-41-24-59-67-105-44-175 17-53 63-76 60-145-2-58 31-88 68-134Z"
            fill="#e8eef5"
            stroke="#0E2342"
            strokeWidth="3"
          />
          {destinations.map((destination, index) => {
            const position = markerPosition(index, destinations.length);
            const active = destination.slug === selectedSlug;
            return (
              <g key={destination.slug} transform={`translate(${position.x} ${position.y})`}>
                <circle
                  aria-hidden="true"
                  fill={active ? "#C8A45D" : "#0E2342"}
                  r={active ? "14" : "10"}
                />
                <foreignObject height="44" width="44" x="-22" y="-22">
                  <button
                    aria-label={`Select ${destination.name}, ${destination.productCount} published products`}
                    className="size-11 cursor-pointer rounded-full bg-transparent focus-visible:outline-3 focus-visible:outline-gold"
                    onClick={() => setSelectedSlug(destination.slug)}
                    type="button"
                  />
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      <aside aria-live="polite" className="rounded-3xl bg-navy p-7 text-white">
        {selected ? (
          <>
            <p className="eyebrow text-gold-light">Selected destination</p>
            <h2 className="mt-3 text-3xl">{selected.name}</h2>
            <p className="mt-4 text-white/75">{selected.summary}</p>
            <p className="mt-4 text-sm text-white/70">
              {selected.productCount} published{" "}
              {selected.productCount === 1 ? "product" : "products"}
            </p>
            <Link
              className="mt-6 inline-block font-semibold text-gold-light underline"
              href={`/destinations/${selected.slug}`}
            >
              Explore {selected.name}
            </Link>
          </>
        ) : null}
      </aside>
      <section aria-label="Destination list fallback" className="lg:col-span-2">
        <h2 className="text-2xl text-navy">Browse destinations without the map</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <li key={destination.slug}>
              <button
                aria-pressed={destination.slug === selectedSlug}
                className="w-full rounded-2xl border border-navy/10 bg-white px-5 py-4 text-left text-navy shadow-soft focus-visible:outline-3 focus-visible:outline-gold"
                onClick={() => setSelectedSlug(destination.slug)}
                type="button"
              >
                <span className="block text-lg font-semibold">{destination.name}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {destination.productCount} published products
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function markerPosition(index: number, count: number) {
  const positions = [
    { x: 234, y: 122 },
    { x: 184, y: 234 },
    { x: 278, y: 320 },
    { x: 190, y: 410 },
    { x: 250, y: 497 },
    { x: 215, y: 555 },
  ];
  return positions[index % Math.min(count, positions.length)]!;
}
