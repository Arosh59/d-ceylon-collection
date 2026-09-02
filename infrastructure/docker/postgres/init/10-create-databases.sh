#!/usr/bin/env bash

# This file is executed inside the Linux PostgreSQL container and must use LF line endings.

set -Eeuo pipefail

create_role_and_database() {
    local database_name="$1"
    local role_name="$2"
    local role_password="$3"

    psql \
        --username "${POSTGRES_USER}" \
        --dbname "${POSTGRES_DB}" \
        --set=database_name="${database_name}" \
        --set=role_name="${role_name}" \
        --set=role_password="${role_password}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'role_name', :'role_password')
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = :'role_name'
)
\gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'database_name', :'role_name')
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_database
    WHERE datname = :'database_name'
)
\gexec
SQL
}

create_role_and_database \
    "${APP_POSTGRES_DB}" \
    "${APP_POSTGRES_USER}" \
    "${APP_POSTGRES_PASSWORD}"

create_role_and_database \
    "${DIRECTUS_DB}" \
    "${DIRECTUS_DB_USER}" \
    "${DIRECTUS_DB_PASSWORD}"

true
