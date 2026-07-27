# D Ceylon Collection

> Discover Ceylon. Rediscover Yourself.

D Ceylon Collection is a planned premium Sri Lankan travel-commerce platform.
This repository will contain the public website, administration application,
modular ASP.NET Core API, shared packages, local infrastructure, and an isolated
future AI service.

## Status

Phase 0 establishes repository boundaries, engineering conventions, and the
documentation baseline. It intentionally contains no business features,
application scaffolds, dependency manifests, containers, or deployment
resources.

See the [feature-status matrix](docs/features/status.md) for phase progress.

## Planned architecture

- `apps/web` — public Next.js App Router application
- `apps/admin` — administration Next.js App Router application
- `apps/api` — modular-monolith ASP.NET Core Web API
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
- Node.js and npm
- .NET SDK
- Docker with Docker Compose
- Python 3
- GitHub CLI (recommended for repository workflows)

Exact dependency and runtime versions will be selected only when their
implementation phase begins, after compatibility and deprecation checks.

## Getting started

Phase 0 has no runnable applications. Review [local setup](docs/local-setup.md)
for the environment baseline and the work planned for Phase 1.

## Documentation

- [Architecture overview](docs/architecture/README.md)
- [Local setup](docs/local-setup.md)
- [API guide](docs/api/README.md)
- [Database guide](docs/database/README.md)
- [Authentication](docs/authentication.md)
- [Security](docs/security/README.md)
- [Threat model](docs/security/threat-model.md)
- [Deployment](docs/deployment.md)
- [Backup and restore](docs/backup-and-restore.md)
- [Coding conventions](docs/coding-conventions.md)
- [Architecture decisions](docs/decisions/README.md)
- [Contributing](CONTRIBUTING.md)

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md)
for the private reporting process and handling expectations.
