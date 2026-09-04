"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface MapDestination {
  name: string;
  productCount: number;
  slug: string;
  summary: string;
}

type MapPosition = { lat: number; lng: number };

type GoogleMapInstance = {
  panTo: (position: MapPosition) => void;
};

type GoogleMapsApi = {
  Map: new (
    element: HTMLElement,
    options: {
      center: MapPosition;
      fullscreenControl: boolean;
      mapTypeControl: boolean;
      streetViewControl: boolean;
      zoom: number;
    },
  ) => GoogleMapInstance;
  Marker: new (options: { map: GoogleMapInstance; position: MapPosition; title: string }) => {
    addListener: (eventName: string, handler: () => void) => void;
  };
};

type GoogleMapsWindow = Window & { google?: { maps?: GoogleMapsApi } };

let googleMapsLoad: Promise<GoogleMapsApi> | undefined;

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
        <GoogleDestinationMap
          destinations={destinations}
          onSelect={setSelectedSlug}
          selectedSlug={selectedSlug}
        />
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
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                className="font-semibold text-gold-light underline underline-offset-4"
                href={`/destinations/${selected.slug}`}
              >
                Explore {selected.name}
              </Link>
              <a
                className="font-semibold text-white underline decoration-gold underline-offset-4"
                href={googleMapsSearchUrl(selected.name)}
                rel="noreferrer"
                target="_blank"
              >
                Open in Google Maps
              </a>
            </div>
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

function GoogleDestinationMap({
  destinations,
  onSelect,
  selectedSlug,
}: {
  destinations: MapDestination[];
  onSelect: (slug: string) => void;
  selectedSlug: string;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapReference = useRef<GoogleMapInstance | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const [mapLoadError, setMapLoadError] = useState(false);

  useEffect(() => {
    if (!apiKey || !mapElement.current) return;

    let cancelled = false;
    setMapLoadError(false);
    void (async () => {
      try {
        const maps = await loadGoogleMapsApi(apiKey);
        if (cancelled || !mapElement.current) return;

        const map = new maps.Map(mapElement.current, {
          center: { lat: 7.8731, lng: 80.7718 },
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 7,
        });
        mapReference.current = map;
        destinations.forEach((destination) => {
          const position = destinationPosition(destination.slug);
          if (!position) return;
          const marker = new maps.Marker({
            map,
            position,
            title: `${destination.name}: ${destination.productCount} published products`,
          });
          marker.addListener("click", () => onSelect(destination.slug));
        });
      } catch {
        googleMapsLoad = undefined;
        setMapLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey, destinations, onSelect]);

  useEffect(() => {
    const position = destinationPosition(selectedSlug);
    if (position) mapReference.current?.panTo(position);
  }, [selectedSlug]);

  if (!apiKey || mapLoadError) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3 text-sm text-ink-muted">
          <p>
            {mapLoadError
              ? "Google Maps could not load with this key. Showing the accessible destination map instead."
              : "Showing the accessible destination map. Add a Google Maps browser key to enable live mapping."}
          </p>
          {selectedSlug ? (
            <a
              className="font-semibold text-navy underline decoration-gold underline-offset-4"
              href={googleMapsSearchUrl(destinations.find((destination) => destination.slug === selectedSlug)?.name ?? "Sri Lanka")}
              rel="noreferrer"
              target="_blank"
            >
              Open selected place ↗
            </a>
          ) : null}
        </div>
        <AbstractDestinationMap
          destinations={destinations}
          onSelect={onSelect}
          selectedSlug={selectedSlug}
        />
      </div>
    );
  }

  return (
    <div
      aria-describedby="map-instructions"
      aria-label="Google map of Sri Lanka destination locations. Use the destination list below for keyboard selection."
      className="h-[34rem] w-full rounded-2xl bg-mist"
      ref={mapElement}
      role="region"
    />
  );
}

function googleMapsSearchUrl(name: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Sri Lanka`)}`;
}

function loadGoogleMapsApi(apiKey: string): Promise<GoogleMapsApi> {
  const browserWindow = window as GoogleMapsWindow;
  if (browserWindow.google?.maps) return Promise.resolve(browserWindow.google.maps);
  if (googleMapsLoad) return googleMapsLoad;

  googleMapsLoad = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const parameters = new URLSearchParams({
      auth_referrer_policy: "origin",
      key: apiKey,
      language: "en",
      region: "LK",
      v: "weekly",
    });
    script.async = true;
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
    script.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")));
    script.addEventListener("load", () => {
      const maps = (window as GoogleMapsWindow).google?.maps;
      if (maps) resolve(maps);
      else reject(new Error("Google Maps did not initialise."));
    });
    document.head.append(script);
  });

  return googleMapsLoad;
}

function AbstractDestinationMap({
  destinations,
  onSelect,
  selectedSlug,
}: {
  destinations: MapDestination[];
  onSelect: (slug: string) => void;
  selectedSlug: string;
}) {
  return (
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
                onClick={() => onSelect(destination.slug)}
                type="button"
              />
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

function destinationPosition(slug: string) {
  return {
    colombo: { lat: 6.9271, lng: 79.8612 },
    ella: { lat: 6.8667, lng: 81.0466 },
    galle: { lat: 6.0329, lng: 80.2168 },
    kandy: { lat: 7.2906, lng: 80.6337 },
    sigiriya: { lat: 7.957, lng: 80.7603 },
    tangalle: { lat: 6.0249, lng: 80.7941 },
  }[slug];
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
