# Interactive Sri Lanka Map

The public map at `/destinations/map` is keyboard accessible and includes a complete non-map list
fallback. It intentionally uses an abstract island illustration and catalogue-derived destination
markers; it does not contain licensed geographic, weather, image, or video data.

Approved GeoJSON province and district boundaries belong in `apps/web/src/data/geo/` only after
their licence, provenance, update cadence, and accessibility review are recorded. Media belongs in
the editorial system with alt text and rights metadata. A future map adapter may add province,
district, guide, restaurant, weather, and product-type filtering without replacing the fallback.
