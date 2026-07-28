#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_directory}/.." && pwd)"
environment_file="${DCEYLON_ENV_FILE:-${repository_root}/.env}"
sdk_image="mcr.microsoft.com/dotnet/sdk:10.0.302"
api_directory="/workspace/apps/api"
application_environment="${DCEYLON_ASPNETCORE_ENVIRONMENT:-Development}"

if [[ ! -f "${environment_file}" ]]; then
    echo "Missing ${environment_file}." >&2
    echo "Run ./scripts/create-local-env.sh first." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

compose_project="${COMPOSE_PROJECT_NAME:-d-ceylon-local}"
network_name="${compose_project}_backend"

application_connection="Host=postgres;Port=5432;Database=${POSTGRES_APP_DB};Username=${POSTGRES_APP_USER};Password=${POSTGRES_APP_PASSWORD};Include Error Detail=false"
admin_connection="Host=postgres;Port=5432;Database=postgres;Username=${POSTGRES_ADMIN_USER};Password=${POSTGRES_ADMIN_PASSWORD};Include Error Detail=false"

sdk_container() {
    docker run \
        --rm \
        --network "${network_name}" \
        --volume "${repository_root}:/workspace" \
        --volume d-ceylon-dotnet-home:/root/.dotnet \
        --volume d-ceylon-dotnet-nuget:/root/.nuget/packages \
        --workdir "${api_directory}" \
        --env "ConnectionStrings__Postgres=${application_connection}" \
        --env "TestDatabase__AdminConnection=${admin_connection}" \
        --env "ASPNETCORE_ENVIRONMENT=${application_environment}" \
        --env "Authentication__Testing__Issuer=${AUTH_TEST_ISSUER:-}" \
        --env "Authentication__Testing__Audience=${AUTH_TEST_AUDIENCE:-}" \
        --env "Authentication__Testing__SigningKey=${AUTH_TEST_SIGNING_KEY:-}" \
        --env "Authentication__Testing__EndpointKey=${AUTH_TEST_ENDPOINT_KEY:-}" \
        --env DOTNET_CLI_TELEMETRY_OPTOUT=1 \
        --env DOTNET_NOLOGO=1 \
        "${sdk_image}" \
        dotnet "$@"
}

require_network() {
    if ! docker network inspect "${network_name}" >/dev/null 2>&1; then
        echo "Missing Docker network ${network_name}." >&2
        echo "Run ./scripts/local-infrastructure.sh up first." >&2
        exit 1
    fi
}

usage() {
    cat <<'USAGE'
Usage: ./scripts/api.sh COMMAND

Commands:
  restore            Restore locked NuGet dependencies and local tools
  restore-locked     Verify restore against committed lock files
  audit              Audit direct and transitive NuGet dependencies
  format             Apply dotnet formatting
  format-check       Verify formatting without changing files
  build              Build the solution in Release mode
  test-unit          Run unit tests
  test-integration   Run PostgreSQL-backed API integration tests
  test               Run all tests
  migration-add NAME Create a named EF Core migration
  migration-add-identity NAME
                     Create an Identity and Access migration
  migration-add-organisations NAME
                     Create an Organisations and Agents migration
  migration-add-customers NAME
                     Create a Customers and Travellers migration
  migration-add-itineraries NAME
                     Create an Itineraries and Travel Planning migration
  migration-add-quotes NAME
                     Create a Quotes migration
  migration-remove   Remove the latest unapplied EF Core migration
  migrations-list    List EF Core migrations
  migrations-check   Verify the EF Core model has no pending changes
  migrate            Apply EF Core migrations to the local application database
  seed               Apply deterministic catalogue development seed data
  run                Run the API at the configured local API_PORT
USAGE
}

command_name="${1:-}"
require_network

