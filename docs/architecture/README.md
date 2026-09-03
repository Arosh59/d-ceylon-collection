# Architecture Overview

## Repository boundaries

- `frontend/web` is the public and authenticated customer/agent Next.js host.
- `frontend/admin` is the separately deployed administrator Next.js host.
- `backend` is the NestJS modular-monolith API.
- `packages/sdk` contains the reviewed OpenAPI contract and shared TypeScript client.
- `apps/ai-service` remains an isolated FastAPI service.
- PostgreSQL owns transactional data, Directus owns editorial content, and Redis owns ephemeral data.

The frontend hosts call only the versioned API. They do not connect directly to PostgreSQL or
duplicate backend domain decisions.

## Backend modules

```text
NestJS host
├── access and external OIDC
├── catalogue
├── customers and travellers
├── editorial / Directus
├── travel planning
├── quotes and pricing
├── bookings
├── payments
└── supplier operations
        │
        └── Prisma → existing PostgreSQL schemas
```

The backend uses the existing schema and table names. Prisma migrations are baselined against that
database; startup never applies schema changes. New migrations must be reviewed and deployed as a
separate operational step.

## Contract and security

The public contract remains backward-compatible under `/api/v1`. NestJS verifies its generated
route inventory against `packages/sdk/openapi/v1.json` before listening. Cross-cutting behavior
includes RFC 7807 responses, correlation IDs, structured JSON logs, security headers, bounded
request bodies, rate limits, liveness/readiness, external JWT validation, claim-based roles, and
customer/organisation ownership isolation.

The legacy C# source remains temporarily under `apps/api` solely for staging comparison and
rollback. It is not part of the npm workspace or the new runtime path. Remove it only after database
compatibility, staging parity, cutover, and rollback verification are complete.
