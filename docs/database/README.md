# Database Guide

PostgreSQL will be the primary transactional database and Entity Framework Core
migrations will be the only supported schema-change mechanism.

## Modelling baseline

- UUID primary identifiers
- UTC timestamps
- created and updated metadata on important records
- optimistic concurrency fields where updates can conflict
- explicit foreign keys and ownership boundaries
- indexes for slugs, foreign keys, status, publication state, dates, search
  fields, customer ownership, and organisation ownership
- parameterized access through Entity Framework Core

Production schemas must never be changed manually. Migration creation,
application, rollback, seed, backup, and restore commands will be added as the
corresponding infrastructure and API phases are implemented.

## Local Phase 1 databases

The local PostgreSQL container initializes two separately owned databases:

- `POSTGRES_APP_DB`, reserved for the future ASP.NET Core application; and
- `DIRECTUS_DB`, owned by the dedicated Directus database role.

The initialization script runs only when the named PostgreSQL volume is empty.
Changing database names or credentials in `.env` does not mutate an existing
volume. Follow the guarded reset procedure in the
[local infrastructure guide](../../infrastructure/docker/README.md) when a
fresh local database is intentionally required.
