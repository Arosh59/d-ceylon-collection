# Local Setup

## Phase 0 environment

The repository currently contains documentation and directory boundaries only.
There are no dependencies to install or applications to run.

Required tools for later phases:

- Git
- Node.js with npm
- .NET SDK
- Docker with Docker Compose
- Python 3
- GitHub CLI (recommended)

Copy `.env.example` to `.env` only when local infrastructure is introduced.
Replace all placeholders locally and never commit the resulting file.

## Planned Phase 1 commands

Phase 1 will add documented Docker Compose commands for PostgreSQL, Redis, and
Directus, along with health checks and troubleshooting. Do not infer or run
those commands until the Compose definition has been reviewed.
