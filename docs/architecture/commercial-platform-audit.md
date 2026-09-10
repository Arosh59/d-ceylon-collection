# Commercial Platform Architecture Audit

This audit records the repository state reviewed before extending D Ceylon's commercial travel flow.
It is an implementation map, not a proposal to replace the existing architecture.

## Runtime map

```text
Browser
├── public/customer/agent Next.js host (`frontend/web`)
└── administrator Next.js host (`frontend/admin`)
        │ same-origin BFF routes and HTTP-only session cookies
        ▼
NestJS modular monolith (`backend`, `/api/v1`)
├── authentication + database-backed roles/permissions
├── catalogue + editorial
├── customer profiles, travellers, wishlists and saved itineraries
├── deterministic travel planning and versioned quotes
├── bookings, invoices, vouchers and provider-neutral payments
├── availability and sellable inventory
└── supplier operations
        │ Prisma and parameterized SQL
        ▼
PostgreSQL multi-schema application database

Optional boundaries: Redis for ephemeral state, SMTP for email, Firebase only as the Google
identity verifier, Google Maps in the existing browser adapter, and an isolated FastAPI/Gemini
draft service with no commercial write access.
```

## Repository findings

| Concern           | Existing implementation and decision                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace         | npm workspaces on Node 24/npm 11; `backend`, both Next.js hosts, and `packages/sdk` remain the deployment boundaries.                                                                                                                       |
| Frontends         | Next.js 16, React 19 and TypeScript. Existing routes, tokens, typography, cards, navigation and responsive conventions are retained.                                                                                                        |
| Backend           | NestJS 11 modular monolith. Commercial work extends modules under `backend/src/modules`; no new service topology is introduced.                                                                                                             |
| Database          | PostgreSQL 18 locally with the existing multi-schema layout. Prisma 6 maps the existing schema; additive reviewed migrations are required.                                                                                                  |
| Authentication    | NestJS issues application access/refresh sessions. Password login and Firebase-verified Google login converge on the same local account and role model. The browser stores application tokens in HTTP-only BFF cookies.                     |
| Authorization     | Global bearer-token guard, controller role metadata, database roles/permissions, customer ownership predicates, and organisation scoping. Administrator availability writes use the existing administrator role and security audit service. |
| Existing roles    | Customer, agent, staff, and administrator paths already exist. Commercial endpoints must derive ownership from validated claims.                                                                                                            |
| API               | Versioned REST under `/api/v1`, RFC 7807 errors, correlation IDs, rate limiting, OpenAPI, and a shared TypeScript SDK. New routes follow these conventions.                                                                                 |
| Catalogue         | Products, product types, categories, tags, collections, destinations and media relations already provide the discovery foundation. Product detail was extended instead of duplicated.                                                       |
| Customer features | Profiles, travellers, wishlists, saved itineraries, travel plans, quote requests and My Trips pages already exist.                                                                                                                          |
| Booking           | Accepted immutable quote versions create owner-scoped bookings with line and price snapshots, invoices and voucher foundations. Direct catalogue checkout is not yet connected to those records.                                            |
| Payments          | Server-owned amount/currency, idempotent payment instructions, transactions and refund models exist. There is no certified live gateway capture/webhook implementation, so the application must not claim payment success.                  |
| Maps              | Existing Google Maps browser configuration and accessible list fallback remain unchanged. No credential or provider changes are required for availability.                                                                                  |
| Storage/media     | Catalogue stores licensed media metadata/asset keys. No general binary upload pipeline exists; this work does not invent one.                                                                                                               |
| Email             | Existing Nodemailer/SMTP infrastructure currently supports authentication mail. Commercial notification outbox/templates remain a subsequent P0 task.                                                                                       |
| AI                | The separate FastAPI/Gemini boundary produces constrained catalogue-based drafts only and cannot write bookings or payments.                                                                                                                |
| Deployment        | Existing Docker, Compose, Dokploy-oriented configuration and Azure baseline are preserved. Migrations are an explicit release step, never application startup behavior.                                                                     |
| Verification      | Jest backend tests; Vitest/Testing Library/axe web tests; Vitest admin tests; Playwright smoke coverage; strict TypeScript, ESLint, Prettier, builds, Prisma validation and migration checks.                                               |

## Commercial gap map

| Capability                  | Audit state               | Current action                                                                                                                                                         |
| --------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking-ready product facts | Partial                   | Added a relational booking profile and exposed it with catalogue product detail. Further editorial fields can be added without widening the core product row.          |
| Experience availability     | Missing                   | Added explicit UTC departures, capacity, reservation count, cutoff, price override and open/closed state with server-side queries.                                     |
| Stay availability           | Missing                   | Added room types plus date-level inventory and price overrides; public search validates every requested night.                                                         |
| Admin inventory             | Missing                   | Added administrator-only, audited profile/slot/room/night editors with concurrency tokens and reservation floor checks.                                                |
| Public availability UX      | Placeholder               | Replaced the placeholder with accessible product-type-aware date, traveller, room and result states through a same-origin BFF.                                         |
| Inventory reservation       | Missing                   | Still required before enabling direct checkout. Read availability alone does not reserve capacity; atomic holds and expiry/release rules must precede public purchase. |
| Direct cart/checkout        | Missing                   | Existing quote-to-booking flow remains protected and unchanged. Build on it only after atomic inventory holds are implemented.                                         |
| Live payment                | External dependency       | Preserve the provider-neutral boundary. Gateway selection, credentials, signed webhook contract and certification are required before capture can be enabled.          |
| Confirmation/vouchers       | Foundation only           | Existing invoice/voucher models and My Trips views can be completed after verified payment events; no fake PDF, QR, or confirmation is emitted.                        |
| Notifications               | Authentication email only | Add a durable idempotent notification outbox after booking/payment state transitions are finalized.                                                                    |
| Reviews                     | Missing                   | P1 after the core confirmed-booking lifecycle; eligibility must be owner- and completed-booking-scoped.                                                                |

## Safety decisions

- The availability migration is additive and does not seed, rewrite, drop, truncate, or rename
  existing records.
- Prices and capacity are read from PostgreSQL by NestJS; browser-supplied totals or availability
  are never authoritative.
- Existing auth, maps, environment variable names, API routes, deployment files, visual identity,
  and quote booking workflow remain in place.
- Direct booking remains unavailable until inventory can be atomically held and a configured payment
  provider can be verified server-side. This is deliberate fail-closed behavior, not a placeholder
  success path.

## Next implementation boundary

The next P0 tranche is an expiring inventory-hold transaction connected to an authenticated checkout
draft. It must lock the selected departure or every stay night, reprice on the server, reject stale
selection, release on expiry/cancellation/failure, and convert exactly once after a verified payment
event. Only then should the public availability CTA advance from trip planning to checkout.
