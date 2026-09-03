#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
environment_file="${DCEYLON_ENV_FILE:-${repository_root}/.env}"

if [[ -f "${environment_file}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${environment_file}"
    set +a
fi

export API_PORT="${API_PORT:-8080}"
export APP_ENVIRONMENT="${APP_ENVIRONMENT:-Development}"
export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_APP_USER:-dceylon_app}:${POSTGRES_APP_PASSWORD:-replace-me}@127.0.0.1:${POSTGRES_PORT:-5432}/${POSTGRES_APP_DB:-dceylon_app}}"
export DIRECTUS_API_BASE_URL="${DIRECTUS_API_BASE_URL:-http://127.0.0.1:${DIRECTUS_PORT:-8055}}"

usage() {
    cat <<'USAGE'
Usage: ./scripts/api.sh COMMAND [ARGUMENT]

Commands:
  restore              Install npm workspace dependencies
  audit                Audit npm dependencies
  format               Format the NestJS backend
  format-check         Check backend formatting
  build                Generate Prisma Client and build NestJS
  typecheck            Type-check the backend
  test-unit            Run backend Jest tests
  test-integration     Run PostgreSQL-backed Jest tests
  test                 Run all backend tests
  baseline-existing    Mark the full baseline applied on an existing database
  migration-add NAME   Create a reviewed Prisma migration in development
  migrations-list      Show Prisma migration status
  migrations-check     Validate Prisma and show migration status
  migrate              Apply committed Prisma migrations (never resets data)
  seed                 Explain the preserved-data seed policy
  run                  Run the NestJS API at API_PORT
USAGE
}

cd "${repository_root}"
command_name="${1:-}"

case "${command_name}" in
    restore)
        npm install
        ;;
    audit)
        npm audit
        ;;
    format)
        npx prettier --write --ignore-unknown backend
        ;;
    format-check)
        npx prettier --check --ignore-unknown backend
        ;;
    build)
        npm run prisma:generate --workspace=@dceylon/backend
        npm run build:backend
        ;;
    typecheck)
        npm run typecheck:backend
        ;;
    test-unit)
        npm run test:backend
        ;;
    test)
        npm run test:backend
        npm run test:backend:e2e
        ;;
    test-integration)
        npm run test:e2e --workspace=@dceylon/backend
        ;;
    migration-add)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
            echo "A lowercase migration name is required." >&2
            exit 1
        fi
        npm exec --workspace=@dceylon/backend -- prisma migrate dev --name "${migration_name}"
        ;;
    baseline-existing)
        npm exec --workspace=@dceylon/backend -- prisma migrate resolve --applied 20260903000000_existing_database_baseline
        ;;
    migrations-list)
        npm exec --workspace=@dceylon/backend -- prisma migrate status
        ;;
    migrations-check)
        npm run prisma:validate --workspace=@dceylon/backend
        npm exec --workspace=@dceylon/backend -- prisma migrate status
        ;;
    migrate)
        npm exec --workspace=@dceylon/backend -- prisma migrate deploy
        ;;
    seed)
        echo "Existing catalogue and transactional data are preserved; no destructive seed is applied."
        ;;
    run)
        npm run build:backend
        npm run start --workspace=@dceylon/backend
        ;;
    -h|--help|help|"")
        usage
        ;;
    *)
        echo "Unknown command: ${command_name}" >&2
        usage >&2
        exit 1
        ;;
esac
