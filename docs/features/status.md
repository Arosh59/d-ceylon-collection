# Feature Status

Status values: **not started**, **in progress**, **complete**, or **blocked**.
A phase is complete only after its documented checks pass.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Repository and documentation baseline | Complete |
| 1 | Local PostgreSQL, Redis, and Directus | Complete |
| 2 | ASP.NET Core API and initial catalogue | Complete |
| 3 | Public Next.js foundation | Not started |
| 4 | Catalogue, destinations, search, and collection seeds | Not started |
| 5 | Authentication, authorization, and portal foundations | Not started |
| 6 | Profiles, travellers, wishlists, and saved itineraries | Not started |
| 7 | Deterministic travel planner | Not started |
| 8 | Quote workflow | Not started |
| 9 | Booking, payments, invoices, and vouchers | Not started |
| 10 | Suppliers and operations | Not started |
| 11 | Directus editorial integration | Not started |
| 12 | Accessible interactive Sri Lanka map | Not started |
| 13 | Administration application | Not started |
| 14 | AI gateway and isolated FastAPI skeleton | Not started |
| 15 | Production hardening and release readiness | Not started |

Phase 0 is marked complete only after repository structure and documentation
validation pass.

Phase 1 was verified with Compose rendering, container health checks,
least-privilege database ownership checks, Redis authentication checks, Directus
dependency health, and a persistence-preserving stop/start cycle.

Phase 2 was verified with a locked restore, dependency vulnerability audit,
formatting check, zero-warning release build, unit and database-backed
integration tests, applied migration discovery, API startup, OpenAPI document
inspection, health and readiness probes, correlation and security header checks,
and live rate-limit validation.
