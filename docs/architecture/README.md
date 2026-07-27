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
