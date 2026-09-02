# D Ceylon Collection: Project Structure and Technology Guide

This document describes the repository as it currently exists: its initial structure, local
runtime dependencies, startup order, frontend technologies, backend technologies, data ownership,
and the main development commands.

## 1. What this project is

D Ceylon Collection is a travel-commerce platform monorepo. It contains:

- a public travel discovery and customer-portal website;
- a separately hosted administrator website;
- a modular ASP.NET Core API for catalogue, identity, customer, planning, quote, booking, payment,
  editorial, and supplier-operation boundaries;
- local PostgreSQL, Redis, and Directus infrastructure;
- a generated TypeScript SDK for the API contract; and
- an isolated FastAPI AI gateway skeleton for future draft assistance.

The repository is feature-complete through the documented foundation phases, while production
hardening and external-service certification are still in progress. Several screens and modules,
especially administration and AI, are intentionally foundations rather than complete business
implementations.

## 2. Initial repository structure

```text
d-ceylon-collection/
├── apps/
│   ├── web/                 # Public Next.js website and customer/agent portal
│   ├── admin/               # Separate administrator Next.js host
│   ├── api/                 # ASP.NET Core 10 modular-monolith API
│   └── ai-service/          # Isolated FastAPI draft-assistance gateway
├── packages/
│   ├── sdk/                 # OpenAPI snapshot, generated types, typed API clients
│   ├── ui/                  # Reserved shared UI package; currently a placeholder
│   ├── types/               # Reserved shared types package; currently a placeholder
│   └── config/              # Reserved shared frontend configuration; currently a placeholder
├── infrastructure/
│   ├── docker/              # Local PostgreSQL, Redis, Directus Compose stack
│   └── azure/               # Azure-compatible deployment baseline (Bicep)
├── scripts/                 # Environment, infrastructure, API, SDK, and acceptance helpers
├── docs/                    # Architecture, setup, security, database, deployment, and feature docs
├── .env.example             # Root local infrastructure/API environment template
├── global.json              # Pinned .NET SDK: 10.0.302
├── package.json             # npm workspaces and root commands
├── package-lock.json        # Locked JavaScript dependency graph
└── README.md                # Repository overview and documentation index
```

### Important application directories

`apps/web/src/app` uses the Next.js App Router. Public routes include the homepage, catalogue,
collections, destinations, experiences, accommodation, and Journal. Protected routes are under
`apps/web/src/app/portal`, with customer, agent, and operations areas. `apps/web/src/components`
contains reusable page components and accessibility tests; `apps/web/src/lib` contains server-only
API clients, authentication, environment validation, and domain-specific helpers.

`apps/admin/src/app` is a separate administrator host. It currently provides an administrator-only
dashboard, protected module navigation, authentication states, and foundation pages for products,
customers, suppliers, quotes, bookings, payments, Journal, users, reporting, and other planned
administrative areas. The pages do not yet implement unrestricted administrative CRUD.

`apps/api/src/D.Ceylon.Api` is the HTTP host. `apps/api/src/BuildingBlocks` contains lightweight
shared domain and pagination primitives. Each directory under `apps/api/src/Modules` owns its own
domain entities, application services, contracts, persistence mappings, EF Core `DbContext`,
migrations, and registration method.

## 3. Required runtime prerequisites

Use the versions declared by the repository:

| Tool | Version / requirement | Used for |
| --- | --- | --- |
| Git | Current supported version | Source control |
| Node.js | `>=24.11.0 <25` / Node 24 LTS | Next.js, SDK, tests, scripts |
| npm | `>=11.6.0 <12`, package manager `11.18.0` | JavaScript workspaces and locked install |
| Docker Desktop or Docker Engine | Compose v2 or later | Infrastructure and pinned .NET SDK containers |
| Bash, OpenSSL, curl | Required by shell helpers | Environment generation and startup scripts |
| .NET SDK | `10.0.302` if running natively | API development; optional when using `scripts/api.sh` |
| Python | `>=3.11` | Only for the isolated AI service |

