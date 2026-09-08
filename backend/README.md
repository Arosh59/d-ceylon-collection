# NestJS Backend

This application is the D Ceylon Collection version-one API. It replaces the ASP.NET Core runtime
while preserving the existing PostgreSQL schemas, data, UUIDs, constraints, concurrency tokens, and
`/api/v1` HTTP contract.

For local development from the repository root, generate `.env`, start PostgreSQL, and run:

```bash
npm run prisma:generate --workspace=@dceylon/backend
npm run dev:backend
```

The root command loads `.env` and derives `DATABASE_URL` from its generated PostgreSQL application
credentials. When running the backend workspace directly, copy `.env.example` to `backend/.env` and
set `DATABASE_URL` explicitly. The API now verifies database configuration and connectivity before
it reports a successful startup.

The canonical OpenAPI document is `packages/sdk/openapi/v1.json`. On startup NestJS verifies that
all 60 paths and 82 operations are implemented before serving that document at `/openapi/v1.json`.

Prisma maps all 55 legacy tables and the NestJS-owned editorial tables. The full baseline migration
can initialize an empty database; on an existing database, record it with
`./scripts/api.sh baseline-existing` before deploying later migrations. Do not use
`prisma migrate reset` or `prisma db push` on an existing environment. Future schema changes must be
committed as reviewed Prisma migrations.
