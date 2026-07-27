# Local Infrastructure

Phase 1 provides local PostgreSQL, Redis, and Directus services. It does not
create the ASP.NET Core API, a frontend, production deployment configuration,
or optional object-storage and mail-testing services.

## Pinned images

| Service | Image | Selection notes |
| --- | --- | --- |
| PostgreSQL | `postgres:18.3-alpine3.23` | Current supported PostgreSQL major and patch tag available from the official image catalogue when Phase 1 was implemented |
| Redis | `redis:8.8.0-alpine3.23` | Current stable official Redis image; password authentication is enabled |
| Directus | `directus/directus:11.17.4` | Current stable Directus 11 image; exact version pinned as recommended by Directus |

The tags are exact for repeatable local setup. Production hardening will add
digest pinning, image scanning, update policy, and license review. Redis 8 is
available under its upstream multi-license model; the selected license and
managed-service implications must be reviewed before production deployment.

Version sources:

- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [Redis official image](https://hub.docker.com/_/redis)
- [Directus image tags](https://hub.docker.com/r/directus/directus/tags)
- [Directus deployment and health-check guidance](https://directus.com/docs/self-hosting/deploying)

## Topology

All services share a Compose bridge network. Published ports bind only to
`127.0.0.1`, preventing access from other hosts by default.

| Service | Default host address | Persistent volume |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:5432` | `postgres_data` |
| Redis | `127.0.0.1:6379` | `redis_data` |
| Directus | `http://127.0.0.1:8055` | `directus_uploads`, `directus_extensions` |

PostgreSQL uses separate, non-superuser roles and databases for the future
application and Directus. Redis requires a password. Directus uses Redis for
caching and checks its database, Redis, and local storage through
`/server/health`.

These are local-development controls, not a production security design.
Environment variables are visible to the local Docker daemon. Production
credentials must come from managed secret storage.

## Environment

Generate a local `.env` once:

```bash
./scripts/create-local-env.sh
```

The script:

- reads the committed `.env.example`;
- generates URL-safe random local credentials using OpenSSL;
- writes `.env` with owner-only permissions; and
- refuses to overwrite an existing file.

To use a different environment file with the helper, set
`DCEYLON_ENV_FILE` to its absolute path.

## Commands

The repository helper keeps the Compose file and environment-file arguments
consistent:

```bash
./scripts/local-infrastructure.sh config
./scripts/local-infrastructure.sh pull
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh status
./scripts/local-infrastructure.sh verify
./scripts/local-infrastructure.sh logs
./scripts/local-infrastructure.sh down
```

Equivalent direct Compose commands use:

```bash
docker compose \
  --env-file .env \
  --file infrastructure/docker/compose.yaml \
  COMMAND
```

`up` uses Compose's `--wait` option and fails when a service does not become
healthy. `down` preserves named volumes.

## Health checks

- PostgreSQL must accept connections and contain both expected databases.
- Redis must return `PONG` with the configured password.
- Directus container liveness uses `/server/ping`.
- The verification command also calls `/server/health` to check the Directus
  database, cache, and storage dependencies.

Run:

```bash
./scripts/local-infrastructure.sh verify
```

## Data reset

Deleting named volumes permanently removes all local PostgreSQL, Redis, and
Directus upload data. The helper refuses this action without an explicit
confirmation variable:

```bash
DCEYLON_CONFIRM_DESTROY=yes ./scripts/local-infrastructure.sh destroy
```

Run this only when local data loss is intended. Then run `up` to initialize a
fresh environment.

## Troubleshooting

### Docker daemon is unavailable

Start Docker Desktop or the Docker service, then confirm:

```bash
docker info
```

### A port is already allocated

Change `POSTGRES_PORT`, `REDIS_PORT`, or `DIRECTUS_PORT` in `.env`, then restart
the stack. Keep `DIRECTUS_PUBLIC_URL` aligned with `DIRECTUS_PORT`.

### Directus or PostgreSQL remains unhealthy

Inspect status and logs:

```bash
./scripts/local-infrastructure.sh status
./scripts/local-infrastructure.sh logs
```

Database initialization scripts run only for an empty volume. If credentials or
database names changed after first startup, either restore the previous values
or intentionally follow the guarded data-reset procedure.

### Directus health returns 503

Inspect the response and Directus logs. `/server/health` checks PostgreSQL,
Redis, and local storage; a failed dependency is expected to make readiness
fail even when `/server/ping` returns `pong`.

### Images fail to pull

Confirm network access and Docker Hub availability, then retry:

```bash
./scripts/local-infrastructure.sh pull
```

Do not replace pinned tags with `latest` as a workaround.
