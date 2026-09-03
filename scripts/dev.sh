#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
api_origin="${API_BASE_URL:-http://127.0.0.1:8080}"
api_process=""

cleanup() {
    if [[ -n "${api_process}" ]] && kill -0 "${api_process}" 2>/dev/null; then
        kill "${api_process}" 2>/dev/null || true
        wait "${api_process}" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

api_ready() {
    curl --fail --silent --show-error --max-time 2 "${api_origin}/health/ready" >/dev/null
}

if ! api_ready; then
    echo "Starting the NestJS API at ${api_origin}..."
    "${script_directory}/api.sh" run &
    api_process=$!

    for _ in $(seq 1 60); do
        if api_ready; then
            break
        fi
        if ! kill -0 "${api_process}" 2>/dev/null; then
            wait "${api_process}"
            exit 1
        fi
        sleep 1
    done

    if ! api_ready; then
        echo "The API did not become ready within 60 seconds." >&2
        exit 1
    fi
fi

echo "API is ready. Starting the public web host..."
cd "${repository_root}"
npm run dev:web
