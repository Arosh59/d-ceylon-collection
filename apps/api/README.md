# D Ceylon Collection API

The primary backend is an ASP.NET Core 10 modular monolith. Phases 2 through 7 implement the API
host, Catalogue discovery, external authentication, authorization policy foundations, and the
Identity and Access, Organisations and Agents, Customers and Travellers, and Itineraries and Travel
Planning module boundaries.

## Toolchain

- .NET SDK `10.0.302`
- .NET and ASP.NET Core runtime `10.0.10` LTS
- Entity Framework Core `10.0.10`
- Microsoft ASP.NET Core JWT Bearer `10.0.10`
- Npgsql Entity Framework Core provider `10.0.3`
- Microsoft ASP.NET Core OpenAPI `10.0.10`
- Microsoft.OpenApi `2.11.0`
- xUnit v3 MTP v2 `3.2.2`
- dotnet-ef `10.0.10`

The SDK is pinned in the root `global.json`. Developers without a matching host SDK can use
`scripts/api.sh`, which runs the official SDK container and mounts named caches for NuGet packages
and local .NET tools.

`Microsoft.OpenApi` is centrally pinned above the vulnerable versions affected by
`GHSA-v5pm-xwqc-g5wc`. NuGet auditing is configured at `moderate` severity for all direct and
transitive dependencies.

## Structure

```text
apps/api/
├── D.Ceylon.Collection.slnx
├── Directory.Build.props
├── Directory.Packages.props
├── NuGet.config
├── src/
│   ├── BuildingBlocks/D.Ceylon.BuildingBlocks/
│   ├── D.Ceylon.Api/
│   └── Modules/
│       ├── Catalogue/D.Ceylon.Modules.Catalogue/
│       ├── CustomersTravellers/D.Ceylon.Modules.CustomersTravellers/
│       ├── IdentityAccess/D.Ceylon.Modules.IdentityAccess/
│       ├── ItinerariesTravelPlanning/D.Ceylon.Modules.ItinerariesTravelPlanning/
│       └── OrganisationsAgents/D.Ceylon.Modules.OrganisationsAgents/
└── tests/
    ├── D.Ceylon.Api.UnitTests/
    └── D.Ceylon.Api.IntegrationTests/
```

Later modules are listed in `src/Modules/README.md` and are created only in their assigned
implementation phases.

## Commands

Start Phase 1 infrastructure first:

```bash
./scripts/local-infrastructure.sh up
```

Then:

```bash
./scripts/api.sh restore
./scripts/api.sh restore-locked
./scripts/api.sh audit
./scripts/api.sh format-check
./scripts/api.sh build
./scripts/api.sh test
./scripts/api.sh migrations-list
./scripts/api.sh migrations-check
./scripts/api.sh migrate
./scripts/api.sh seed
./scripts/api.sh run
```

The API runs at <http://127.0.0.1:8080> by default. Stop the foreground process with `Ctrl+C`.

The helper builds connection strings from the ignored root `.env` and passes them directly to the
ephemeral SDK container. It does not install .NET or store credentials in project configuration.

## HTTP endpoints

- `GET /health/live` — process liveness
- `GET /health/ready` — PostgreSQL readiness
- `GET /openapi/v1.json` — OpenAPI document
- `GET /api/v1/catalogue/products` — published product page
- `GET /api/v1/catalogue/products/{slug}` — published product detail
- `GET /api/v1/catalogue/product-types` — product-type page
- `GET /api/v1/catalogue/categories` — category page
- `GET /api/v1/catalogue/tags` — tag page
- `GET /api/v1/catalogue/collections` and `/{slug}` — published collections
- `GET /api/v1/catalogue/destinations` and `/{slug}` — published destinations
- `GET /api/v1/access/me` — validated current access DTO
- `GET /api/v1/access/customer/{customerId}` — customer policy and ownership
- `GET /api/v1/access/agent/{organisationId}` — agent organisation boundary
- `GET /api/v1/access/staff` and `/administrator` — privileged policy probes
- `/api/v1/customer/profile` — customer-owned profile CRUD
- `/api/v1/customer/travellers` and `/{travellerId}` — paginated traveller CRUD
- `/api/v1/customer/wishlist` and `/{entryId}` — paginated wishlist CRUD
- `/api/v1/customer/saved-itineraries` and `/{itineraryId}` — paginated saved-metadata CRUD
- `/api/v1/customer/travel-plans` and `/{planId}` — paginated plan creation, review, and detail
- `PUT /api/v1/customer/travel-plans/{planId}/input` — validated planner-input editing
- `POST /api/v1/customer/travel-plans/{planId}/generate` — explicit deterministic regeneration
- travel-plan day/item `PUT`, `POST`, and reorder routes — concurrency-protected draft editing

