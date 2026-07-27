# Local Setup

## Prerequisites

Phase 1 requires:

- Git;
- Docker Desktop or Docker Engine;
- Docker Compose v2 or later;
- Bash, OpenSSL, and curl.

Node.js, the .NET SDK, and Python are not required until their application
phases.

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

The public Next.js application begins in Phase 3.