On Windows, run the `.sh` helpers through Git Bash or WSL. Docker Desktop must be running. The API
helper uses `mcr.microsoft.com/dotnet/sdk:10.0.302`, so a matching host .NET SDK is not required for
the documented container workflow.

## 4. Local startup sequence

Run these commands from the repository root. The first command creates the ignored root `.env`
with random local credentials and refuses to overwrite an existing file.

```bash
./scripts/create-local-env.sh
./scripts/local-infrastructure.sh config
./scripts/local-infrastructure.sh pull
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
```

Provision local Directus editorial collections and sample content after the infrastructure is
healthy:

```bash
set -a; source .env; set +a
node scripts/provision-local-directus.mjs --seed
```

Install JavaScript dependencies:

```bash
npm ci
```

Restore and initialize the API. The API must run on the same Docker Compose network as PostgreSQL
and Directus, which is why infrastructure must be started first.

```bash
./scripts/api.sh restore
./scripts/api.sh build
./scripts/api.sh migrate
./scripts/api.sh seed
```

The seed command is development/testing-only and inserts deterministic placeholder catalogue data.
It does not apply migrations automatically. Migrations are intentionally explicit.

Start the public website and API together:

```bash
npm run dev
```

`npm run dev` calls `scripts/dev.sh`. It checks `http://127.0.0.1:8080/health/ready`; if the API is
not already running, it starts the pinned API container, waits for readiness, then starts the web
host. The public site is available at `http://127.0.0.1:3000`.

To run the pieces separately:

```bash
./scripts/api.sh run       # API: http://127.0.0.1:8080
npm run dev:web            # Public web: http://127.0.0.1:3000
npm run dev:admin          # Admin: http://127.0.0.1:3001
```

The admin host is not started by `npm run dev`. It requires its own OIDC configuration and an
administrator role from the identity provider.

Useful service URLs:

- API root: `http://127.0.0.1:8080/`
- API readiness: `http://127.0.0.1:8080/health/ready`
- API OpenAPI: `http://127.0.0.1:8080/openapi/v1.json`
- Directus Studio: `http://127.0.0.1:8055`
- Public web: `http://127.0.0.1:3000`
- Admin web: `http://127.0.0.1:3001`

## 5. Environment files and ports

There are separate configuration responsibilities:

| File | Scope | Main values |
| --- | --- | --- |
| `.env` | Root infrastructure and API helper | PostgreSQL, Redis, Directus, API, web, and port values |
| `apps/web/.env.local` | Public Next.js server | API origin, site URL, OIDC client, session secret, optional Google Maps key |
| `apps/admin/.env.local` | Admin Next.js server | OIDC issuer/client credentials and admin session secret |
| AI deployment environment | FastAPI service | Shared gateway secret, backend API URL, retention hours |

The root `.env.example` defines these default host ports:

| Service | Default port |
| --- | ---: |
| PostgreSQL | `5432` |
| Redis | `6379` |
| Directus | `8055` |
| ASP.NET Core API | `8080` |
| Public Next.js app | `3000` |
| Admin Next.js app | `3001` |
| AI service | `8000` |

For normal local web development, copy `apps/web/.env.example` to `apps/web/.env.local`. The
minimum important values are `API_BASE_URL`, `SITE_URL`, `APP_ENVIRONMENT`, `AUTH_ISSUER`,
`AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_SCOPE`, and a random `AUTH_SECRET` of at least 32
characters. Authentication secrets and API origins are server-only; they must not be renamed to
`NEXT_PUBLIC_*`. The Google Maps key is the intentional browser-visible exception and must be
restricted by HTTP referrer in Google Cloud.

## 6. Frontend technologies

### Public web (`apps/web`)

