# Feature Status

Status values: **not started**, **in progress**, **complete**, or **blocked**. A phase is complete
only after its documented checks pass.

| Phase | Scope                                                  | Status      |
| ----- | ------------------------------------------------------ | ----------- |
| 0     | Repository and documentation baseline                  | Complete    |
| 1     | Local PostgreSQL, Redis, and Directus                  | Complete    |
| 2     | ASP.NET Core API and initial catalogue                 | Complete    |
| 3     | Public Next.js foundation                              | Complete    |
| 4     | Catalogue, destinations, search, and collection seeds  | Complete    |
| 5     | Authentication, authorization, and portal foundations  | Complete    |
| 6     | Profiles, travellers, wishlists, and saved itineraries | Complete    |
| 7     | Deterministic travel planner                           | Complete    |
| 8     | Quote workflow                                         | Complete    |
| 9     | Booking, payments, invoices, and vouchers              | Complete    |
| 10    | Suppliers and operations                               | In progress |
| 11    | Directus editorial integration                         | In progress |
| 12    | Accessible interactive Sri Lanka map                   | In progress |
| 13    | Administration application                             | In progress |
| 14    | AI gateway and isolated FastAPI skeleton               | In progress |
| 15    | Production hardening and release readiness             | In progress |

Phase 0 is marked complete only after repository structure and documentation validation pass.

Phase 1 was verified with Compose rendering, container health checks, least-privilege database
ownership checks, Redis authentication checks, Directus dependency health, and a
persistence-preserving stop/start cycle.

Phase 2 was verified with a locked restore, dependency vulnerability audit, formatting check,
zero-warning release build, unit and database-backed integration tests, applied migration discovery,
API startup, OpenAPI document inspection, health and readiness probes, correlation and security
header checks, and live rate-limit validation.

Phase 3 was verified with a clean npm lockfile install, zero-advisory dependency audit,
deterministic OpenAPI SDK generation, formatting, strict application and test type checks,
zero-warning linting, unit and component tests, automated accessibility tests, production build and
startup, live API contract and connectivity checks, correlation and security header checks, and
desktop and mobile browser smoke tests.

Phase 4 was verified with locked NuGet and npm installs, zero-advisory dependency audits,
zero-warning backend and frontend builds, backend unit and PostgreSQL integration tests, reviewed
migration application, no-pending-model validation, GIN and relationship index checks, deterministic
idempotent development seeding, live full-text search/filter/pagination checks, OpenAPI snapshot
regeneration and equality, health/readiness probes, frontend unit/component/accessibility tests,
production startup, and desktop/mobile browser checks covering populated, loading, empty, error,
not-found, list, and detail foundations.

Phase 5 was verified with locked NuGet and npm installs, zero-advisory dependency audits, reviewed
Identity and Access and Organisations and Agents migrations, no-pending-model checks, index
inspection, zero-warning API and web builds, backend unit and PostgreSQL integration tests,
deterministic isolated authentication fixtures, missing/invalid/expired token checks, role and
ownership denial tests, audit-event checks, OpenAPI regeneration and equality, health/readiness
probes, security headers, authentication rate limiting, frontend unit/component/accessibility tests,
and signed-out, customer, agent, forbidden, and logout browser flows on desktop and mobile.

Phase 6 was verified with locked NuGet and npm installs, zero-advisory dependency audits, a reviewed
Customers and Travellers migration, no-pending-model checks, index inspection, zero-warning API and
web builds, backend unit and isolated PostgreSQL integration tests, customer-ownership and
cross-customer denial checks, optimistic-concurrency and audit-event checks, OpenAPI regeneration
and equality, health/readiness probes, frontend unit/component/accessibility tests, and
profile/traveller/wishlist/saved-itinerary validation, conflict, forbidden, not-found, logout, and
responsive browser flows on desktop and mobile.

Phase 7 was verified with locked NuGet and npm restores, zero-advisory dependency audits, a reviewed
Itineraries and Travel Planning migration, no-pending-model and index checks, zero-warning API and
web builds, deterministic rule/fingerprint fixtures, backend unit and isolated PostgreSQL
integration tests, owner and cross-customer denial checks, traveller association, ordering,
optimistic-concurrency, and audit checks, live OpenAPI regeneration and equality, health/readiness
probes, frontend unit/component/accessibility tests, and planner generation, draft review, edit,
validation, forbidden, not-found, logout, and responsive browser flows on desktop and mobile.

Phase 8 was verified with locked NuGet and npm restores, zero-advisory dependency audits, a
reviewed Quotes and Pricing migration (AddQuoteWorkflow), no-pending-model checks, zero-warning
API and web builds, 9 deterministic Pricing unit tests, 12 Quote lifecycle integration tests
covering request, prepare, draft CRUD, send (immutable version), accept, decline, withdraw,
revise, conflict, ownership denial, and concurrency checks; OpenAPI spec updated with full quote
schema (including the previously missing AgentQuoteQueueResponse.concurrencyToken), SDK
regenerated, TypeScript type check and ESLint pass with zero warnings, Prettier formatting clean,
and customer/agent portal quote pages (list, detail, request, accept, decline, prepare, draft
editor, send, revise, withdraw) verified. The acceptance harness seeds deterministic test
organisations and the responsive browser suite covers customer request, agent claim/draft/send,
customer acceptance, both portal-forbidden paths, and logout. No booking, payment, or AI involvement
in this phase.

Phase 9 was verified with locked restores, zero-warning API build, 63 backend unit tests and 28
isolated PostgreSQL integration tests, reviewed `AddBookingWorkflow` and `AddPaymentWorkflow`
migrations, no-pending-model and index checks, live OpenAPI regeneration/equality, readiness checks,
and a zero-vulnerability production npm audit. The generated SDK, strict TypeScript check, lint,
41 frontend unit/component tests, 20 accessibility tests, production build, and authenticated
desktop/mobile browser flows passed. Customer flows cover accepted immutable quote to booking and
server-priced idempotent payment instruction; agent views are organisation-scoped. Supplier
operations, payment capture, card storage, live availability, and administration remain excluded.

Phase 10 is in progress. Its initial supplier and booking-operations boundary has a reviewed
`InitialSupplierOperations` migration, a staff-only versioned API, stable Booking contract lookup,
auditing, readiness coverage, generated SDK types, and a protected server-side operations portal.
The current verification includes locked NuGet restore, clean NuGet/npm audits, zero-warning API
build, 63 unit tests, 30 isolated PostgreSQL integration tests, no-pending-model checks, local
migration application, OpenAPI equality, strict TypeScript, lint, 42 frontend tests, and a
production web build. Supplier self-service, administration, Directus, live availability, and
payment capture are explicitly excluded.

Phases 11–15 now have verified implementation foundations: a configuration-driven, read-only
Directus Editorial module with Journal and promotion contracts; an accessible abstract destination
map with a complete non-map fallback; a separately hosted, administrator-only Next.js application;
an isolated FastAPI draft gateway that rejects database configuration and has no commercial write
tools; and locked-install CI, Dependabot, Azure-compatible managed-environment baseline, and a
release checklist. They remain in progress until external Directus schema/roles, approved GeoJSON
and media, administrator role provisioning, backend-to-AI gateway deployment, payment/supplier
certification, Azure/Key Vault configuration, performance testing, backup/restore exercise, and
formal security/release approval are complete.
