using D.Ceylon.Modules.ItinerariesTravelPlanning.Application;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning;

public static class ItinerariesTravelPlanningModule
{
    public static IServiceCollection AddItinerariesTravelPlanningModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Postgres must be configured.");
        services.TryAddSingleton(TimeProvider.System);
        services.AddDbContext<ItinerariesTravelPlanningDbContext>(options =>
            options.UseNpgsql(connectionString, postgres =>
            {
                postgres.MigrationsAssembly(
                    typeof(ItinerariesTravelPlanningDbContext).Assembly.FullName);
                postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                postgres.CommandTimeout(30);
            }));
        services.AddScoped<IDeterministicTravelPlanner, DeterministicTravelPlanner>();
        services.AddScoped<ITravelPlanRecords, TravelPlanRecords>();
        services.AddHealthChecks().AddDbContextCheck<ItinerariesTravelPlanningDbContext>(
            "itineraries-travel-planning-database",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready"]);
        return services;
    }
}
