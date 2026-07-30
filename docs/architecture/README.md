# Architecture Overview

## Direction

The primary backend will be a modular monolith deployed as one ASP.NET Core Web API. Internal module
boundaries will separate identity, catalogue, commerce, operations, content integration, reporting,
audit, and the AI gateway so that a module can be extracted later only when operational evidence
justifies it.

The public and administrative interfaces will be separate Next.js applications. They will consume
versioned API contracts through a generated or strongly typed TypeScript client. PostgreSQL owns
transactional application data, Redis handles ephemeral and cache concerns, and Directus owns
approved editorial content.

## Planned system boundaries

- **Public web:** marketing, discovery, deterministic planning, quote requests, and customer/agent
  portal entry points.
- **Admin web:** permission-aware sales, content, finance, and operations tools.
- **Application API:** authentication integration, authorization, ownership, pricing, quotes,
  bookings, payments, operations, and audit.
- **Directus:** editorial destinations, Journal, marketing content, homepage sections, collection
  descriptions, promotions, and media metadata including alt text and rights/provenance status.
- **AI service:** isolated future service that accesses approved capabilities only through
  authenticated API tools and never connects to the database.

## Data ownership

The ASP.NET Core application database is authoritative for transactional, security, ownership,
pricing, availability, quote, booking, payment, and operations records. Directus is authoritative
only for its documented editorial content. Cross-system references must use stable IDs and explicit
integration contracts; neither system may silently duplicate authority.

## Cross-cutting requirements

- versioned APIs and Problem Details errors;
- least-privilege policy authorization and tenant/owner isolation;
- UTC timestamps, UUID identifiers, and optimistic concurrency;
- structured logs, correlation IDs, audit events, health, and readiness checks;
- no secrets or sensitive values in source or logs;
- pagination for potentially large lists;
- idempotency for payment and booking operations; and
- accessible interfaces with reduced-motion support.

Detailed diagrams, deployment topology, module contracts, and runtime decisions will be added in
their implementation phases.

## Phase 2 implementation

The API solution separates:

- `D.Ceylon.Api` — HTTP hosting and cross-cutting transport concerns;
- `D.Ceylon.BuildingBlocks` — dependency-light domain and pagination primitives; and
- `D.Ceylon.Modules.Catalogue` — Catalogue domain, DTO contracts, queries, PostgreSQL mappings, and
  migrations.

Only the Catalogue module exists as code. Planned module names are documented under
`apps/api/src/Modules/README.md`; placeholder assemblies are avoided until their implementation
phases.

Database migrations remain an explicit operational action. Readiness checks database connectivity
but application startup never changes the schema.

## Phase 3 implementation

The public web boundary uses:

- `apps/web` for the Next.js App Router host, accessible page and state components, server-only
  environment access, metadata, and request correlation;
- `packages/sdk/openapi/v1.json` as the reviewed snapshot of the versioned API contract;
- generated TypeScript response types under `packages/sdk/src/generated`; and
- a small fetch-based SDK wrapper that exposes only read-only catalogue operations.

React Server Components call the API from the server boundary. API origins never enter the browser
bundle, the web application does not access PostgreSQL or duplicate backend domain entities, and
incoming safe correlation IDs are forwarded to API calls. Catalogue routes render loading, empty,
error, not-found, and populated foundations.

## Phase 4 implementation

Catalogue discovery remains inside the explicit Catalogue module boundary. Its domain owns products,
product types, categories, collections, destinations, tags, publication state, normalized
relationships, and stable media metadata. The application query contract delegates product discovery
to `ICatalogueSearchProvider`; the only implementation is PostgreSQL full-text search, so Algolia
and Elasticsearch remain absent.

Development seeding is an explicit, environment-guarded operation. It creates deterministic Root,
Flow, Awaken, Breathe, and Rediscover collections plus representative published products and
destinations. Media records contain stable placeholder keys, alternative text, and dimensions. The
public web application maps the six seeded destination keys to local reusable source photographs
with an attribution ledger; other editorial media remains metadata-only. The browser has no direct
database access.

The public App Router pages consume only generated OpenAPI response types through the server-side
SDK. Catalogue, collection, destination, experience, accommodation, and product pages are
server-rendered and cover filtering, pagination, loading, empty, error, and not-found behavior.
Authentication and all transactional commerce boundaries remain deferred.

## Phase 5 implementation

Identity and Access and Organisations and Agents are explicit backend modules with independent
domain models, EF Core contexts, PostgreSQL schemas, migration sets, indexes, and readiness probes.
Identity and Access owns users, roles, permissions, customer ownership, and append-oriented security
audit events. Organisations and Agents owns organisations, memberships, and agent ownership. Neither
module reads another module's DbSet.

The API validates external JWT bearer access tokens against configured OIDC issuer metadata,
audience, signature, lifetime, and required claims. Its fallback policy denies anonymous access
unless a route opts out. Named customer, agent, staff, and administrator policies are supplemented
by resource-based customer and organisation ownership handlers.

The public Next.js host uses a standards-based OIDC session with secure, HTTP-only encrypted cookies
and keeps bearer tokens at the server boundary. Protected customer and agent layouts validate
session roles and then call the protected API through generated OpenAPI types, preserving
correlation IDs. Testing personas are compiled into the normal applications but are registered only
under explicit Testing runtime environments with separate test keys.

## Phase 6 implementation

Customers and Travellers is an explicit module with its own assembly, EF Core context,
`customers_travellers` PostgreSQL schema, migration set, and readiness probe. It owns customer
profile/contact preferences, traveller records, wishlist entries, and saved-itinerary metadata.
Owner IDs are stable references to Identity and Access, never cross-context navigation properties.
Every service query includes the authenticated customer owner predicate, and update/delete
operations require optimistic-concurrency tokens.

The customer portal remains server-rendered. It obtains authentication only at the server boundary,
constructs the generated customer SDK with the private access token, and uses server actions for
mutations. Validation, conflict, unauthorized, forbidden, not-found, loading, empty, and error
states are explicit. Saved itineraries are metadata records only; route generation and itinerary
building remain Phase 7.

## Phase 7 implementation

Itineraries and Travel Planning is an explicit module with its own assembly, EF Core context,
`itineraries_travel_planning` PostgreSQL schema, migration set, contracts, and readiness probe. It
owns validated planning inputs, associations to customer-owned travellers, immutable numbered
revisions, ordered days and items, rule metadata, fingerprints, and concurrency/audit values.
Customer, traveller, saved-itinerary, destination, and product references remain stable identifiers;
the module does not duplicate another module's persistence entities or reach into its DbContext.

`IDeterministicTravelPlanner` implements the fixed `dceylon-deterministic-v1` rules. Pace determines
the bounded daily item capacity, destinations rotate in requested order, and published Catalogue
candidates receive explicit preference scores with ordinal slug tie-breaking. A SHA-256 fingerprint
covers the normalized request, rule version, and ordered Catalogue snapshot. Identical complete
inputs produce identical days, items, ordering, and stable IDs; a rule, request, or Catalogue
snapshot change is visible in the metadata.

The protected customer portal keeps the bearer token at the server boundary and uses generated
OpenAPI types for planner input, review, generation, day/item editing, and reordering. Every result
is labelled as a draft. The planner does not query or claim availability, final prices, quotes,
bookability, bookings, routing feasibility, or optimization. See
[planner rules and limitations](../planner-limitations.md).