- **Next.js `16.2.12`** with the App Router and server-rendered routes.
- **React `19.2.8`** and **React DOM `19.2.8`**.
- **TypeScript `5.9.3`** with strict type checking for application and test projects.
- **Tailwind CSS `4.3.3`** through `@tailwindcss/postcss`, plus application global CSS.
- **NextAuth `4.24.15`** for the server-side OIDC session boundary.
- **`@dceylon/sdk`** for typed API access; the browser does not connect directly to PostgreSQL or
  the API with a bearer token.
- **Vitest `4.1.10`**, Testing Library, JSDOM, and `axe-core` for unit, component, and accessibility
  tests.
- **Playwright `1.62.0`** for desktop/mobile browser smoke and acceptance tests.
- **ESLint `10.8.0`** and Prettier `3.9.6` for code quality and formatting.

The public app uses React Server Components for API-backed pages. Server-only library files create
SDK clients using `API_BASE_URL`, forward a safe `X-Correlation-ID`, and keep access tokens in the
encrypted HTTP-only NextAuth session. Mutations in the customer portal use server actions. The app
uses native forms, explicit loading/error/not-found states, responsive layouts, keyboard support,
visible focus styles, semantic landmarks, and reduced-motion behavior.

There is no Redux, React Query, browser-side database client, or frontend copy of backend domain
entities in the current implementation. The generated API response types are the contract boundary.

### Administration (`apps/admin`)

The admin host uses the same core frontend platform: Next.js 16, React 19, TypeScript 5.9, Tailwind
CSS 4, NextAuth 4, ESLint, and Prettier. It is separately deployed and separately configured. Its
current implementation focuses on administrator authentication, role checking, protected layouts,
navigation, and foundation screens; future API-backed administrative operations must add explicit
API policies, validation, audit events, and ownership rules.

### SDK (`packages/sdk`)

`packages/sdk/openapi/v1.json` is the reviewed API contract snapshot. `@hey-api/openapi-ts` generates
TypeScript types into `packages/sdk/src/generated`. Handwritten fetch-based clients then expose
domain-specific wrappers for access, catalogue, customer, travel planning, quotes, bookings,
payments, editorial, and operations. Regenerate or verify the contract with:

```bash
npm run sdk:verify
npm run sdk:generate
```

## 7. Backend technologies

### API host (`apps/api`)

- **ASP.NET Core 10 / .NET 10**, target framework `net10.0`.
- **C#** with nullable reference types, implicit usings, latest language version, analyzers, and
  warnings treated as errors.
- **Minimal API endpoint mapping**, grouped under `/api/v1`.
- **Entity Framework Core `10.0.10`** for persistence and migrations.
- **Npgsql EF Core provider `10.0.3`** for PostgreSQL.
- **Microsoft ASP.NET Core OpenAPI `10.0.10`** and `Microsoft.OpenApi 2.11.0` for the versioned
  contract.
- **JWT Bearer authentication** against an external OIDC issuer; D Ceylon does not store passwords.
- **Policy and resource-based authorization** for customer, agent, staff, administrator, ownership,
  and organisation boundaries.
- **xUnit v3 MTP v2 `3.2.2`** for unit and integration tests.
- **Problem Details**, global exception handling, validation filters, rate limiting, JSON logging,
  correlation IDs, security headers, liveness, and readiness health checks.

The API is a modular monolith, not a collection of independently deployed microservices. The host
registers modules in `Program.cs`, while each module keeps its own implementation boundary:

| Module | Responsibility |
| --- | --- |
| Catalogue | Products, product types, categories, collections, destinations, tags, media metadata, filters, pagination, and PostgreSQL full-text search |
| Identity and Access | Users, roles, permissions, claims mapping, ownership references, and security audit events |
| Organisations and Agents | Organisations, memberships, and agent organisation scope |
| Customers and Travellers | Customer profiles, contact preferences, travellers, wishlist, and saved-itinerary metadata |
| Itineraries and Travel Planning | Validated planner input, traveller associations, deterministic draft generation, ordered days/items, and optimistic concurrency |
| Quotes and Pricing | Quote requests, agent drafts, fixed-precision amounts, status transitions, sent versions, expiry, and ownership |
| Bookings | Accepted-quote booking workflow, customer/agent booking views, cancellation requests, and vouchers |
| Payments | Server-priced payment instructions and payment records; payment capture and card storage are not implemented |
| Supplier Operations | Suppliers, vehicles, drivers, guides, arrivals, resource assignments, and operational tasks |
| Editorial | Read-only integration with Directus for Journal articles and promotions |

