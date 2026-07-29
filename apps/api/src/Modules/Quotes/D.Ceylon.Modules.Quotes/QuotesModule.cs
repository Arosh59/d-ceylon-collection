using D.Ceylon.Modules.Pricing;
using D.Ceylon.Modules.Quotes.Application;
using D.Ceylon.Modules.Quotes.Contracts;
using D.Ceylon.Modules.Quotes.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.Quotes;

public static class QuotesModule
{
    public static IServiceCollection AddQuotesModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Postgres must be configured.");
        services.TryAddSingleton(TimeProvider.System);
        services.AddDbContext<QuotesDbContext>(options =>
            options.UseNpgsql(connectionString, postgres =>
            {
                postgres.MigrationsAssembly(typeof(QuotesDbContext).Assembly.FullName);
                postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                postgres.CommandTimeout(30);
            }));
        services.AddScoped<IPriceCalculator, PriceCalculator>();
        services.AddScoped<IQuoteRecords, QuoteRecords>();
        services.AddScoped<IQuoteBookingSources, QuoteRecords>();
        services.AddHealthChecks().AddDbContextCheck<QuotesDbContext>(
            "quotes-database",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready"]);
        return services;
    }
}
