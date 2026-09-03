# NestJS Backend

This application is the D Ceylon Collection version-one API. It replaces the ASP.NET Core runtime
while preserving the existing PostgreSQL schemas, data, UUIDs, constraints, concurrency tokens, and
`/api/v1` HTTP contract.

Copy `.env.example` to `.env`, set `DATABASE_URL` and the external OIDC values, then run:

```bash
npm run prisma:generate --workspace=@dceylon/backend
npm run dev:backend
```

The canonical OpenAPI document is `packages/sdk/openapi/v1.json`. On startup NestJS verifies that
all 59 paths and 81 operations are implemented before serving that document at `/openapi/v1.json`.

Prisma maps all 55 legacy tables. The full baseline migration can initialize an empty database; on
an existing database, record it with `./scripts/api.sh baseline-existing` before deploying later
migrations. Do not use `prisma migrate reset` or `prisma db push` on an existing environment. Future
schema changes must be committed as reviewed Prisma migrations.
