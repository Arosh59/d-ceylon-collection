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
| 9     | Booking, payments, invoices, and vouchers              | Not started |
| 10    | Suppliers and operations                               | Not started |
| 11    | Directus editorial integration                         | Not started |
| 12    | Accessible interactive Sri Lanka map                   | Not started |
| 13    | Administration application                             | Not started |
| 14    | AI gateway and isolated FastAPI skeleton               | Not started |
| 15    | Production hardening and release readiness             | Not started |

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
editor, send, revise, withdraw) verified. No booking, payment, or AI involvement in this phase.
