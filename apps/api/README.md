# D Ceylon Collection API

The primary backend is an ASP.NET Core 10 modular monolith. Phase 2 implements
the API host, shared building blocks, and the initial Catalogue module only.

## Toolchain

- .NET SDK `10.0.302`
- .NET and ASP.NET Core runtime `10.0.10` LTS
- Entity Framework Core `10.0.10`
- Npgsql Entity Framework Core provider `10.0.3`
- Microsoft ASP.NET Core OpenAPI `10.0.10`
- Microsoft.OpenApi `2.11.0`
- xUnit v3 MTP v2 `3.2.2`
- dotnet-ef `10.0.10`

The SDK is pinned in the root `global.json`. Developers without a matching host
SDK can use `scripts/api.sh`, which runs the official SDK container and mounts
named caches for NuGet packages and local .NET tools.

`Microsoft.OpenApi` is centrally pinned above the vulnerable versions affected
by `GHSA-v5pm-xwqc-g5wc`. NuGet auditing is configured at `moderate` severity
for all direct and transitive dependencies.

## Structure

```text
apps/api/
├── D.Ceylon.Collection.slnx
├── Directory.Build.props
├── Directory.Packages.props
├── NuGet.config
├── src/
│   ├── BuildingBlocks/D.Ceylon.BuildingBlocks/
│   ├── D.Ceylon.Api/
│   └── Modules/Catalogue/D.Ceylon.Modules.Catalogue/
└── tests/
    ├── D.Ceylon.Api.UnitTests/
    └── D.Ceylon.Api.IntegrationTests/
```

Later modules are listed in `src/Modules/README.md` and will be created in their
assigned implementation phases.

## Commands

Start Phase 1 infrastructure first:

```bash
./scripts/local-infrastructure.sh up
```

Then:

```bash
./scripts/api.sh restore
./scripts/api.sh restore-locked
./scripts/api.sh audit
./scripts/api.sh format-check
./scripts/api.sh build
./scripts/api.sh test
./scripts/api.sh migrations-list
./scripts/api.sh migrate
./scripts/api.sh run
```

The API runs at <http://127.0.0.1:8080> by default. Stop the foreground process
with `Ctrl+C`.

The helper builds connection strings from the ignored root `.env` and passes
them directly to the ephemeral SDK container. It does not install .NET or store
credentials in project configuration.

## HTTP endpoints

- `GET /health/live` — process liveness
- `GET /health/ready` — PostgreSQL readiness
- `GET /openapi/v1.json` — OpenAPI document
- `GET /api/v1/catalogue/products` — published product page
- `GET /api/v1/catalogue/products/{slug}` — published product detail
- `GET /api/v1/catalogue/product-types` — product-type page

List endpoints accept optional `pageNumber` and `pageSize` parameters. Page
numbers range from 1 to 100,000 and page sizes from 1 to 100.

All responses include `X-Correlation-ID`, API security headers, and no Kestrel
server header. Invalid input, missing resources, rate limits, concurrency
conflicts, and unexpected errors use Problem Details.

## Database

The initial migration creates the `catalogue` schema with product types,
products, categories, travel collections, destinations, and their product join
tables. Important entities use UUID keys, UTC audit timestamps, and optimistic
concurrency tokens.

Migrations are explicit; API startup never changes the database automatically.
Create a future migration with:

```bash
./scripts/api.sh migration-add MigrationName
```

Review generated SQL and model changes before applying it.

## Tests

Unit tests exercise domain and pagination invariants. Integration tests create a
random temporary PostgreSQL database owned by the least-privilege application
role, apply the real migration, start the API through
`WebApplicationFactory`, and drop the database afterward.
