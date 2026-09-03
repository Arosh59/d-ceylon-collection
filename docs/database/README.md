# Database Guide

PostgreSQL remains the transactional database. NestJS accesses it through Prisma while preserving
the database created by the former EF Core migration chain.

## Preserved baseline

The Prisma schema maps all 55 tables in these existing schemas:

- `catalogue`
- `identity_access`
- `organisations_agents`
- `customers_travellers`
- `itineraries_travel_planning`
- `quotes`
- `bookings`
- `payments`
- `supplier_operations`

The mapping preserves table and column names, UUID identifiers, native PostgreSQL types, primary and
foreign-key names, indexes, relations, and optimistic-concurrency columns. The baseline migration
also preserves database check constraints and the generated catalogue full-text search vector,
which Prisma cannot fully express in its schema DSL.

Verify the generated mapping and migration coverage with:

```bash
npm run prisma:baseline:verify
npm run prisma:migration:verify
npm run prisma:validate
```

## Existing databases

Do not execute the full baseline SQL against an existing D Ceylon database. Record it as already
applied once, then deploy only later migrations:

```bash
./scripts/api.sh baseline-existing
./scripts/api.sh migrations-list
./scripts/api.sh migrate
```

`baseline-existing` only adds Prisma migration-history metadata; it does not recreate schemas or
modify application data. Take the normal database backup before the production cutover and verify
the target is the expected database before running it.

## New empty databases

For a new local or isolated test database, `./scripts/api.sh migrate` applies the complete baseline
and creates all preserved schemas and constraints. API startup never applies migrations
automatically.

## Future schema changes

After the baseline has been recorded, create and review changes with:

```bash
./scripts/api.sh migration-add descriptive_change_name
./scripts/api.sh migrations-check
```

Commit both the Prisma schema and generated migration. Review SQL before applying it, especially
changes involving check constraints or PostgreSQL generated/full-text columns. Never run
`prisma migrate reset` or `prisma db push` against an existing environment.

Integration tests use `DATABASE_URL` and never apply a destructive reset. Point them only at an
isolated database created from the baseline.
