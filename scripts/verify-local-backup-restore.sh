#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
environment_file="${DCEYLON_ENV_FILE:-${repository_root}/.env}"
compose_file="${repository_root}/infrastructure/docker/compose.yaml"

if [[ "${DCEYLON_CONFIRM_LOCAL_RESTORE_EXERCISE:-}" != "yes" ]]; then
    echo "Refusing to run a restore exercise without DCEYLON_CONFIRM_LOCAL_RESTORE_EXERCISE=yes." >&2
    exit 1
fi

if [[ ! -f "${environment_file}" ]]; then
    echo "Missing ${environment_file}." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

for identifier in "${POSTGRES_APP_DB}" "${POSTGRES_APP_USER}"; do
    if [[ ! "${identifier}" =~ ^[a-z_][a-z0-9_]*$ ]]; then
        echo "Unsafe PostgreSQL identifier in ${environment_file}." >&2
        exit 1
    fi
done

restore_database="dceylon_restore_verify_$(date +%Y%m%d%H%M%S)"
backup_file="${TMPDIR:-/private/tmp}/dceylon-app-restore-exercise-$(date +%Y%m%d%H%M%S).sql"

compose() {
    docker compose --env-file "${environment_file}" --file "${compose_file}" "$@"
}

cleanup() {
    compose exec -T postgres psql \
        --username "${POSTGRES_ADMIN_USER}" \
        --dbname postgres \
        --set ON_ERROR_STOP=on \
        --command "DROP DATABASE IF EXISTS \"${restore_database}\" WITH (FORCE);" >/dev/null 2>&1 || true
}
trap cleanup EXIT

compose exec -T postgres pg_dump \
    --username "${POSTGRES_APP_USER}" \
    --format plain \
    --no-owner \
    --no-privileges \
    "${POSTGRES_APP_DB}" > "${backup_file}"

compose exec -T postgres psql \
    --username "${POSTGRES_ADMIN_USER}" \
    --dbname postgres \
    --set ON_ERROR_STOP=on \
    --command "CREATE DATABASE \"${restore_database}\" OWNER \"${POSTGRES_APP_USER}\";"

compose exec -T postgres psql \
    --username "${POSTGRES_APP_USER}" \
    --dbname "${restore_database}" \
    --set ON_ERROR_STOP=on < "${backup_file}" >/dev/null

verified="$(compose exec -T postgres psql \
    --username "${POSTGRES_APP_USER}" \
    --dbname "${restore_database}" \
    --tuples-only \
    --no-align \
    --command "SELECT count(*) FROM \"__EFMigrationsHistory\"; SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('catalogue', 'supplier_operations');")"

migration_count="$(printf '%s\n' "${verified}" | sed -n '1p')"
table_count="$(printf '%s\n' "${verified}" | sed -n '2p')"
if [[ "${migration_count:-0}" -lt 10 || "${table_count:-0}" -lt 10 ]]; then
    echo "Restore verification did not find the expected migration history and application tables." >&2
    exit 1
fi

echo "Local PostgreSQL restore exercise passed. Backup retained at ${backup_file}."
