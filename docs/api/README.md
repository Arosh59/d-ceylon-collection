# API Guide

The primary API is an ASP.NET Core 10 modular monolith. Phase 2 implements the
host, shared building blocks, and the initial Catalogue module.

## Contract baseline

- OpenAPI is the source for discoverable HTTP contracts.
- Frontends use a generated or strongly typed TypeScript client.
- Endpoints use request and response DTOs, never persistence entities.
- Validation occurs on the server at the request boundary.
- Errors use consistent Problem Details responses without production exception
  details.
- Potentially large results are paginated and include pagination metadata.
- Correlation IDs connect requests, logs, and audit events.
- Authorization policies enforce roles, organisations, and customer ownership.
- Payment and booking mutations require idempotency protection.

## Versioning and contracts

Version 1 routes use the `/api/v1` prefix. Phase 2 exposes read-only Catalogue
DTOs only; Entity Framework entities never cross the HTTP boundary.

Potentially large lists return:

```json
{
  "items": [],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

Invalid input, missing records, rate limits, concurrency conflicts, and
unexpected errors use `application/problem+json`. Production responses do not
return exception details.

## Cross-cutting behavior

- `X-Correlation-ID` accepts a safe caller value or generates one.
- Logs use the built-in structured JSON console provider.
- Public Catalogue endpoints use a fixed-window per-IP rate limit.
- Kestrel's server header is disabled.
- Security headers deny framing, sniffing, referrers, and active content.
- Request bodies are capped at 10 MiB at the server boundary.
- `/health/live` checks process liveness.
- `/health/ready` checks PostgreSQL through the Catalogue context.

OpenAPI is available at `/openapi/v1.json`. The Phase 3 public application
commits a reviewed snapshot at `packages/sdk/openapi/v1.json` and generates
TypeScript response types from it. While the API is running, verify that
snapshot with:

```bash
API_BASE_URL=http://127.0.0.1:8080 npm run sdk:verify
```

Refresh the snapshot only alongside a reviewed API contract change, then run
`npm run sdk:generate` and inspect the generated type diff.

## Development

See the [API application guide](../../apps/api/README.md) and
[local setup](../local-setup.md) for restore, formatting, build, test, migration,
and startup commands.

Authentication schemes and authorization policies intentionally remain deferred
to Phase 5.