case "${command_name}" in
    restore)
        sdk_container restore D.Ceylon.Collection.slnx
        sdk_container tool restore
        ;;
    restore-locked)
        sdk_container restore D.Ceylon.Collection.slnx --locked-mode
        ;;
    audit)
        sdk_container list D.Ceylon.Collection.slnx package \
            --vulnerable \
            --include-transitive
        ;;
    format)
        sdk_container format D.Ceylon.Collection.slnx --no-restore
        ;;
    format-check)
        sdk_container format D.Ceylon.Collection.slnx --no-restore --verify-no-changes
        ;;
    build)
        sdk_container build D.Ceylon.Collection.slnx --configuration Release --no-restore
        ;;
    test-unit)
        sdk_container test tests/D.Ceylon.Api.UnitTests/D.Ceylon.Api.UnitTests.csproj \
            --configuration Release \
            --no-restore
        ;;
    test-integration)
        sdk_container test tests/D.Ceylon.Api.IntegrationTests/D.Ceylon.Api.IntegrationTests.csproj \
            --configuration Release \
            --no-restore
        ;;
    test)
        sdk_container test tests/D.Ceylon.Api.UnitTests/D.Ceylon.Api.UnitTests.csproj \
            --configuration Release \
            --no-restore
        sdk_container test tests/D.Ceylon.Api.IntegrationTests/D.Ceylon.Api.IntegrationTests.csproj \
            --configuration Release \
            --no-restore
        ;;
    migration-add)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --project src/Modules/Catalogue/D.Ceylon.Modules.Catalogue \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-add-identity)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --context IdentityAccessDbContext \
            --project src/Modules/IdentityAccess/D.Ceylon.Modules.IdentityAccess \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-add-organisations)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --context OrganisationsAgentsDbContext \
            --project src/Modules/OrganisationsAgents/D.Ceylon.Modules.OrganisationsAgents \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-add-customers)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --context CustomersTravellersDbContext \
            --project src/Modules/CustomersTravellers/D.Ceylon.Modules.CustomersTravellers \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-add-itineraries)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --context ItinerariesTravelPlanningDbContext \
            --project src/Modules/ItinerariesTravelPlanning/D.Ceylon.Modules.ItinerariesTravelPlanning \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-add-quotes)
        migration_name="${2:-}"
        if [[ ! "${migration_name}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
            echo "Migration names must start with a letter and contain only letters and numbers." >&2
            exit 1
        fi
        sdk_container tool restore
        sdk_container ef migrations add "${migration_name}" \
            --context QuotesDbContext \
            --project src/Modules/Quotes/D.Ceylon.Modules.Quotes \
            --startup-project src/D.Ceylon.Api \
            --output-dir Infrastructure/Persistence/Migrations
        ;;
    migration-remove)
        sdk_container tool restore
        sdk_container ef migrations remove \
            --project src/Modules/Catalogue/D.Ceylon.Modules.Catalogue \
            --startup-project src/D.Ceylon.Api \
            --force
        ;;
    migrations-list)
        sdk_container tool restore
        sdk_container ef migrations list \
            --context CatalogueDbContext \
            --project src/Modules/Catalogue/D.Ceylon.Modules.Catalogue \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations list \
            --context IdentityAccessDbContext \
            --project src/Modules/IdentityAccess/D.Ceylon.Modules.IdentityAccess \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations list \
            --context OrganisationsAgentsDbContext \
            --project src/Modules/OrganisationsAgents/D.Ceylon.Modules.OrganisationsAgents \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations list \
            --context CustomersTravellersDbContext \
            --project src/Modules/CustomersTravellers/D.Ceylon.Modules.CustomersTravellers \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations list \
            --context ItinerariesTravelPlanningDbContext \
            --project src/Modules/ItinerariesTravelPlanning/D.Ceylon.Modules.ItinerariesTravelPlanning \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations list \
            --context QuotesDbContext \
            --project src/Modules/Quotes/D.Ceylon.Modules.Quotes \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        ;;
    migrations-check)
        sdk_container tool restore
        sdk_container ef migrations has-pending-model-changes \
            --context CatalogueDbContext \
            --project src/Modules/Catalogue/D.Ceylon.Modules.Catalogue \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations has-pending-model-changes \
            --context ItinerariesTravelPlanningDbContext \
            --project src/Modules/ItinerariesTravelPlanning/D.Ceylon.Modules.ItinerariesTravelPlanning \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations has-pending-model-changes \
            --context IdentityAccessDbContext \
            --project src/Modules/IdentityAccess/D.Ceylon.Modules.IdentityAccess \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations has-pending-model-changes \
            --context OrganisationsAgentsDbContext \
            --project src/Modules/OrganisationsAgents/D.Ceylon.Modules.OrganisationsAgents \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations has-pending-model-changes \
            --context CustomersTravellersDbContext \
            --project src/Modules/CustomersTravellers/D.Ceylon.Modules.CustomersTravellers \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        sdk_container ef migrations has-pending-model-changes \
            --context QuotesDbContext \
            --project src/Modules/Quotes/D.Ceylon.Modules.Quotes \
            --startup-project src/D.Ceylon.Api \
            --no-build \
            --configuration Release
        ;;
    migrate)
        sdk_container tool restore
        sdk_container ef database update \
            --context CatalogueDbContext \
            --project src/Modules/Catalogue/D.Ceylon.Modules.Catalogue \
            --startup-project src/D.Ceylon.Api
        sdk_container ef database update \
            --context IdentityAccessDbContext \
            --project src/Modules/IdentityAccess/D.Ceylon.Modules.IdentityAccess \
            --startup-project src/D.Ceylon.Api
        sdk_container ef database update \
            --context OrganisationsAgentsDbContext \
            --project src/Modules/OrganisationsAgents/D.Ceylon.Modules.OrganisationsAgents \
            --startup-project src/D.Ceylon.Api
        sdk_container ef database update \
            --context CustomersTravellersDbContext \
            --project src/Modules/CustomersTravellers/D.Ceylon.Modules.CustomersTravellers \
            --startup-project src/D.Ceylon.Api
        sdk_container ef database update \
            --context ItinerariesTravelPlanningDbContext \
            --project src/Modules/ItinerariesTravelPlanning/D.Ceylon.Modules.ItinerariesTravelPlanning \
            --startup-project src/D.Ceylon.Api
        sdk_container ef database update \
            --context QuotesDbContext \
            --project src/Modules/Quotes/D.Ceylon.Modules.Quotes \
            --startup-project src/D.Ceylon.Api
        ;;
    seed)
        sdk_container run \
            --project src/D.Ceylon.Api \
            --no-launch-profile \
            -- \
            --seed-catalogue
        ;;
    run)
        api_port="${API_PORT:-8080}"
        docker run \
            --rm \
            --name d-ceylon-api-dev \
            --network "${network_name}" \
            --publish "127.0.0.1:${api_port}:8080" \
            --volume "${repository_root}:/workspace" \
            --volume d-ceylon-dotnet-home:/root/.dotnet \
            --volume d-ceylon-dotnet-nuget:/root/.nuget/packages \
            --workdir "${api_directory}" \
            --env "ConnectionStrings__Postgres=${application_connection}" \
            --env "ASPNETCORE_ENVIRONMENT=${application_environment}" \
            --env "Authentication__Testing__Issuer=${AUTH_TEST_ISSUER:-}" \
            --env "Authentication__Testing__Audience=${AUTH_TEST_AUDIENCE:-}" \
            --env "Authentication__Testing__SigningKey=${AUTH_TEST_SIGNING_KEY:-}" \
            --env "Authentication__Testing__EndpointKey=${AUTH_TEST_ENDPOINT_KEY:-}" \
            --env DOTNET_CLI_TELEMETRY_OPTOUT=1 \
            --env DOTNET_NOLOGO=1 \
            "${sdk_image}" \
            dotnet run \
                --project src/D.Ceylon.Api \
                --no-launch-profile
        ;;
    *)
        usage
        exit 1
        ;;
esac
