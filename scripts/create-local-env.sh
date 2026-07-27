#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
template_path="${repository_root}/.env.example"
environment_path="${repository_root}/.env"

if [[ -e "${environment_path}" ]]; then
    echo "Refusing to overwrite existing ${environment_path}."
    exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "OpenSSL is required to generate local credentials." >&2
    exit 1
fi

umask 077
temporary_path="$(mktemp "${repository_root}/.env.tmp.XXXXXX")"

cleanup() {
    rm -f -- "${temporary_path}"
}
trap cleanup EXIT

postgres_admin_password="$(openssl rand -hex 24)"
postgres_app_password="$(openssl rand -hex 24)"
directus_database_password="$(openssl rand -hex 24)"
redis_password="$(openssl rand -hex 24)"
directus_secret="$(openssl rand -hex 32)"
directus_admin_password="$(openssl rand -hex 24)"

while IFS= read -r line || [[ -n "${line}" ]]; do
    case "${line}" in
        POSTGRES_ADMIN_PASSWORD=*)
            printf 'POSTGRES_ADMIN_PASSWORD=%s\n' "${postgres_admin_password}"
            ;;
        POSTGRES_APP_PASSWORD=*)
            printf 'POSTGRES_APP_PASSWORD=%s\n' "${postgres_app_password}"
            ;;
        DIRECTUS_DB_PASSWORD=*)
            printf 'DIRECTUS_DB_PASSWORD=%s\n' "${directus_database_password}"
            ;;
        REDIS_PASSWORD=*)
            printf 'REDIS_PASSWORD=%s\n' "${redis_password}"
            ;;
        DIRECTUS_SECRET=*)
            printf 'DIRECTUS_SECRET=%s\n' "${directus_secret}"
            ;;
        DIRECTUS_ADMIN_PASSWORD=*)
            printf 'DIRECTUS_ADMIN_PASSWORD=%s\n' "${directus_admin_password}"
            ;;
        *)
            printf '%s\n' "${line}"
            ;;
    esac
done < "${template_path}" > "${temporary_path}"

mv -- "${temporary_path}" "${environment_path}"
chmod 600 "${environment_path}"
trap - EXIT

echo "Created ${environment_path} with generated local-only credentials."
echo "Review DIRECTUS_ADMIN_EMAIL before sharing this development environment."
