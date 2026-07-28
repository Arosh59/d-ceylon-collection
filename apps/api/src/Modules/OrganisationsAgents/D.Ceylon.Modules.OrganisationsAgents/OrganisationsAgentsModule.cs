using D.Ceylon.Modules.OrganisationsAgents.Application;
using D.Ceylon.Modules.OrganisationsAgents.Contracts;
using D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.OrganisationsAgents;

public static class OrganisationsAgentsModule
{
    public static IServiceCollection AddOrganisationsAgentsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Postgres must be configured.");
        }

        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<IOrganisationRecords, OrganisationRecords>();
        services.AddDbContext<OrganisationsAgentsDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                postgres =>
                {
                    postgres.MigrationsAssembly(typeof(OrganisationsAgentsDbContext).Assembly.FullName);
                    postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                    postgres.CommandTimeout(30);
                }));
        services
            .AddHealthChecks()
            .AddDbContextCheck<OrganisationsAgentsDbContext>(
                "organisations-agents-database",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        return services;
    }
}
