using D.Ceylon.Modules.SupplierOperations.Application;
using D.Ceylon.Modules.SupplierOperations.Contracts;
using D.Ceylon.Modules.SupplierOperations.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.SupplierOperations;

public static class SupplierOperationsModule
{
    public static IServiceCollection AddSupplierOperationsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Postgres must be configured.");

        services.AddDbContext<SupplierOperationsDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(SupplierOperationsDbContext).Assembly.FullName)));
        services.AddScoped<ISupplierOperationsRecords, SupplierOperationsRecords>();
        services.AddHealthChecks().AddDbContextCheck<SupplierOperationsDbContext>(
            "supplier-operations-database",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready"]);

        return services;
    }
}
