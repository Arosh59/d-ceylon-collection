using D.Ceylon.Modules.Payments.Application;
using D.Ceylon.Modules.Payments.Contracts;
using D.Ceylon.Modules.Payments.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.Payments;

public static class PaymentsModule
{
    public static IServiceCollection AddPaymentsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Postgres must be configured.");

        services.TryAddSingleton(TimeProvider.System);
        services.AddDbContext<PaymentsDbContext>(options =>
            options.UseNpgsql(connectionString, postgres =>
            {
                postgres.MigrationsAssembly(typeof(PaymentsDbContext).Assembly.FullName);
                postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                postgres.CommandTimeout(30);
            }));

        services.AddScoped<IPaymentRecords, PaymentRecords>();
        services.AddSingleton<IPaymentGateway, StripePaymentGateway>();
        services.AddSingleton<IPaymentGateway, LocalPaymentGateway>();
        services.AddSingleton<IWebhookSignatureValidator, WebhookSignatureValidator>();

        services.AddHealthChecks().AddDbContextCheck<PaymentsDbContext>(
            "payments-database",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready"]);

        return services;
    }
}
