# Project Structure and Technologies

```text
.
├── backend/                  # NestJS API and Prisma database baseline
│   ├── prisma/               # Existing-schema mapping and future migrations
│   ├── src/common/           # Auth, Problem Details, logs, correlation, rate limits
│   ├── src/database/         # Prisma lifecycle and security audit writer
│   ├── src/modules/          # Business modules
│   └── test/                 # Jest unit and API-contract tests
├── frontend/
│   ├── web/                  # Public/customer/agent Next.js host, port 3000
│   └── admin/                # Separate administrator Next.js host, port 3001
├── apps/
│   ├── ai-service/           # Isolated FastAPI AI boundary
│   └── api/                  # Temporary C# rollback/reference implementation
├── packages/sdk/             # Shared API client and canonical OpenAPI v1 document
├── infrastructure/           # Docker and Azure definitions
├── scripts/                  # Repeatable local and acceptance commands
└── docs/                     # Architecture, security, and operational guidance
```

## Core technologies

| Boundary | Technology |
| --- | --- |
| Public and admin UI | Next.js 16, React 19, TypeScript 5.9 |
| API | NestJS 11 on Node.js 24 |
| Data access | Prisma 6 with parameterized PostgreSQL queries |
| Transactional database | PostgreSQL 18 locally; existing multi-schema model |
| Editorial content | NestJS + PostgreSQL (`editorial` schema) |
| Ephemeral storage | Redis 8 |
| API contract | OpenAPI 3 and `packages/sdk` |
| Tests | Jest for backend; Vitest, Testing Library, axe, and Playwright for web |

## PostgreSQL schemas

The NestJS backend preserves `catalogue`, `identity_access`, `organisations_agents`,
`customers_travellers`, `itineraries_travel_planning`, `quotes`, `bookings`, `payments`, and
`supplier_operations`, and owns editorial tables in `editorial`. Existing UUIDs, constraints,
indexes, concurrency tokens, and data remain in place. Never use destructive Prisma reset or push
commands on this database.

## Environment files

| File | Consumer |
| --- | --- |
| `.env` | local infrastructure and helper scripts |
| `backend/.env` | NestJS API when run directly |
| `frontend/web/.env.local` | public/customer/agent Next.js server |
| `frontend/admin/.env.local` | administrator Next.js server |

The web and admin apps keep OIDC tokens on their server boundaries. Only non-sensitive browser
configuration may use `NEXT_PUBLIC_*` names.

## Common commands

```bash
npm install
npm run typecheck:backend
npm run test:backend
npm run build:backend
npm run typecheck:web
npm run test:web
npm run build:web
npm run typecheck:admin
npm run build:admin
```

Use `./scripts/api.sh run` to start the API at port 8080 and `npm run dev` to start the API plus the
public web host. See [local setup](local-setup.md) for infrastructure and environment details.