List endpoints accept optional `pageNumber` and `pageSize` parameters. Page numbers range from 1 to
100,000 and page sizes from 1 to 100.

Product lists additionally accept validated full-text `query`, product type, category, collection,
destination, tag, price, duration, and sort filters. PostgreSQL generated `tsvector` search is
hidden behind an explicit search provider interface.

All responses include `X-Correlation-ID`, API security headers, and no Kestrel server header.
Invalid input, missing resources, authentication/authorization failures, rate limits, concurrency
conflicts, and unexpected errors use Problem Details. Access is denied by default; public
operational and Catalogue routes are explicitly anonymous.

## Database

The migrations create the `catalogue` schema with product types, products, categories, travel
collections, destinations, tags, media metadata, normalized product relationships, and a GIN-indexed
search vector. Important entities use UUID keys, UTC audit timestamps, and optimistic concurrency
tokens.

Phase 5 adds the `identity_access` schema for users, roles, permissions, user-role and
role-permission grants, customer ownership, and security audit events. The `organisations_agents`
schema owns organisations, memberships, and agent records. Both migration sets include ownership,
lookup, active-state, and audit indexes.

Phase 6 adds the `customers_travellers` schema. It owns profile/contact preferences, traveller
details, wishlist entries, and saved-itinerary metadata. Every table carries a customer ownership
key and concurrency/audit values; indexes support owner-scoped lists and uniqueness. Accessibility,
dietary, and emergency-contact values are optional and deliberately bounded. Passport documents,
quotes, bookings, and generated itinerary content are absent.

Phase 7 adds the `itineraries_travel_planning` schema. It owns claim-scoped planner inputs,
traveller associations, versioned revisions, ordered days and items, deterministic rule/fingerprint
metadata, and optimistic concurrency/audit values. Stable Catalogue references are resolved through
the Catalogue contract rather than duplicated entities. The planner contains no availability,
pricing, quote, booking, payment, AI, or optimization persistence.

Migrations are explicit; API startup never changes the database automatically. Create a future
migration with:

```bash
./scripts/api.sh migration-add MigrationName
./scripts/api.sh migration-add-identity MigrationName
./scripts/api.sh migration-add-organisations MigrationName
./scripts/api.sh migration-add-customers MigrationName
./scripts/api.sh migration-add-itineraries MigrationName
```

Review generated SQL and model changes before applying it.

`./scripts/api.sh seed` is guarded to Development and inserts deterministic, idempotent placeholder
catalogue data. It does not apply migrations and never runs as part of ordinary startup.

## Tests

Unit tests exercise domain, pagination, claims mapping, configuration guards, and ownership
invariants. Integration tests create a random temporary PostgreSQL database owned by the
least-privilege application role, apply the real migration, start the API through
`WebApplicationFactory`, and drop the database afterward. Authentication tests use an HMAC issuer
registered only in the Testing environment and cover missing/invalid/expired tokens, policies,
cross-owner denial, indexes, and audit records. Phase 6 tests also cover validation, customer-scoped
CRUD, pagination, stale-write conflicts, sensitive-change audit events, and migration indexes. Phase
7 tests add deterministic repeatability and Catalogue-snapshot fingerprints, rule/pace behavior,
planner validation, traveller ownership, cross-owner denial, day/item ordering, stale-write
conflicts, audit events, and planning indexes.
