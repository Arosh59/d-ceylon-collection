#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
compose_file="${repository_root}/infrastructure/docker/compose.yaml"
environment_file="${DCEYLON_ENV_FILE:-${repository_root}/.env}"

if [[ ! -f "${environment_file}" ]]; then
    echo "Missing ${environment_file}." >&2
    echo "Run ./scripts/create-local-env.sh first." >&2
    exit 1
fi

compose() {
    docker compose \
        --env-file "${environment_file}" \
        --file "${compose_file}" \
        "$@"
}

verify() {
    compose exec -T postgres sh -ec '
        pg_isready --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"
        test "$(psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" \
            --tuples-only --no-align \
            --command="SELECT count(*) FROM pg_database WHERE datname IN ('\''$APP_POSTGRES_DB'\'', '\''$DIRECTUS_DB'\'');")" = "2"
    '

    compose exec -T redis sh -ec '
        REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping | grep -q PONG
    '

    directus_port="$(
        sed -n 's/^DIRECTUS_PORT=//p' "${environment_file}" | tail -n 1
    )"
    directus_port="${directus_port:-8055}"

    curl \
        --fail \
        --silent \
        --show-error \
        "http://127.0.0.1:${directus_port}/server/ping"
    printf '\n'

    curl \
        --fail \
        --silent \
        --show-error \
        "http://127.0.0.1:${directus_port}/server/health"
    printf '\n'

    echo "All local infrastructure checks passed."
}

usage() {
    cat <<'USAGE'
Usage: ./scripts/local-infrastructure.sh COMMAND

Commands:
  config   Validate and render the Compose configuration
  pull     Pull the pinned container images
  up       Start PostgreSQL, Redis, and Directus in the background
  down     Stop and remove containers while preserving named volumes
  restart  Restart all local infrastructure containers
  status   Show container and health status
  logs     Follow logs for all infrastructure services
  verify   Verify PostgreSQL, Redis, and Directus connectivity and health
  destroy  Remove containers and named volumes (requires confirmation)
USAGE
}

command_name="${1:-}"

case "${command_name}" in
    config)
        compose config --quiet
        echo "Compose configuration is valid."
        ;;
    pull)
        compose pull
        ;;
    up)
        compose up --detach --wait
        ;;
    down)
        compose down
        ;;
    restart)
        compose restart
        ;;
    status)
        compose ps
        ;;
    logs)
        compose logs --follow
        ;;
    verify)
        verify
        ;;
    destroy)
        if [[ "${DCEYLON_CONFIRM_DESTROY:-}" != "yes" ]]; then
            echo "Refusing to delete local volumes." >&2
            echo "Re-run with DCEYLON_CONFIRM_DESTROY=yes after confirming data loss." >&2
            exit 1
        fi
        compose down --volumes --remove-orphans
        ;;
    *)
        usage
        exit 1
        ;;
esac
