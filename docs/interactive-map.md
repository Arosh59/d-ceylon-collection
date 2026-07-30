# Interactive Sri Lanka Map

The public map at `/destinations/map` is keyboard accessible and includes a complete non-map list
fallback. Without Google Maps configured, it intentionally uses an abstract island illustration and
catalogue-derived destination markers; that fallback does not contain licensed geographic, weather,
image, or video data. When enabled, Google Maps data and terms apply to the interactive map.

## Optional Google Maps display

Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in the public web deployment to show an interactive Google Map
with pins for supported published destinations. The key is necessarily browser-visible, so it must
be restricted to the production and development site HTTP referrers. Enable only the Maps JavaScript
API for this key and keep its billing, quota, and restriction settings under the organisation's
Google Cloud account. The integration uses Google Maps' weekly channel, Sri Lanka region and English
language settings, and sends only the configured catalogue coordinates to the browser. It does not
use Places, Geocoding, Directions, or live availability services.

If the key is omitted, invalid, unavailable, or blocked by a browser policy, the page preserves its
accessible abstract map and complete destination-list fallback. No API key is committed to the
repository.

## Public artwork

`apps/web/public/images/hill-country-hero.png` is original, generated editorial artwork used only as
the public-home hero. It has no depicted people, logos, text, or third-party stock licence claim.
Product and destination-specific imagery remains owned by the editorial workflow and needs rights
metadata before publication.

Approved GeoJSON province and district boundaries belong in `apps/web/src/data/geo/` only after
their licence, provenance, update cadence, and accessibility review are recorded. The six local
destination photographs are a documented exception to the editorial workflow; their source, author,
and licence are recorded in `apps/web/public/images/destinations/ATTRIBUTIONS.md`. Other media
belongs in the editorial system with alt text and rights metadata. A future map adapter may add
province, district, guide, restaurant, weather, and product-type filtering without replacing the
fallback.