Each transactional module uses its own EF Core `DbContext`, PostgreSQL schema, migrations, health
check, and application contracts. Modules refer to other modules through stable IDs and explicit
contracts, not cross-context EF navigation properties. The API applies migrations only when
explicitly requested through `./scripts/api.sh migrate`.

### API endpoint groups

The implemented HTTP surface includes:

- public catalogue discovery under `/api/v1/catalogue`;
- public editorial reads under `/api/v1/editorial`;
- access and portal checks under `/api/v1/access`;
- customer profile, traveller, wishlist, saved-itinerary, and travel-plan routes under
  `/api/v1/customer`;
- customer and agent quote workflows under `/api/v1/customer/quotes` and `/api/v1/agent/quotes`;
- customer and agent bookings under `/api/v1/customer/bookings` and `/api/v1/agent/bookings`;
- customer payment routes under `/api/v1/customer`; and
- staff-only supplier operations under `/api/v1/operations`.

Public routes explicitly opt out of the authenticated fallback policy. Protected routes require a
validated bearer token and perform server-side owner/organisation checks. Invalid input, missing
resources, authorization failures, rate limits, concurrency conflicts, and unexpected failures use
Problem Details responses.

### Data and infrastructure

- **PostgreSQL `18.3-alpine3.23`** is authoritative for transactional application data. The
  Compose initialization creates a separate application database/role and Directus database/role.
- **Redis `8.8.0-alpine3.23`** is password-protected, persistent locally, and currently used by
  Directus for caching. The API does not currently depend on a Redis data model.
- **Directus `11.17.4`** owns editorial content such as Journal articles, promotions, and media
  metadata. The API accesses it through a read-only HTTP boundary and optional static token.
- **Docker Compose** runs PostgreSQL, Redis, and Directus on a private bridge network with host
  ports bound to loopback only.
- **Azure Bicep** contains a deployment baseline. Production deployment still requires approved
  managed identity, Key Vault, monitoring, backup, payment, supplier, and operational controls.

### AI service (`apps/ai-service`)

The AI service is a separate **FastAPI `0.139.2`** application served by **Uvicorn `0.51.0`** on
Python `>=3.11`. It has no database driver, database configuration, booking/payment capability, or
direct customer access. It requires `AI_GATEWAY_SHARED_SECRET` (minimum 32 characters), validates
`BACKEND_API_BASE_URL`, and exposes health endpoints plus a draft-only `/v1/draft-itineraries`
endpoint. The endpoint returns a human-review placeholder and does not check availability, set a
final price, create a booking, charge a payment method, or persist conversations. It is not included
in the default Docker Compose stack or `npm run dev` flow.

## 8. Development and verification commands

Frontend:

```bash
npm run format:check
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
npm run test:web:smoke
npm run build:web
```

Admin:

```bash
npm run typecheck:admin
npm run lint:admin
npm run build:admin
```

API:

```bash
./scripts/api.sh restore
./scripts/api.sh restore-locked
./scripts/api.sh format-check
./scripts/api.sh build
./scripts/api.sh test
./scripts/api.sh migrations-list
./scripts/api.sh migrations-check
./scripts/api.sh migrate
./scripts/api.sh seed
```

Infrastructure:

```bash
./scripts/local-infrastructure.sh status
./scripts/local-infrastructure.sh verify
./scripts/local-infrastructure.sh logs
./scripts/local-infrastructure.sh down
```

## 9. Important current limitations

- External OIDC, Directus production content, payment providers, supplier integrations, Azure
  resources, monitoring, and release approvals are deployment responsibilities and are not fully
  supplied by the repository.
