# API Guide

The primary API is planned as a versioned ASP.NET Core modular monolith.

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

Versioning, status codes, pagination envelopes, authentication schemes, and
client-generation commands will be documented when the API is created in
Phase 2.
