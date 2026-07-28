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

## Phase 2 application schema

The initial EF Core migration creates a dedicated `catalogue` schema containing:

- product types and products;
- categories, travel collections, and destinations; and
- normalized product-category, product-collection, and product-destination
  relations.

The model includes UUID keys, UTC audit fields, explicit concurrency tokens,
foreign keys, check constraints, unique slugs, and indexes for names,
publication state, relationships, and update dates.

Apply and inspect migrations with:

```bash
./scripts/api.sh migrations-list
./scripts/api.sh migrate
```

API startup does not apply migrations automatically. Integration tests create
and destroy an isolated PostgreSQL database and run the real migration against
it.

## Phase 4 catalogue discovery schema

Migration `20260728040227_Phase4CatalogueDiscovery` adds:

- product descriptions and an English generated `search_vector`;
- a GIN full-text index plus publication/name and relationship indexes;
- publication state, descriptions, and hero-media references for collections
  and destinations;
- tag and media-asset tables; and
- normalized product-tag and ordered product-media relationships.

Media assets store metadata and stable `placeholder:*` keys only. Apply the
schema and deterministic Development-only catalogue data explicitly:

```bash
./scripts/api.sh migrate
./scripts/api.sh seed
./scripts/api.sh migrations-check
```

The seeder is idempotent and uses fixed identifiers. It creates five
collections, six destinations, three product types, five categories, five tags,
and ten published products. It never runs during normal API startup.

## Phase 6 customer records schema

Migration `20260728054220_AddCustomerRecords` creates the `customers_travellers` schema with:

- one profile/contact-preference record per customer;
- owner-scoped traveller records with optional, bounded accessibility, dietary, and
  emergency-contact fields;
- owner/product-unique wishlist entries; and
- owner-scoped saved-itinerary metadata with a travel-date check constraint.

Owner/list, name, destination, created/updated, contact, and uniqueness indexes support protected
queries. All mutable records carry UUID concurrency tokens and UTC audit timestamps. The schema does
not store passport documents, generated plans, quotes, bookings, or payments.