- The admin UI is a permission-aware navigation foundation; its module pages do not yet implement
  complete administrative business operations.
- The AI gateway is draft-only and intentionally cannot perform commercial or database operations.
- Quote and planner data do not claim live availability, final pricing, or booking confirmation
  until the relevant external integrations are implemented.
- Local development media uses placeholders and the small approved local image set; licensed
  production media must be supplied separately.
- Never commit `.env`, `.env.local`, credentials, access tokens, signing keys, or production
  secrets. Do not expose server-only API or authentication settings through `NEXT_PUBLIC_*`.

## 10. Existing detailed references

- [Local setup](local-setup.md)
- [Architecture overview](architecture/README.md)
- [API guide](api/README.md)
- [Database guide](database/README.md)
- [Authentication](authentication.md)
- [Feature status](features/status.md)
- [Deployment](deployment.md)
- [Security](security/README.md)
- [Public web guide](../apps/web/README.md)
- [API README](../apps/api/README.md)
- [Infrastructure README](../infrastructure/docker/README.md)

## 11. Complete copy-paste runbook

The following is the recommended first run for a developer on a new machine.

### Step 1: Open the repository in a Bash terminal

On Windows, open Git Bash or WSL and change to the repository directory. Docker Desktop must be
running before the infrastructure commands are executed.

```bash
cd /path/to/d-ceylon-collection
node --version
npm --version
docker --version
docker compose version
bash --version
openssl version
```

Confirm Node is version 24 and npm is version 11. If a command is missing, install the prerequisite
before continuing.

### Step 2: Create local infrastructure credentials

```bash
./scripts/create-local-env.sh
```

This creates `.env` at the repository root. Review the generated
`DIRECTUS_ADMIN_EMAIL`; it must be a valid email address. Do not commit this file.

### Step 3: Start and verify PostgreSQL, Redis, and Directus

```bash
./scripts/local-infrastructure.sh config
./scripts/local-infrastructure.sh pull
./scripts/local-infrastructure.sh up
./scripts/local-infrastructure.sh verify
```

If `up` fails, run `./scripts/local-infrastructure.sh status` and
`./scripts/local-infrastructure.sh logs`. The first startup may take longer while Docker downloads
the pinned images.

### Step 4: Provision Directus local content

```bash
set -a
source .env
set +a
node scripts/provision-local-directus.mjs --seed
```

Open `http://127.0.0.1:8055` and sign in with `DIRECTUS_ADMIN_EMAIL` and
`DIRECTUS_ADMIN_PASSWORD` from `.env`. The provisioner creates the local Journal, promotions, and
media-metadata collections. It is safe to run again because it is idempotent.

### Step 5: Install JavaScript dependencies

Run this from the repository root, not from an individual app directory:

```bash
npm ci
```

The root npm workspaces install dependencies for `apps/web`, `apps/admin`, and `packages/sdk`.

### Step 6: Configure the public web host

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and provide real values for:

```dotenv
API_BASE_URL=http://127.0.0.1:8080
SITE_URL=http://127.0.0.1:3000
APP_ENVIRONMENT=Development
AUTH_ISSUER=https://your-oidc-provider.example
AUTH_CLIENT_ID=dceylon-web
AUTH_CLIENT_SECRET=your-client-secret
AUTH_SCOPE=openid profile email dceylon.api
AUTH_SECRET=at-least-32-random-characters
```

There is no identity provider in the local Docker Compose stack. Therefore public catalogue pages
can run locally without a successful sign-in, but customer and agent portal authentication requires
an external OIDC provider configured with the correct callback URL for NextAuth:

```text
http://127.0.0.1:3000/api/auth/callback/dceylon
```

The provider must issue API access tokens for the configured API audience and claims. The API's
Development configuration expects the external authority at its configured issuer and audience.

### Step 7: Restore, migrate, and seed the API

The API helper runs .NET inside the pinned SDK container and requires the Compose network from Step
3.

