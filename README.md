# D Ceylon Collection

> Discover Ceylon. Rediscover Yourself.

D Ceylon Collection is a premium Sri Lankan travel-commerce platform. This monorepo contains two
Next.js applications, a modular NestJS API, shared packages, local infrastructure, and an isolated
AI service.

## Status

The repository now includes the modular API, public and administration Next.js hosts, generated SDK,
protected customer/agent/operations foundations, Directus editorial boundary and Journal, accessible
destination-map foundation, and an isolated Gemini-backed draft-only FastAPI gateway. Production deployment
remains gated on external identity, Directus, payment, supplier, Azure, and operational approvals
described in the release checklist.

See the [feature-status matrix](docs/features/status.md) for phase progress.

## Architecture

- `frontend/web` — accessible public Next.js App Router application
- `frontend/admin` — separately deployed administration Next.js application
- `backend` — NestJS modular-monolith API with Prisma
- `apps/api` — temporary legacy C# comparison and rollback source
- `apps/ai-service` — isolated future FastAPI service
- `packages/ui` — accessible shared React components
- `packages/types` — shared TypeScript types
- `packages/config` — shared frontend tooling configuration
- `packages/sdk` — generated or strongly typed API client
- `infrastructure/docker` — local infrastructure
- `infrastructure/azure` — Azure-compatible deployment configuration
- `docs` — architecture, security, operations, and feature documentation
- `scripts` — repeatable development and operational commands

## Prerequisites

The expected toolchain is:

- Git
- Node.js 24 LTS and npm 11
- Docker with Docker Compose
- Python 3
- GitHub CLI (recommended for repository workflows)

## Getting started

Review [local setup](docs/local-setup.md) to generate local credentials, run the infrastructure,
apply migrations, and start the API and public frontend.

For the public site, run `npm run dev`; it starts the NestJS API, waits for API readiness,
then starts the web host at <http://127.0.0.1:3000>. Use `npm run dev:web` only when the API is
already running. The separate administration host uses `npm run dev:admin` at
<http://127.0.0.1:3001> and requires configured administrator OIDC access.

## Documentation

- [Project structure and technologies](docs/project-structure-and-technologies.md)
- [Architecture overview](docs/architecture/README.md)
- [Local setup](docs/local-setup.md)
- [API guide](docs/api/README.md)
- [Database guide](docs/database/README.md)
- [Authentication](docs/authentication.md)
- [Security](docs/security/README.md)
- [Threat model](docs/security/threat-model.md)
- [Customer data and privacy](docs/privacy.md)
- [Planner rules and limitations](docs/planner-limitations.md)
- [Supplier and operations foundation](docs/supplier-operations.md)
- [Interactive map guidance](docs/interactive-map.md)
- [Production readiness](docs/production-readiness.md)
- [Deployment](docs/deployment.md)
- [Backup and restore](docs/backup-and-restore.md)
- [Coding conventions](docs/coding-conventions.md)
- [Architecture decisions](docs/decisions/README.md)
- [Contributing](CONTRIBUTING.md)

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) for the private
reporting process and handling expectations.
