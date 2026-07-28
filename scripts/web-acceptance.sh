#!/usr/bin/env bash

set -Eeuo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIRECTORY="$(mktemp -d "${TMPDIR:-/tmp}/d-ceylon-web-acceptance.XXXXXX")"
API_PROCESS_ID=""
WEB_PROCESS_ID=""

cleanup() {
    local exit_code=$?

    if [[ -n "${WEB_PROCESS_ID}" ]]; then
        kill "${WEB_PROCESS_ID}" >/dev/null 2>&1 || true
        wait "${WEB_PROCESS_ID}" >/dev/null 2>&1 || true
    fi

    if [[ -n "${API_PROCESS_ID}" ]]; then
        docker stop d-ceylon-api-dev >/dev/null 2>&1 || true
        kill "${API_PROCESS_ID}" >/dev/null 2>&1 || true
        wait "${API_PROCESS_ID}" >/dev/null 2>&1 || true
    fi

    if [[ ${exit_code} -ne 0 ]]; then
        if [[ -f "${TEMP_DIRECTORY}/api.log" ]]; then
            tail -n 80 "${TEMP_DIRECTORY}/api.log"
        fi
        if [[ -f "${TEMP_DIRECTORY}/web.log" ]]; then
            tail -n 80 "${TEMP_DIRECTORY}/web.log"
        fi
    fi

    rm -rf "${TEMP_DIRECTORY}"
    exit "${exit_code}"
}

trap cleanup EXIT INT TERM

cd "${REPOSITORY_ROOT}"

if [[ -f ".env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source ".env"
    set +a
fi

API_PORT="${API_PORT:-8080}"
WEB_PORT="${WEB_PORT:-3000}"
API_ORIGIN="http://127.0.0.1:${API_PORT}"
WEB_ORIGIN="http://127.0.0.1:${WEB_PORT}"

wait_for_url() {
    local name="$1"
    local url="$2"

    for _ in {1..60}; do
        if curl --fail --silent --show-error "${url}" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    echo "${name} did not become ready at ${url}." >&2
    return 1
}

./scripts/local-infrastructure.sh verify
./scripts/api.sh migrate
./scripts/api.sh seed

./scripts/api.sh run >"${TEMP_DIRECTORY}/api.log" 2>&1 &
API_PROCESS_ID=$!
wait_for_url "API" "${API_ORIGIN}/health/ready"

API_BASE_URL="${API_ORIGIN}" npm run sdk:verify

curl --fail --silent --show-error \
    "${API_ORIGIN}/api/v1/catalogue/products?query=railway&collection=flow&pageSize=2" >/dev/null

API_BASE_URL="${API_ORIGIN}" SITE_URL="${WEB_ORIGIN}" npm run build:web

API_BASE_URL="${API_ORIGIN}" SITE_URL="${WEB_ORIGIN}" \
    npm run start --workspace=@dceylon/web -- --port "${WEB_PORT}" \
    >"${TEMP_DIRECTORY}/web.log" 2>&1 &
WEB_PROCESS_ID=$!
wait_for_url "Web application" "${WEB_ORIGIN}"

API_BASE_URL="${API_ORIGIN}" SITE_URL="${WEB_ORIGIN}" WEB_BASE_URL="${WEB_ORIGIN}" \
    npm run test:web:smoke

echo "Phase 4 live catalogue, production startup, and responsive smoke checks passed."