```bash
./scripts/api.sh restore
./scripts/api.sh restore-locked
./scripts/api.sh build
./scripts/api.sh migrate
./scripts/api.sh seed
```

`migrate` applies all current EF Core migration sets. `seed` inserts deterministic Development
catalogue records such as the Root, Flow, Awaken, Breathe, and Rediscover collections. Do not use
`seed` to apply schema changes.

### Step 8: Start the public site and API

The simplest option is one command:

```bash
npm run dev
```

This command starts the API only if `http://127.0.0.1:8080/health/ready` is not already healthy,
then starts Next.js on `http://127.0.0.1:3000`.

Alternatively use separate terminals:

```bash
# Terminal A
./scripts/api.sh run

# Terminal B
npm run dev:web
```

Check the API before opening the web application:

```bash
curl http://127.0.0.1:8080/health/live
curl http://127.0.0.1:8080/health/ready
curl http://127.0.0.1:8080/api/v1/catalogue/products
```

Then open `http://127.0.0.1:3000` and test the public homepage, catalogue, collections, destinations,
experiences, accommodation, and Journal routes.

### Step 9: Start the administrator host when needed

Create its local environment file:

```bash
cp apps/admin/.env.example apps/admin/.env.local
```

Set `AUTH_ISSUER`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, and an `AUTH_SECRET` of at least 32
characters. Register this callback URL with the OIDC provider:

```text
http://127.0.0.1:3001/api/auth/callback/dceylon
```

Start it from the repository root:

```bash
npm run dev:admin
```

Open `http://127.0.0.1:3001`. The signed-in identity must contain the `administrator` role. The
current admin pages are protected foundation/navigation pages; they do not yet provide complete
administrative CRUD against every listed module.

### Step 10: Run the optional AI service

The AI service is not started by Docker Compose or `npm run dev`. To run it separately:

```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
export AI_GATEWAY_SHARED_SECRET="replace-with-at-least-32-characters"
export BACKEND_API_BASE_URL="http://127.0.0.1:8080"
export AI_CONVERSATION_RETENTION_HOURS=24
python -m uvicorn dceylon_ai.main:app --host 127.0.0.1 --port 8000
```

In Windows PowerShell, activate with `.\.venv\Scripts\Activate.ps1` and set the values with
`$env:AI_GATEWAY_SHARED_SECRET`, `$env:BACKEND_API_BASE_URL`, and
`$env:AI_CONVERSATION_RETENTION_HOURS`. Verify it with:

```bash
curl http://127.0.0.1:8000/health/live
curl http://127.0.0.1:8000/health/ready
```

The AI endpoint is a human-review draft placeholder. It cannot access the database, check live
availability, create bookings, calculate final prices, process payments, or persist conversations.

### Step 11: Run the full verification suite

Run the standard checks after the applications are configured:

```bash
npm run format:check
npm run typecheck:web
npm run typecheck:admin
npm run lint:web
npm run lint:admin
npm run test:web
npm run test:web:a11y
./scripts/api.sh format-check
./scripts/api.sh build
./scripts/api.sh test
```

For the broadest local end-to-end check, run:

```bash
./scripts/web-acceptance.sh
```

The acceptance script verifies infrastructure, migrations, seed data, the live OpenAPI contract,
the production web build, authentication test personas, security headers, rate limiting, public
routes, protected portal flows, and responsive browser flows. It requires Docker and a supported
Chrome/Playwright browser installation.

### Step 12: Stop services safely

Stop the foreground API/web/admin/AI processes with `Ctrl+C`, then stop infrastructure while
preserving local data:

```bash
./scripts/local-infrastructure.sh down
```

To start again later:

```bash
./scripts/local-infrastructure.sh up
npm run dev
```

Do not use the destructive command below unless deleting all local databases, Redis data, and
Directus uploads is intended:

```bash
DCEYLON_CONFIRM_DESTROY=yes ./scripts/local-infrastructure.sh destroy
```

After destroying local volumes, repeat the migration, seed, and Directus provisioning steps.
