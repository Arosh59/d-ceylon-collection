# API Guide

The primary API is an ASP.NET Core 10 modular monolith. Phases 2 through 8 implement the host,
Catalogue discovery, external JWT bearer validation, authorization policies, and ownership module
and deterministic travel-planning foundations.

## Contract baseline

- OpenAPI is the source for discoverable HTTP contracts.
- Frontends use a generated or strongly typed TypeScript client.
- Endpoints use request and response DTOs, never persistence entities.
- Validation occurs on the server at the request boundary.
- Errors use consistent Problem Details responses without production exception details.
- Potentially large results are paginated and include pagination metadata.
- Correlation IDs connect requests, logs, and audit events.
- Authorization policies enforce roles, organisations, and customer ownership.
- Payment and booking mutations require idempotency protection.

## Versioning and contracts

Version 1 routes use the `/api/v1` prefix. Catalogue and customer APIs expose DTOs only; Entity
Framework entities never cross the HTTP boundary.

Phase 4 discovery routes cover products, product types, categories, tags, collections, and
destinations. Product discovery accepts validated `query`, `productType`, `category`, `collection`,
`destination`, `tag`, price/duration range, sort, and pagination parameters. Text search uses the
module's `ICatalogueSearchProvider` abstraction with a PostgreSQL `tsvector` and GIN-indexed
implementation. External search services are not configured.

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

Invalid input, missing records, rate limits, concurrency conflicts, and unexpected errors use
`application/problem+json`. Production responses do not return exception details.

## Cross-cutting behavior

- `X-Correlation-ID` accepts a safe caller value or generates one.
- Logs use the built-in structured JSON console provider.
- Public Catalogue endpoints use a fixed-window per-IP rate limit.
- Testing authentication endpoints use a stricter fixed-window per-IP limit.
- Kestrel's server header is disabled.
- Security headers deny framing, sniffing, referrers, and active content.
- Request bodies are capped at 10 MiB at the server boundary.
- `/health/live` checks process liveness.
- `/health/ready` checks PostgreSQL through all five module contexts.

OpenAPI is available at `/openapi/v1.json`. The Phase 3 public application commits a reviewed
snapshot at `packages/sdk/openapi/v1.json` and generates TypeScript response types from it. While
the API is running, verify that snapshot with:

```bash
API_BASE_URL=http://127.0.0.1:8080 npm run sdk:verify
```

Refresh the snapshot only alongside a reviewed API contract change, then run
`API_BASE_URL=http://127.0.0.1:8080 npm run sdk:refresh`, `npm run sdk:generate`, and inspect the
generated type diff.

Current discovery and access routes are:

- `GET /api/v1/catalogue/products` and `/products/{slug}`;
- `GET /api/v1/catalogue/product-types`;
- `GET /api/v1/catalogue/categories` and `/tags`;
- `GET /api/v1/catalogue/collections` and `/collections/{slug}`; and
- `GET /api/v1/catalogue/destinations` and `/destinations/{slug}`.
- `GET /api/v1/access/me`;
- `GET /api/v1/access/customer/{customerId}`;
- `GET /api/v1/access/agent/{organisationId}`; and
- `GET /api/v1/access/staff` and `/administrator`.

Authenticated customer-owned routes are:

- `GET`, `POST`, `PUT`, and `DELETE /api/v1/customer/profile`;
- paginated `GET` and `POST /api/v1/customer/travellers`, plus
  `GET`/`PUT`/`DELETE /travellers/{id}`;
- paginated `GET` and `POST /api/v1/customer/wishlist`, plus `PUT`/`DELETE /wishlist/{id}`; and
- paginated `GET` and `POST /api/v1/customer/saved-itineraries`, plus
  `GET`/`PUT`/`DELETE /saved-itineraries/{id}`; and
- paginated `GET` and `POST /api/v1/customer/travel-plans`, plan detail and input update,
  deterministic `POST /travel-plans/{id}/generate`, and concurrency-protected day/item
  create/update/reorder operations.
- paginated `GET` and `POST /api/v1/customer/quotes`, plus quote detail and version-specific
  `POST` accept/decline or concurrency-protected withdraw operations; and
- organisation-scoped `GET /api/v1/agent/quotes`, quote detail, and prepare/draft/send/revise/
  withdraw operations.

The authenticated customer ID comes only from validated claims. Browser-supplied customer IDs are
never trusted, and an owner-filtered missing record returns a correlated 404 without disclosing
whether another customer owns it.

Travel-plan requests validate dates, pace, destination and Catalogue preferences, customer-owned
traveller associations, bounded accessibility/dietary considerations, and item ordering. Generated
revisions record the fixed rule version and a fingerprint covering normalized input and the
published Catalogue snapshot. They are drafts only and never claim availability, final pricing,
quotes, bookability, bookings, or payments.

Quote requests retain the reviewed itinerary revision, rule version, and fingerprint. Agents submit
server-validated, fixed-precision itemized pricing in EUR, GBP, LKR, or USD. Sending snapshots an
immutable version with terms and expiry; acceptance records a customer decision only and never
creates a booking or payment. See [quote limitations](../quote-limitations.md) and
[pricing and currency guidance](../pricing-and-currency.md).

## Development

See the [API application guide](../../apps/api/README.md) and [local setup](../local-setup.md) for
restore, formatting, build, test, migration, and startup commands.

See [authentication and authorization](../authentication.md) for issuer, required-claim,
web-session, policy, ownership, and isolated test-fixture configuration.
