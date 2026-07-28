# TypeScript API SDK

This workspace contains the server-side TypeScript client for the versioned ASP.NET Core API. Its
public response types are derived from the committed OpenAPI v1 snapshot rather than handwritten
domain models.

Regenerate the contract while the API is running:

```bash
curl --fail --silent --show-error \
  http://127.0.0.1:8080/openapi/v1.json \
  --output packages/sdk/openapi/v1.json
npm run sdk:generate
```

Review both the OpenAPI snapshot and generated TypeScript diff before committing an API contract
change.

The wrapper exposes typed read-only product search, taxonomy, collection, and destination
operations. Query types are derived from the versioned contract; the package does not recreate
persistence or domain models.
