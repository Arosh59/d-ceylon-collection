"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { loadGoogleMapsApi } from "@/lib/google-maps-loader";

export interface MapDestination {
  categories: { name: string; slug: string }[];
  district: string | null;
  id: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  productCount: number;
  province: string | null;
  slug: string;
  summary: string;
}

type MobileView = "list" | "map";
type MapStatus = "error" | "loading" | "ready";

const SRI_LANKA_BOUNDS = { east: 82.1, north: 9.95, south: 5.8, west: 79.5 } as const;
const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 } as const;

export function DestinationMap({
  apiKey,
  destinations,
}: {
  apiKey?: string | undefined;
  destinations: MapDestination[];
}) {
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const [province, setProvince] = useState("");
  const [query, setQuery] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      uniqueSorted(
        destinations.flatMap((destination) => destination.categories.map((item) => item.name)),
      ),
    [destinations],
  );
  const districts = useMemo(
    () => uniqueSorted(destinations.map((destination) => destination.district)),
    [destinations],
  );
  const provinces = useMemo(
    () => uniqueSorted(destinations.map((destination) => destination.province)),
    [destinations],
  );
  const filteredDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return destinations.filter((destination) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [destination.name, destination.summary, destination.district, destination.province]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
      return (
        matchesQuery &&
        (!category || destination.categories.some((item) => item.name === category)) &&
        (!district || destination.district === district) &&
        (!province || destination.province === province)
      );
    });
  }, [category, destinations, district, province, query]);
  const hasFilters = Boolean(query || category || district || province);
  const effectiveSelectedSlug = filteredDestinations.some(
    (destination) => destination.slug === selectedSlug,
  )
    ? selectedSlug
    : null;

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory("");
    setDistrict("");
    setProvince("");
    setSelectedSlug(null);
    setResetToken((value) => value + 1);
  }, []);

  const resetMap = useCallback(() => {
    setSelectedSlug(null);
    setResetToken((value) => value + 1);
  }, []);

  return (
    <div>
      <form
        aria-label="Filter map destinations"
        className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="filter-field sm:col-span-2 xl:col-span-1">
            <span>Search destinations</span>
            <input
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Try Ella, coast, or heritage"
              type="search"
              value={query}
            />
          </label>
          <MapFilter
            label="Category"
            onChange={setCategory}
            options={categories}
            value={category}
          />
          <MapFilter label="Province" onChange={setProvince} options={provinces} value={province} />
          <MapFilter label="District" onChange={setDistrict} options={districts} value={district} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-navy/8 pt-5">
          <p aria-live="polite" className="text-sm font-semibold text-navy">
            {filteredDestinations.length}{" "}
            {filteredDestinations.length === 1 ? "destination" : "destinations"}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              disabled={!hasFilters}
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
            <button className="button-primary" onClick={resetMap} type="button">
              View all Sri Lanka
            </button>
          </div>
        </div>
      </form>

      <div
        className="mt-5 flex rounded-full border border-navy/10 bg-white p-1 shadow-soft lg:hidden"
        role="group"
        aria-label="Choose map or list view"
      >
        {(["map", "list"] as const).map((view) => (
          <button
            aria-pressed={mobileView === view}
            className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold capitalize ${
              mobileView === view ? "bg-navy text-white" : "text-navy"
            }`}
            key={view}
            onClick={() => setMobileView(view)}
            type="button"
          >
            {view} view
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
        <section
          className={mobileView === "map" ? "block" : "hidden lg:block"}
          aria-label="Sri Lanka destination map"
        >
          <GoogleDestinationMap
            apiKey={apiKey}
            destinations={filteredDestinations}
            isVisible={mobileView === "map"}
            onSelect={setSelectedSlug}
            resetToken={resetToken}
            selectedSlug={effectiveSelectedSlug}
          />
        </section>
        <aside
          className={mobileView === "list" ? "block" : "hidden lg:block"}
          aria-label="Map destination results"
        >
          <DestinationResults
            destinations={filteredDestinations}
            onSelect={(slug) => {
              setSelectedSlug(slug);
              setMobileView("map");
            }}
            selectedSlug={effectiveSelectedSlug}
          />
        </aside>
      </div>
    </div>
  );
}

function MapFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        <option value="">
          All {label === "Category" ? "categories" : `${label.toLocaleLowerCase()}s`}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DestinationResults({
  destinations,
  onSelect,
  selectedSlug,
}: {
  destinations: MapDestination[];
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
}) {
  if (destinations.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-[1.75rem] border border-navy/10 bg-white p-8 text-center shadow-soft">
        <div>
          <p className="eyebrow">No results</p>
          <h2 className="mt-3 text-3xl text-navy">No destinations match.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Clear or adjust the filters to see more of Sri Lanka.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol
      className="grid max-h-[48rem] gap-3 overflow-y-auto pr-1"
      aria-label="Filtered destinations"
    >
      {destinations.map((destination) => {
        const active = destination.slug === selectedSlug;
        return (
          <li key={destination.id}>
            <article
              className={`overflow-hidden rounded-2xl border bg-white shadow-soft ${active ? "border-gold ring-2 ring-gold/30" : "border-navy/10"}`}
            >
              {destination.imageUrl ? (
                <div className="relative aspect-[16/7] bg-mist">
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 25rem, 100vw"
                    src={destination.imageUrl}
                  />
                </div>
              ) : null}
              <div className="p-4">
                <button
                  aria-pressed={active}
                  className="w-full text-left focus-visible:outline-offset-4"
                  onClick={() => onSelect(destination.slug)}
                  type="button"
                >
                  <span className="block text-xl font-semibold text-navy">{destination.name}</span>
                  <span className="mt-1 block text-xs font-semibold tracking-wide text-gold-dark uppercase">
                    {destination.district
                      ? `${destination.district} District`
                      : (destination.province ?? "Sri Lanka")}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-6 text-ink-muted">
                    {destination.summary}
                  </span>
                </button>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-navy/8 pt-3 text-sm">
                  <span className="text-ink-muted">
                    {destination.productCount}{" "}
                    {destination.productCount === 1 ? "experience" : "experiences"}
                  </span>
                  <Link
                    className="font-semibold text-navy underline decoration-gold underline-offset-4"
                    href={exploreHref(destination.slug)}
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function GoogleDestinationMap({
  apiKey,
  destinations,
  isVisible,
  onSelect,
  resetToken,
  selectedSlug,
}: {
  apiKey?: string | undefined;
  destinations: MapDestination[];
  isVisible: boolean;
  onSelect: (slug: string) => void;
  resetToken: number;
  selectedSlug: string | null;
}) {
  const router = useRouter();
  const clustererReference = useRef<MarkerClusterer | null>(null);
  const hasRenderedMarkers = useRef(false);
  const infoWindowReference = useRef<google.maps.InfoWindow | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapReference = useRef<google.maps.Map | null>(null);
  const mapsReference = useRef<typeof google.maps | null>(null);
  const markerListeners = useRef<google.maps.MapsEventListener[]>([]);
  const markers = useRef(
    new Map<string, { destination: MapDestination; marker: google.maps.Marker }>(),
  );
  const onSelectReference = useRef(onSelect);
  const routerReference = useRef(router);
  const selectedSlugReference = useRef(selectedSlug);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [status, setStatus] = useState<MapStatus>(apiKey ? "loading" : "error");

  useEffect(() => {
    onSelectReference.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    routerReference.current = router;
  }, [router]);
  useEffect(() => {
    selectedSlugReference.current = selectedSlug;
  }, [selectedSlug]);

  useEffect(() => {
    if (!apiKey || !mapElement.current) {
      setMapError("Google Maps API key is missing.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    setMapError("");
    setStatus("loading");
    void loadGoogleMapsApi(apiKey)
      .then((maps) => {
        if (cancelled || !mapElement.current) return;
        mapsReference.current = maps;
        const map = new maps.Map(mapElement.current, {
          center: SRI_LANKA_CENTER,
          clickableIcons: true,
          fullscreenControl: true,
          gestureHandling: "cooperative",
          heading: 0,
          mapTypeControl: false,
          maxZoom: 15,
          minZoom: 7,
          restriction: { latLngBounds: SRI_LANKA_BOUNDS, strictBounds: false },
          rotateControl: false,
          streetViewControl: false,
          styles: MAP_STYLES,
          tilt: 0,
          zoom: 7,
          zoomControl: true,
        });
        map.fitBounds(SRI_LANKA_BOUNDS, 24);
        mapReference.current = map;
        infoWindowReference.current = new maps.InfoWindow({ maxWidth: 320 });
        setMapReady(true);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : "Google Maps could not load.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      clearMapMarkers(mapsReference.current, clustererReference, markers, markerListeners);
      infoWindowReference.current?.close();
      if (mapReference.current && mapsReference.current) {
        mapsReference.current.event.clearInstanceListeners(mapReference.current);
      }
      mapReference.current = null;
      infoWindowReference.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    const maps = mapsReference.current;
    const map = mapReference.current;
    if (!mapReady || !maps || !map) return;

    clearMapMarkers(maps, clustererReference, markers, markerListeners);
    const validDestinations = destinations.filter(hasValidSriLankaCoordinates);
    for (const destination of validDestinations) {
      const marker = new maps.Marker({
        clickable: true,
        icon: markerIcon(maps, destination.slug === selectedSlugReference.current, false),
        map,
        optimized: true,
        position: { lat: destination.latitude!, lng: destination.longitude! },
        title: `Explore ${destination.name}`,
      });
      markerListeners.current.push(
        marker.addListener("click", () => {
          if (selectedSlugReference.current === destination.slug) {
            routerReference.current.push(exploreHref(destination.slug));
            return;
          }
          onSelectReference.current(destination.slug);
        }),
        marker.addListener("mouseover", () =>
          marker.setIcon(
            markerIcon(maps, destination.slug === selectedSlugReference.current, true),
          ),
        ),
        marker.addListener("mouseout", () =>
          marker.setIcon(
            markerIcon(maps, destination.slug === selectedSlugReference.current, false),
          ),
        ),
      );
      markers.current.set(destination.slug, { destination, marker });
    }

    clustererReference.current = new MarkerClusterer({
      map,
      markers: [...markers.current.values()].map((entry) => entry.marker),
    });
    if (hasRenderedMarkers.current) fitDestinationMarkers(map, maps, validDestinations);
    else hasRenderedMarkers.current = true;
  }, [destinations, mapReady]);

  useEffect(() => {
    const maps = mapsReference.current;
    const map = mapReference.current;
    if (!mapReady || !maps || !map) return;

    for (const [slug, entry] of markers.current) {
      const active = slug === selectedSlug;
      entry.marker.setIcon(markerIcon(maps, active, false));
      entry.marker.setZIndex(active ? 1000 : undefined);
    }
    const selected = selectedSlug ? markers.current.get(selectedSlug) : undefined;
    if (!selected) {
      infoWindowReference.current?.close();
      return;
    }
    infoWindowReference.current?.setContent(
      createInfoWindowContent(selected.destination, () =>
        routerReference.current.push(exploreHref(selected.destination.slug)),
      ),
    );
    infoWindowReference.current?.open({ anchor: selected.marker, map, shouldFocus: false });
    map.panTo(selected.marker.getPosition()!);
  }, [mapReady, selectedSlug]);

  useEffect(() => {
    if (resetToken === 0 || !mapReference.current) return;
    infoWindowReference.current?.close();
    mapReference.current.fitBounds(SRI_LANKA_BOUNDS, 24);
  }, [resetToken]);

  useEffect(() => {
    const maps = mapsReference.current;
    const map = mapReference.current;
    if (!isVisible || !mapReady || !maps || !map) return;
    const frame = window.requestAnimationFrame(() => {
      maps.event.trigger(map, "resize");
      map.fitBounds(SRI_LANKA_BOUNDS, 24);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isVisible, mapReady]);

  return (
    <div
      className="relative h-[32rem] min-h-[28rem] overflow-hidden rounded-[1.75rem] border border-navy/10 bg-mist shadow-soft sm:h-[38rem] lg:h-[44rem] xl:h-[48rem]"
      data-map-error={mapError || undefined}
      data-map-status={status}
    >
      <div
        aria-label="Interactive Google map showing destinations in Sri Lanka"
        className="h-full w-full"
        ref={mapElement}
        role="region"
      />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-mist" role="status">
          <div className="text-center">
            <span className="mx-auto block size-12 animate-pulse rounded-full bg-gold/70 motion-reduce:animate-none" />
            <p className="mt-4 font-semibold text-navy">Loading the map of Sri Lanka…</p>
          </div>
        </div>
      ) : null}
      {status === "error" ? (
        <div
          className="absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,#eef1ef,#dde5e3)] p-6 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-3xl border border-navy/10 bg-white/90 p-7 shadow-soft backdrop-blur">
            <p className="eyebrow">Map unavailable</p>
            <h2 className="mt-3 text-3xl text-navy">The live map could not load.</h2>
            <p className="mt-4 leading-7 text-ink-muted">
              {apiKey
                ? "Check the connection and Google Maps key restrictions. You can still browse every destination in the list."
                : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the web environment. You can still browse every destination in the list."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function clearMapMarkers(
  maps: typeof google.maps | null,
  clustererReference: { current: MarkerClusterer | null },
  markers: { current: Map<string, { destination: MapDestination; marker: google.maps.Marker }> },
  markerListeners: { current: google.maps.MapsEventListener[] },
) {
  clustererReference.current?.clearMarkers();
  clustererReference.current = null;
  for (const listener of markerListeners.current) maps?.event.removeListener(listener);
  markerListeners.current = [];
  for (const entry of markers.current.values()) entry.marker.setMap(null);
  markers.current.clear();
}

function fitDestinationMarkers(
  map: google.maps.Map,
  maps: typeof google.maps,
  destinations: MapDestination[],
) {
  if (destinations.length === 0) {
    map.fitBounds(SRI_LANKA_BOUNDS, 24);
    return;
  }
  if (destinations.length === 1) {
    map.setCenter({ lat: destinations[0]!.latitude!, lng: destinations[0]!.longitude! });
    map.setZoom(10);
    return;
  }
  const bounds = new maps.LatLngBounds();
  for (const destination of destinations)
    bounds.extend({ lat: destination.latitude!, lng: destination.longitude! });
  map.fitBounds(bounds, 64);
  maps.event.addListenerOnce(map, "idle", () => {
    if ((map.getZoom() ?? 7) > 10) map.setZoom(10);
  });
}

function markerIcon(
  maps: typeof google.maps,
  active: boolean,
  hovered: boolean,
): google.maps.Symbol {
  return {
    fillColor: active ? "#C8A45D" : hovered ? "#17365D" : "#0E2342",
    fillOpacity: 1,
    path: maps.SymbolPath.CIRCLE,
    scale: active ? 11 : hovered ? 10 : 8,
    strokeColor: "#FFFFFF",
    strokeWeight: 3,
  };
}

function createInfoWindowContent(destination: MapDestination, navigate: () => void): HTMLElement {
  const article = document.createElement("article");
  article.className = "destination-map-info";
  if (destination.imageUrl) {
    const image = document.createElement("img");
    image.alt = "";
    image.className = "destination-map-info__image";
    image.src = destination.imageUrl;
    article.append(image);
  }
  const body = document.createElement("div");
  body.className = "destination-map-info__body";
  const title = document.createElement("button");
  title.className = "destination-map-info__title";
  title.type = "button";
  title.textContent = destination.name;
  title.addEventListener("click", navigate);
  const meta = document.createElement("p");
  meta.className = "destination-map-info__meta";
  meta.textContent = [
    destination.district ? `${destination.district} District` : null,
    destination.categories[0]?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const summary = document.createElement("p");
  summary.className = "destination-map-info__summary";
  summary.textContent = destination.summary;
  const action = document.createElement("button");
  action.className = "destination-map-info__action";
  action.type = "button";
  action.textContent = "Explore destination →";
  action.addEventListener("click", navigate);
  body.append(title, meta, summary, action);
  article.append(body);
  return article;
}

function hasValidSriLankaCoordinates(destination: MapDestination): boolean {
  return (
    typeof destination.latitude === "number" &&
    Number.isFinite(destination.latitude) &&
    destination.latitude >= SRI_LANKA_BOUNDS.south &&
    destination.latitude <= SRI_LANKA_BOUNDS.north &&
    typeof destination.longitude === "number" &&
    Number.isFinite(destination.longitude) &&
    destination.longitude >= SRI_LANKA_BOUNDS.west &&
    destination.longitude <= SRI_LANKA_BOUNDS.east
  );
}

function exploreHref(slug: string) {
  return `/catalogue?destination=${encodeURIComponent(slug)}`;
}

function uniqueSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort(
    (left, right) => left.localeCompare(right),
  );
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", featureType: "poi", stylers: [{ saturation: -25 }] },
  { elementType: "geometry", featureType: "landscape", stylers: [{ color: "#eef1ea" }] },
  { elementType: "geometry", featureType: "water", stylers: [{ color: "#c9dde2" }] },
  { elementType: "geometry", featureType: "road", stylers: [{ color: "#ffffff" }] },
  { elementType: "geometry.stroke", featureType: "road", stylers: [{ color: "#d2d7d2" }] },
];
