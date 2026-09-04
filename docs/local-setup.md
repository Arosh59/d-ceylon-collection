# Local Setup

## Prerequisites

- Node.js 24 and npm 11
- Docker with Compose v2 for PostgreSQL and Redis
- Git and OpenSSL

The NestJS runtime does not require a .NET SDK. The legacy `apps/api` source is retained only for
comparison and rollback during cutover.

## Install and configure

```bash
npm install
./scripts/create-local-env.sh
cp backend/.env.example backend/.env
cp frontend/web/.env.example frontend/web/.env.local
cp frontend/admin/.env.example frontend/admin/.env.local
```

Set `DATABASE_URL` in `backend/.env` to the existing application database, for example:

```text
postgresql://dceylon_app:<password>@127.0.0.1:5432/dceylon_app
```

Configure the same external OIDC issuer/audience and claim names used by the previous API. Configure
the web and admin OIDC client values independently; they retain separate sessions and deployment
boundaries.

## Infrastructure and database

```bash
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
./scripts/api.sh migrate
```

To run the API and both Next.js hosts in Docker:

```bash
docker compose --env-file .env --file infrastructure/docker/compose.yaml \
  --profile application up --build --detach --wait
```

The public web host is `http://127.0.0.1:3000`, the admin host is
`http://127.0.0.1:3001`, and the API is `http://127.0.0.1:8080`.

The full Prisma baseline creates all preserved schemas when the database is empty. For an existing
D Ceylon database, run `./scripts/api.sh baseline-existing` once instead of applying the baseline,
then use `./scripts/api.sh migrate` for later migrations. Never run `prisma migrate reset` or
`prisma db push` against an existing environment.

## Run

```bash
./scripts/api.sh run
npm run dev:web
npm run dev:admin
```

The default origins are API `http://127.0.0.1:8080`, web `http://127.0.0.1:3000`, and admin
`http://127.0.0.1:3001`. Editorial content is stored in the application PostgreSQL database.

`npm run dev` starts the NestJS API, waits for `/health/ready`, and then starts the public web host.

## Verify

```bash
npm run typecheck:backend
npm run lint:backend
npm run test:backend
npm run build:backend
npm run prisma:baseline:verify
npm run prisma:migration:verify
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
npm run build:web
npm run typecheck:admin
npm run lint:admin
npm run build:admin
```

Run `API_BASE_URL=http://127.0.0.1:8080 npm run sdk:verify` while the API is running to compare the
served OpenAPI document with the committed SDK contract.
