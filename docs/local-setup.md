# Local Setup

## Prerequisites

Phase 1 requires:

- Git;
- Docker Desktop or Docker Engine;
- Docker Compose v2 or later;
- Bash, OpenSSL, and curl;
- Node.js 24 LTS and npm 11 for the public web application.

The host .NET SDK remains optional because API commands use the pinned SDK
container. Python is not required until the isolated AI-service phase.

## First-time setup

From the repository root:

```bash
./scripts/create-local-env.sh
./scripts/local-infrastructure.sh config
./scripts/local-infrastructure.sh pull
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
```

The environment generator refuses to overwrite an existing `.env`. It creates
random, local-only passwords with restrictive file permissions. Review
`DIRECTUS_ADMIN_EMAIL` in `.env` before using a shared development machine.
Never commit `.env`.

Directus Studio is available at <http://127.0.0.1:8055>. Sign in with the
`DIRECTUS_ADMIN_EMAIL` and `DIRECTUS_ADMIN_PASSWORD` stored in your local
`.env`.

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

See the [infrastructure guide](../infrastructure/docker/README.md) for image
versions, persistence, reset behavior, direct Compose commands, and
troubleshooting.

## Application status

The Phase 2 ASP.NET Core API is runnable through a pinned SDK container; no host
.NET installation is required:

```bash
./scripts/api.sh restore
./scripts/api.sh build
./scripts/api.sh test
./scripts/api.sh migrate
./scripts/api.sh run
```

The API is available at <http://127.0.0.1:8080>, its OpenAPI document at
<http://127.0.0.1:8080/openapi/v1.json>, and readiness at
<http://127.0.0.1:8080/health/ready>.

The API command runs in the foreground and stops with `Ctrl+C`. Phase 1
PostgreSQL, Redis, and Directus remain managed separately through
`local-infrastructure.sh`.

## Public web application

Install the locked frontend dependencies from the repository root:

```bash
npm ci
```

Ensure the Phase 2 API is running, then start the public application:

```bash
./scripts/api.sh run

# In a separate terminal
API_BASE_URL=http://127.0.0.1:8080 \
SITE_URL=http://127.0.0.1:3000 \
npm run dev:web
```

The public application is available at <http://127.0.0.1:3000>. Configuration is
server-only and must use HTTP or HTTPS origins without credentials, query
strings, or fragments.

Common checks are:

```bash
npm run format:check
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
./scripts/web-acceptance.sh
```

The acceptance script verifies infrastructure, starts the API, compares its live
OpenAPI document with the committed SDK snapshot, builds and starts the
production web application, and runs desktop and mobile Chrome smoke tests. It
stops the temporary API and web processes when complete.

See the [public web guide](../apps/web/README.md) for routes, SDK regeneration,
environment rules, and troubleshooting.
