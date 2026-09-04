# API Guide

The primary API is the NestJS application in `backend`. It preserves the reviewed version-one
contract at `/api/v1` and publishes that contract at `/openapi/v1.json`.

## Runtime boundaries

- NestJS owns HTTP routing, validation, authentication, authorization, rate limiting, logging,
  correlation IDs, security headers, health checks, and Problem Details responses.
- Prisma supplies PostgreSQL connectivity and parameterized typed queries. It connects to the
  existing multi-schema database and does not recreate or erase application data.
- The external OIDC provider remains the identity authority.
- NestJS and PostgreSQL own editorial content through the `editorial` schema.
- `packages/sdk/openapi/v1.json` is the reviewed public contract consumed by both Next.js hosts.

The backend contains modules for access, catalogue, customers and travellers, editorial content,
travel planning, quotes, bookings, payments, and supplier operations. Owner and organisation IDs
come from validated claims rather than request bodies.

## Commands

```bash
npm run typecheck:backend
npm run lint:backend
npm run test:backend
npm run build:backend
./scripts/api.sh run
```

Verify the baseline with `npm run prisma:baseline:verify`, `npm run prisma:migration:verify`, and
`npm run prisma:validate`. Record the baseline on an existing database with
`./scripts/api.sh baseline-existing`, then apply reviewed future migrations with
`./scripts/api.sh migrate`. Never run `prisma migrate reset` against an existing D Ceylon database.

## Contract compatibility

At startup the Nest application generates a route document and checks every canonical path,
HTTP method, operation ID, and success status. The canonical reviewed document is then served
unchanged so the existing SDK remains backward-compatible. The Jest contract test independently
verifies all 60 paths and 82 operations.

Use `API_BASE_URL=http://127.0.0.1:8080 npm run sdk:verify` against a running backend. Refresh and
regenerate the SDK only for an explicitly reviewed contract change.

## Health and errors

- `GET /health/live` checks process liveness.
- `GET /health/ready` verifies PostgreSQL connectivity.
- Errors use `application/problem+json` and include the request correlation ID.
- Request bodies are capped at 10 MiB.
- Public and testing-authentication routes have separate rate limits.

See [authentication](../authentication.md), [local setup](../local-setup.md), and the
[backend README](../../backend/README.md).
