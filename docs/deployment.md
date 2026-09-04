# Deployment Guide

See [production readiness](production-readiness.md) for release gates and the Azure-compatible
managed-container environment baseline. Deployments must consume secrets from a managed secret
store, never from repository configuration.

Azure-compatible deployment configuration is planned for the production
hardening phase.

## Hostinger Dockploy one-server deployment

The repository contains a production-ready NestJS API image at `backend/Dockerfile`. The public
and admin Next.js applications do not currently have Dockerfiles, so deploy them as separate
Node.js services in Dockploy, or add reviewed frontend images before using an all-container setup.

For a single-server Compose deployment of PostgreSQL, Redis, and the API, configure production
secrets in a server-only `.env` and run:

```bash
npm ci
docker compose --env-file .env --file infrastructure/docker/compose.yaml config
docker compose --env-file .env --file infrastructure/docker/compose.yaml --profile application build api
docker compose --env-file .env --file infrastructure/docker/compose.yaml --profile application up --detach --wait
```

Apply migrations from a controlled release runner with Node.js 24 and npm 11. Do not run a reset or
`db push` in production:

```bash
export DATABASE_URL='postgresql://<app-user>:<url-encoded-password>@127.0.0.1:<postgres-port>/<app-db>'
npm exec --workspace=@dceylon/backend -- prisma migrate deploy
```

In Dockploy, expose the API container on internal port `8080`, route its health probe to
`/health/ready`, and set `APP_ENVIRONMENT=Production`, `DATABASE_URL`, `AUTH_AUTHORITY`,
`AUTH_ISSUER`, and `AUTH_AUDIENCE` as server-side secrets/configuration. Set the web service's
`API_BASE_URL` to the public HTTPS API origin and the admin service's OIDC values independently.
Terminate TLS at Dockploy's reverse proxy; do not expose PostgreSQL or Redis publicly.

The production design must cover:

- independently deployable web, admin, API, and future AI workloads;
- managed PostgreSQL, Redis, private object storage, and secret management;
- private networking and least-privilege managed identities;
- TLS, security headers, health probes, scaling, and structured telemetry;
- controlled, reviewed Prisma migration execution;
- immutable, scanned build artifacts;
- reviewed promotion between environments; and
- rollback, disaster recovery, and release verification.

No deployment resources or automated deployments exist in Phase 0. Unreviewed
pull requests must never deploy.
