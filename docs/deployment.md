# Deployment Guide

See [production readiness](production-readiness.md) for release gates and the Azure-compatible
managed-container environment baseline. Deployments must consume secrets from a managed secret
store, never from repository configuration.

Azure-compatible deployment configuration is planned for the production hardening phase.

## Hostinger + Dokploy

Deploy this repository as two independent Dokploy services. Directus is not required: editorial
Journal and Promotions records are stored in PostgreSQL under the `editorial` schema.

### 1. Backend stack (Docker Compose)

1. Create a Docker Compose service from this repository.
2. Set the Compose path to `infrastructure/docker/compose.production.yaml`.
3. Add every variable from `infrastructure/docker/.env.production.example` to the service's
   environment and replace every placeholder.
4. Add `api.example.com` in Dokploy's Domains UI and route it to service `api`, container port
   `8080`, with HTTPS enabled.
5. Deploy and wait for `postgres`, `redis`, `migrate`, and `api` to complete or become healthy.
6. Verify `https://api.example.com/health/ready` before deploying the frontend.

The Compose stack does not publish PostgreSQL or Redis ports. The one-shot `migrate` service runs
`prisma migrate deploy` after PostgreSQL is healthy and before the API starts.

### 2. Public frontend (Dockerfile)

1. Create a separate Dokploy Application from the same repository.
2. Select Dockerfile as the build type, repository root `/` as the build context, and
   `frontend/web/Dockerfile` as the Dockerfile.
3. Set container port `3000` and route the public domain (for example `www.example.com`) to it with
   HTTPS enabled.
4. Add these runtime environment variables:

```dotenv
API_BASE_URL=https://api.example.com
SITE_URL=https://www.example.com
# Optional: the container derives this from SITE_URL when it is omitted.
NEXTAUTH_URL=https://www.example.com
APP_ENVIRONMENT=Production
AUTH_MODE=oidc
AUTH_ISSUER=https://identity.example.com
AUTH_CLIENT_ID=dceylon-web
AUTH_CLIENT_SECRET=replace-with-web-oidc-client-secret
AUTH_SCOPE=openid profile email dceylon.api
AUTH_AUDIENCE=dceylon-api
AUTH_SECRET=replace-with-at-least-32-random-characters
# Optional; restrict this key to the production site's HTTP referrers.
GOOGLE_MAPS_API_KEY=
```

The identity values above are examples, not a hosted identity service. Before deployment, create a
Regular Web Application with a managed OIDC provider (the current sign-up flow is designed for Auth0
Universal Login) and replace all placeholders. For the example public domain, configure the provider
with:

```text
Allowed callback URL: https://www.example.com/api/auth/callback/dceylon
Allowed logout URL:   https://www.example.com
Allowed web origin:   https://www.example.com
```

Set `AUTH_ISSUER` to the provider's issuer origin, and copy that application's real client ID and
client secret into the Dokploy secret store. Configure the backend `AUTH_AUTHORITY` and
`AUTH_ISSUER` for the same provider and set `AUTH_AUDIENCE` to the same API identifier in both
services. Placeholder issuer or secret values are rejected before an OIDC request is attempted.

Because the frontend and backend are separate Dokploy services, `API_BASE_URL` must use the public
HTTPS API origin. The Compose-only hostname `http://api:8080` is not resolvable from the standalone
frontend container unless a shared Docker network is configured manually.

Verify both URLs before redeploying the frontend:

```text
https://api.example.com/health/ready
https://api.example.com/api/v1/catalogue/destinations?pageSize=1
```

Both must return HTTP 200. If the catalogue URL returns 404, `API_BASE_URL` points to the wrong
origin or contains the wrong route. If it returns 502, fix the API domain routing to service `api`
and container port `8080`, then confirm that the API health check and migration are successful.

For an existing database, review the baseline and run `./scripts/api.sh baseline-existing` once
before deploying the new editorial migration. Never use `prisma migrate reset` or `prisma db push`
in production, and never run Compose with `--volumes` there.

The production design must also cover managed backups, TLS, secret rotation, image scanning,
monitoring, rollback, disaster recovery, and release verification.
