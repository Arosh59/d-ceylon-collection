# Docker infrastructure

The local Compose file runs PostgreSQL and Redis. Its `application` profile also builds and runs the
NestJS API plus the public and admin Next.js hosts. Editorial Journal and Promotions data live in
the application PostgreSQL database under the `editorial` schema; Directus is not part of this
stack.

## Local

Generate `.env` once, then start infrastructure and apply migrations:

```bash
./scripts/create-local-env.sh
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
./scripts/api.sh migrate
docker compose --env-file .env --file infrastructure/docker/compose.yaml \
  --profile application up --build --detach --wait
```

The default endpoints are web `http://127.0.0.1:3000`, admin `http://127.0.0.1:3001`, API
`http://127.0.0.1:8080`, PostgreSQL `127.0.0.1:5432`, and Redis `127.0.0.1:6379`.

Use `./scripts/local-infrastructure.sh down` to stop containers while preserving data. The guarded
`DCEYLON_CONFIRM_DESTROY=yes ./scripts/local-infrastructure.sh destroy` command removes local
PostgreSQL and Redis volumes and is the only reset command provided by the repository.

## Production / Dokploy

Use `compose.production.yaml` for the backend Docker Compose service only. It includes `postgres`,
`redis`, a one-shot `migrate` service, and `api`. Copy the variables from `.env.production.example`
into Dokploy's environment editor and replace all placeholders. Route the API domain to `api:8080`;
PostgreSQL and Redis have no published ports.

Deploy the public web application as a separate Dokploy Dockerfile service. Use repository root `/`
as its build context, `frontend/web/Dockerfile` as its Dockerfile, and container port `3000`. Its
`API_BASE_URL` must be the backend's public HTTPS URL, not the Compose hostname `api`.

The API migration runs before the API starts; never use `prisma migrate reset`, `prisma db push`, or
`docker compose down --volumes` in production.

For an existing database, review the baseline and mark it applied once with
`./scripts/api.sh baseline-existing` before deploying later migrations. Back up the PostgreSQL
database and test restoration before applying the editorial migration.
