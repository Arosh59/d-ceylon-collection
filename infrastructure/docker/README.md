# Local Infrastructure

The default Compose profile provides local PostgreSQL and Redis services. The optional
`application` profile also builds the NestJS API; frontend hosts continue to run separately. This
file is not a production deployment configuration and does not include optional object-storage or
mail-testing services.

## Pinned images

| Service | Image | Selection notes |
| --- | --- | --- |
| PostgreSQL | `postgres:18.3-alpine3.23` | Current supported PostgreSQL major and patch tag available from the official image catalogue when Phase 1 was implemented |
| Redis | `redis:8.8.0-alpine3.23` | Current stable official Redis image; password authentication is enabled |

The tags are exact for repeatable local setup. Production hardening will add
digest pinning, image scanning, update policy, and license review. Redis 8 is
available under its upstream multi-license model; the selected license and
managed-service implications must be reviewed before production deployment.

Version sources:

- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [Redis official image](https://hub.docker.com/_/redis)

## Topology

All services share a Compose bridge network. Published ports bind only to
`127.0.0.1`, preventing access from other hosts by default.

| Service | Default host address | Persistent volume |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:5432` | `postgres_data` |
| Redis | `127.0.0.1:6379` | `redis_data` |

PostgreSQL uses a separate, non-superuser application role. Transactional and
editorial data share the application database; editorial data is isolated in
the `editorial` schema. Redis requires a password.

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

- PostgreSQL must accept connections and contain the expected application database.
- Redis must return `PONG` with the configured password.

Run:

```bash
./scripts/local-infrastructure.sh verify
```

## Data reset

Deleting named volumes permanently removes all local PostgreSQL and Redis data.
The helper refuses this action without an explicit
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

Change `POSTGRES_PORT` or `REDIS_PORT` in `.env`, then restart the stack.

### PostgreSQL or Redis remains unhealthy

Inspect status and logs:

```bash
./scripts/local-infrastructure.sh status
./scripts/local-infrastructure.sh logs
```

Database initialization scripts run only for an empty volume. If credentials or
database names changed after first startup, either restore the previous values
or intentionally follow the guarded data-reset procedure.

### Images fail to pull

Confirm network access and Docker Hub availability, then retry:

```bash
./scripts/local-infrastructure.sh pull
```

Do not replace pinned tags with `latest` as a workaround.
