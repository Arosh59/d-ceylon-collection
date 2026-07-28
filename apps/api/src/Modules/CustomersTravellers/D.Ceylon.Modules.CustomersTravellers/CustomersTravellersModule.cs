using D.Ceylon.Modules.CustomersTravellers.Application;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.CustomersTravellers;

public static class CustomersTravellersModule
{
    public static IServiceCollection AddCustomersTravellersModule(
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
        services.AddDbContext<CustomersTravellersDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                postgres =>
                {
                    postgres.MigrationsAssembly(
                        typeof(CustomersTravellersDbContext).Assembly.FullName);
                    postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                    postgres.CommandTimeout(30);
                }));
        services.AddScoped<ICustomerRecords, CustomerRecordsService>();
        services
            .AddHealthChecks()
            .AddDbContextCheck<CustomersTravellersDbContext>(
                "customers-travellers-database",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        return services;
    }
}
