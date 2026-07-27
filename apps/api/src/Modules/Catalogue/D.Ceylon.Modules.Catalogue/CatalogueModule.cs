using D.Ceylon.Modules.Catalogue.Application;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.Catalogue;

public static class CatalogueModule
{
    public static IServiceCollection AddCatalogueModule(
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

        services.AddSingleton(TimeProvider.System);
        services.AddDbContext<CatalogueDbContext>(options =>
            options
                .UseNpgsql(
                    connectionString,
                    postgres =>
                    {
                        postgres.MigrationsAssembly(typeof(CatalogueDbContext).Assembly.FullName);
                        postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                        postgres.CommandTimeout(30);
                    })
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));
        services.AddScoped<ICatalogueQueries, CatalogueQueries>();
        services
            .AddHealthChecks()
            .AddDbContextCheck<CatalogueDbContext>(
                "catalogue-database",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        return services;
    }
}
