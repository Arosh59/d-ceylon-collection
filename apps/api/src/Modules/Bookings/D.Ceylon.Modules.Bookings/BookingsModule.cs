using D.Ceylon.Modules.Bookings.Application;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.Bookings.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Modules.Bookings;

public static class BookingsModule
{
    public static IServiceCollection AddBookingsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:Postgres must be configured.");

        services.TryAddSingleton(TimeProvider.System);
        services.AddDbContext<BookingsDbContext>(options =>
            options.UseNpgsql(connectionString, postgres =>
            {
                postgres.MigrationsAssembly(typeof(BookingsDbContext).Assembly.FullName);
                postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                postgres.CommandTimeout(30);
            }));

        services.AddScoped<IBookingRecords, BookingRecords>();
        services.AddScoped<IBookingPaymentSources, BookingRecords>();
        services.AddScoped<IBookingOperationsSources, BookingRecords>();
        services.AddSingleton<IPdfGenerator, PlaceholderPdfGenerator>();

        services.AddHealthChecks().AddDbContextCheck<BookingsDbContext>(
            "bookings-database",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready"]);

        return services;
    }
}
