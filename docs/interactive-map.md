# Interactive Sri Lanka Map

The public page at `/destinations/map` uses the Google Maps JavaScript API and includes a complete,
keyboard-accessible destination list. If Google Maps is not configured or cannot load, the page
shows a professional error state while keeping the searchable destination list available. There is
no illustrated or synthetic map fallback.

## Google Maps configuration

Set `GOOGLE_MAPS_API_KEY` in the public web runtime environment. The key is necessarily visible
in the browser, so restrict it to the production and local-development HTTP referrers. Limit the key
to the Maps JavaScript API and keep its billing, quota, and restriction settings under the
organisation's Google Cloud account.

The value is read by the Next.js server and passed only to the map component. This keeps Docker
images portable between environments and avoids the build-time freezing applied to `NEXT_PUBLIC_*`
variables. No API key is committed to the repository.

The integration loads Google Maps once, uses the weekly channel, requests Sri Lanka regional data in
English, and clusters published destinations at crowded zoom levels. It does not use Places,
Geocoding, Directions, or live availability APIs.

## Destination data

Latitude, longitude, district, and province belong to destination records in PostgreSQL and are
returned by the catalogue API. The web map never geocodes records on page load. Records with
missing, invalid, or out-of-country coordinates remain safe but do not render a marker.

Selecting a marker opens its information card. Selecting that marker again, its title, or its
“Explore destination” action navigates client-side to `/catalogue?destination=<slug>`, where the
existing catalogue filter automatically scopes Explore results to that destination.

The six local destination photographs are a documented exception to the editorial workflow; their
source, author, and licence are recorded in
`frontend/web/public/images/destinations/ATTRIBUTIONS.md`. Other media belongs in the editorial
system with alt text and rights metadata.
