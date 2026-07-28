# Architecture Overview

## Direction

The primary backend will be a modular monolith deployed as one ASP.NET Core Web
API. Internal module boundaries will separate identity, catalogue, commerce,
operations, content integration, reporting, audit, and the AI gateway so that a
module can be extracted later only when operational evidence justifies it.

The public and administrative interfaces will be separate Next.js applications.
They will consume versioned API contracts through a generated or strongly typed
TypeScript client. PostgreSQL owns transactional application data, Redis handles
ephemeral and cache concerns, and Directus owns approved editorial content.

## Planned system boundaries

- **Public web:** marketing, discovery, deterministic planning, quote requests,
  and customer/agent portal entry points.
- **Admin web:** permission-aware sales, content, finance, and operations tools.
- **Application API:** authentication integration, authorization, ownership,
  pricing, quotes, bookings, payments, operations, and audit.
- **Directus:** editorial destinations, Journal, marketing content, homepage
  sections, collection descriptions, promotions, and media metadata.
- **AI service:** isolated future service that accesses approved capabilities
  only through authenticated API tools and never connects to the database.

## Data ownership

The ASP.NET Core application database is authoritative for transactional,
security, ownership, pricing, availability, quote, booking, payment, and
operations records. Directus is authoritative only for its documented editorial
content. Cross-system references must use stable IDs and explicit integration
contracts; neither system may silently duplicate authority.

## Cross-cutting requirements

- versioned APIs and Problem Details errors;
- least-privilege policy authorization and tenant/owner isolation;
- UTC timestamps, UUID identifiers, and optimistic concurrency;
- structured logs, correlation IDs, audit events, health, and readiness checks;
- no secrets or sensitive values in source or logs;
- pagination for potentially large lists;
- idempotency for payment and booking operations; and
- accessible interfaces with reduced-motion support.

Detailed diagrams, deployment topology, module contracts, and runtime decisions
will be added in their implementation phases.

## Phase 2 implementation

The API solution separates:

- `D.Ceylon.Api` — HTTP hosting and cross-cutting transport concerns;
- `D.Ceylon.BuildingBlocks` — dependency-light domain and pagination
  primitives; and
- `D.Ceylon.Modules.Catalogue` — Catalogue domain, DTO contracts, queries,
  PostgreSQL mappings, and migrations.

Only the Catalogue module exists as code. Planned module names are documented
under `apps/api/src/Modules/README.md`; placeholder assemblies are avoided until
their implementation phases.

Database migrations remain an explicit operational action. Readiness checks
database connectivity but application startup never changes the schema.

## Phase 3 implementation

The public web boundary uses:

- `apps/web` for the Next.js App Router host, accessible page and state
  components, server-only environment access, metadata, and request correlation;
- `packages/sdk/openapi/v1.json` as the reviewed snapshot of the versioned API
  contract;
- generated TypeScript response types under `packages/sdk/src/generated`; and
- a small fetch-based SDK wrapper that exposes only read-only catalogue
  operations.

React Server Components call the API from the server boundary. API origins never
enter the browser bundle, the web application does not access PostgreSQL or
duplicate backend domain entities, and incoming safe correlation IDs are
forwarded to API calls. Catalogue routes render loading, empty, error, not-found,
and populated foundations; Phase 4 owns catalogue data and search behavior.
