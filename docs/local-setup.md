# Local Setup

## Prerequisites

Phase 1 requires:

- Git;
- Docker Desktop or Docker Engine;
- Docker Compose v2 or later;
- Bash, OpenSSL, and curl;
- Node.js 24 LTS and npm 11 for the public web application.

The host .NET SDK remains optional because API commands use the pinned SDK container. Python is not
required until the isolated AI-service phase.

## First-time setup

From the repository root:

```bash
./scripts/create-local-env.sh
./scripts/local-infrastructure.sh config
./scripts/local-infrastructure.sh pull
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
```

The environment generator refuses to overwrite an existing `.env`. It creates random, local-only
passwords with restrictive file permissions. Review `DIRECTUS_ADMIN_EMAIL` in `.env` before using a
shared development machine. Never commit `.env`.

Directus Studio is available at <http://127.0.0.1:8055>. Sign in with the `DIRECTUS_ADMIN_EMAIL` and
`DIRECTUS_ADMIN_PASSWORD` stored in your local `.env`. Replace the example email with a
syntactically valid address before the first Directus start; Directus validates it during
administrator bootstrap.

The first Directus start bootstraps the administrator from those variables. Directus deliberately
does not replace an existing administrator when `.env` changes. If a persisted local Directus
database has no usable administrator, do not delete shared volumes or alter production-like content
to recover it. Recreate only the disposable local Directus database/volume after taking a backup and
an explicit data-loss decision, then start the stack with the intended values. The API container
uses `DIRECTUS_API_BASE_URL=http://directus:8055` by default; set `DIRECTUS_STATIC_TOKEN` only when
the Editorial service must read non-public content. Public Journal and promotion records should
instead be exposed through the least-privilege Directus public policy.

Provision the local-only Editorial schema and sample content after infrastructure is healthy:

```bash
set -a; source .env; set +a
node scripts/provision-local-directus.mjs --seed
```

The script creates only the `journal_articles`, `promotions`, and `media_assets` collections, grants
the Directus public policy read access limited to `status=published`, and seeds no licensed media
files. `media_assets` records retain alternative-text and rights metadata for stable placeholder
keys. The script is idempotent and never overwrites existing editorial records.

## Everyday commands

```bash
# Show health and container status
./scripts/local-infrastructure.sh status
./scripts/local-infrastructure.sh verify

# Follow service logs
./scripts/local-infrastructure.sh logs

# Stop containers but preserve data
./scripts/local-infrastructure.sh down

# Start them again
./scripts/local-infrastructure.sh up
```

See the [infrastructure guide](../infrastructure/docker/README.md) for image versions, persistence,
reset behavior, direct Compose commands, and troubleshooting.

## Application status

The Phase 7 ASP.NET Core API is runnable through a pinned SDK container; no host .NET installation
is required:

```bash
./scripts/api.sh restore
./scripts/api.sh build
./scripts/api.sh test
./scripts/api.sh migrate
./scripts/api.sh seed
./scripts/api.sh run
```

The API is available at <http://127.0.0.1:8080>, its OpenAPI document at
<http://127.0.0.1:8080/openapi/v1.json>, and readiness at <http://127.0.0.1:8080/health/ready>.

The API command runs in the foreground and stops with `Ctrl+C`. Phase 1 PostgreSQL, Redis, and
Directus remain managed separately through `local-infrastructure.sh`.

## Public web application

Install the locked frontend dependencies from the repository root:

```bash
npm ci
```

Start the public application and its pinned API workflow together:

```bash
npm run dev
```

The launcher starts `./scripts/api.sh run` only when the API readiness endpoint is unavailable and
stops the API process it started when the web host exits. The public application is available at
<http://127.0.0.1:3000>. Configuration is server-only and must use HTTP or HTTPS origins without
credentials, query strings, or fragments. Authentication settings are also server-only. Production
issuer URLs require HTTPS; copy `apps/web/.env.example` and supply provider and session secrets
through local ignored configuration or a managed secret store.

Common checks are:

```bash
npm run format:check
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
./scripts/web-acceptance.sh
```

The acceptance script verifies infrastructure and all five module migration sets, starts the API
with isolated random Testing keys, compares its live OpenAPI document with the committed SDK
snapshot, builds and starts the production web application, and runs public and protected
desktop/mobile Chrome flows. It also verifies missing-token denial, security headers, authentication
rate limiting, and deterministic planner generation/editing boundaries, then stops temporary API and
web processes.

See the [public web guide](../apps/web/README.md) for routes, SDK regeneration, environment rules,
and troubleshooting.
