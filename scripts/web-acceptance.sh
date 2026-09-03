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
AUTH_TEST_ISSUER="https://identity.test.dceylon.invalid"
AUTH_TEST_AUDIENCE="dceylon-api"
AUTH_TEST_SIGNING_KEY="$(openssl rand -hex 32)"
AUTH_TEST_ENDPOINT_KEY="$(openssl rand -hex 32)"
AUTH_SECRET="$(openssl rand -hex 32)"
export AUTH_TEST_ISSUER
export AUTH_TEST_AUDIENCE
export AUTH_TEST_SIGNING_KEY
export AUTH_TEST_ENDPOINT_KEY
export APP_ENVIRONMENT=Testing

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

seed_testing_organisations() {
    docker compose exec -T postgres \
        psql --username "${POSTGRES_APP_USER}" --dbname "${POSTGRES_APP_DB}" \
        --set ON_ERROR_STOP=1 \
        --command "
            INSERT INTO organisations_agents.organisations
                (id, name, slug, is_active, created_at_utc, updated_at_utc, concurrency_token)
            VALUES
                ('20000000-0000-0000-0000-000000000001',
                 'Test Agent Organisation',
                 'test-agent-organisation',
                 TRUE,
                 NOW(),
                 NOW(),
                 '20000000-0000-0000-0000-000000000011'),
                ('20000000-0000-0000-0000-000000000002',
                 'Other Test Agent Organisation',
                 'other-test-agent-organisation',
                 TRUE,
                 NOW(),
                 NOW(),
                 '20000000-0000-0000-0000-000000000022')
            ON CONFLICT (id) DO NOTHING;
        "
}

./scripts/local-infrastructure.sh verify
./scripts/api.sh migrate
./scripts/api.sh seed
seed_testing_organisations

./scripts/api.sh run >"${TEMP_DIRECTORY}/api.log" 2>&1 &
API_PROCESS_ID=$!
wait_for_url "API" "${API_ORIGIN}/health/ready"

API_BASE_URL="${API_ORIGIN}" npm run sdk:verify

curl --fail --silent --show-error \
    "${API_ORIGIN}/api/v1/catalogue/products?query=railway&collection=flow&pageSize=2" >/dev/null

web_auth_environment=(
    "API_BASE_URL=${API_ORIGIN}"
    "SITE_URL=${WEB_ORIGIN}"
    "NEXTAUTH_URL=${WEB_ORIGIN}"
    "APP_ENVIRONMENT=Testing"
    "AUTH_ISSUER=${AUTH_TEST_ISSUER}"
    "AUTH_CLIENT_ID=dceylon-web-testing"
    "AUTH_CLIENT_SECRET=testing-client-secret-not-used-for-external-login"
    "AUTH_SCOPE=openid profile email dceylon.api"
    "AUTH_SECRET=${AUTH_SECRET}"
    "AUTH_TEST_ENDPOINT_KEY=${AUTH_TEST_ENDPOINT_KEY}"
)

env "${web_auth_environment[@]}" npm run build:web

env "${web_auth_environment[@]}" \
    npm run start --workspace=@dceylon/web -- --port "${WEB_PORT}" \
    >"${TEMP_DIRECTORY}/web.log" 2>&1 &
WEB_PROCESS_ID=$!
wait_for_url "Web application" "${WEB_ORIGIN}"

env "${web_auth_environment[@]}" "WEB_BASE_URL=${WEB_ORIGIN}" \
    npm run test:web:smoke

api_unauthorised_status="$(
    curl --silent --output /dev/null --write-out "%{http_code}" \
        "${API_ORIGIN}/api/v1/access/me"
)"
if [[ "${api_unauthorised_status}" != "401" ]]; then
    echo "Expected protected API status 401, received ${api_unauthorised_status}." >&2
    exit 1
fi

web_headers="$(
    curl --silent --head "${WEB_ORIGIN}/auth/sign-in"
)"
if ! grep --quiet --ignore-case "^x-frame-options: DENY" <<<"${web_headers}"; then
    echo "The web security headers check failed." >&2
    exit 1
fi

rate_limited=false
for _ in {1..12}; do
    authentication_status="$(
        curl --silent --output /dev/null --write-out "%{http_code}" \
            --request POST \
            --header "Content-Type: application/json" \
            --header "X-Test-Authentication-Key: invalid-testing-key" \
            --data '{"persona":"customer"}' \
            "${API_ORIGIN}/api/v1/access/testing/token"
    )"
    if [[ "${authentication_status}" == "429" ]]; then
        rate_limited=true
        break
    fi
done
if [[ "${rate_limited}" != true ]]; then
    echo "The authentication endpoint rate-limit check failed." >&2
    exit 1
fi

echo "Phase 9 booking, payment, protected portal, and responsive browser checks passed."
