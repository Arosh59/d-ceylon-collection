using System.Text.RegularExpressions;
using D.Ceylon.Modules.Bookings.Infrastructure.Persistence;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Seeding;
using D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence;
using D.Ceylon.Modules.OrganisationsAgents.Domain;
using D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence;
using D.Ceylon.Modules.Payments.Infrastructure.Persistence;
using D.Ceylon.Modules.Quotes.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace D.Ceylon.Api.IntegrationTests;

public sealed partial class ApiApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestEndpointKey =
        "phase5-integration-endpoint-key-0000000000000001";
    public const string TestSigningKey =
        "phase5-integration-signing-key-00000000000000001";

    private readonly string _adminConnectionString;
    private readonly string _databaseName;
    private bool _databaseDropped;

    public ApiApplicationFactory()
    {
        var applicationConnectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? throw new InvalidOperationException(
                "ConnectionStrings__Postgres is required for integration tests.");
        _adminConnectionString =
            Environment.GetEnvironmentVariable("TestDatabase__AdminConnection")
            ?? throw new InvalidOperationException(
                "TestDatabase__AdminConnection is required for integration tests.");

        var applicationBuilder = new NpgsqlConnectionStringBuilder(
            applicationConnectionString);
        if (string.IsNullOrWhiteSpace(applicationBuilder.Username)
            || !SafeIdentifier().IsMatch(applicationBuilder.Username))
        {
            throw new InvalidOperationException(
                "The configured application database role is not a safe PostgreSQL identifier.");
        }

        _databaseName = $"dceylon_test_{Guid.NewGuid():N}";
        applicationBuilder.Database = _databaseName;
        ConnectionString = applicationBuilder.ConnectionString;

        try
        {
            CreateDatabase(applicationBuilder.Username);
            ApplyMigrations();
        }
        catch
        {
            DropDatabase();
            throw;
        }
    }

    public string ConnectionString { get; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Postgres", ConnectionString);
        builder.UseSetting(
            "Authentication:Testing:Issuer",
            "https://identity.test.dceylon.invalid");
        builder.UseSetting("Authentication:Testing:Audience", "dceylon-api");
        builder.UseSetting("Authentication:Testing:SigningKey", TestSigningKey);
        builder.UseSetting("Authentication:Testing:EndpointKey", TestEndpointKey);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            NpgsqlConnection.ClearAllPools();
            DropDatabase();
        }
    }

    private void CreateDatabase(string owner)
    {
        using var connection = new NpgsqlConnection(_adminConnectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText =
            $"CREATE DATABASE \"{_databaseName}\" OWNER \"{owner}\"";
        command.ExecuteNonQuery();
    }

    private void ApplyMigrations()
    {
        var options = new DbContextOptionsBuilder<CatalogueDbContext>()
            .UseNpgsql(
                ConnectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(CatalogueDbContext).Assembly.FullName))
            .Options;

        using var database = new CatalogueDbContext(options, TimeProvider.System);
        database.Database.Migrate();
        var seeder = new CatalogueDevelopmentSeeder(database);
        seeder.SeedAsync(CancellationToken.None).GetAwaiter().GetResult();

        var identityOptions = new DbContextOptionsBuilder<IdentityAccessDbContext>()
            .UseNpgsql(
                ConnectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(IdentityAccessDbContext).Assembly.FullName))
            .Options;
        using var identityDatabase =
            new IdentityAccessDbContext(identityOptions, TimeProvider.System);
        identityDatabase.Database.Migrate();

        var organisationOptions =
            new DbContextOptionsBuilder<OrganisationsAgentsDbContext>()
                .UseNpgsql(
                    ConnectionString,
                    postgres => postgres.MigrationsAssembly(
                        typeof(OrganisationsAgentsDbContext).Assembly.FullName))
                .Options;
        using var organisationDatabase =
            new OrganisationsAgentsDbContext(organisationOptions, TimeProvider.System);
        organisationDatabase.Database.Migrate();
        organisationDatabase.Organisations.Add(
            new Organisation(
                Guid.Parse("20000000-0000-0000-0000-000000000001"),
                "Test Agent Organisation",
                "test-agent-organisation"));
        organisationDatabase.Organisations.Add(
            new Organisation(
                Guid.Parse("20000000-0000-0000-0000-000000000002"),
                "Other Test Agent Organisation",
                "other-test-agent-organisation"));
        organisationDatabase.SaveChanges();

        var customerOptions =
            new DbContextOptionsBuilder<CustomersTravellersDbContext>()
                .UseNpgsql(
                    ConnectionString,
                    postgres => postgres.MigrationsAssembly(
                        typeof(CustomersTravellersDbContext).Assembly.FullName))
                .Options;
        using var customerDatabase =
            new CustomersTravellersDbContext(customerOptions, TimeProvider.System);
        customerDatabase.Database.Migrate();

        var itineraryOptions =
            new DbContextOptionsBuilder<ItinerariesTravelPlanningDbContext>()
                .UseNpgsql(
                    ConnectionString,
                    postgres => postgres.MigrationsAssembly(
                        typeof(ItinerariesTravelPlanningDbContext).Assembly.FullName))
                .Options;
        using var itineraryDatabase =
            new ItinerariesTravelPlanningDbContext(itineraryOptions, TimeProvider.System);
        itineraryDatabase.Database.Migrate();

        var quoteOptions = new DbContextOptionsBuilder<QuotesDbContext>()
            .UseNpgsql(
                ConnectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(QuotesDbContext).Assembly.FullName))
            .Options;
        using var quoteDatabase = new QuotesDbContext(quoteOptions, TimeProvider.System);
        quoteDatabase.Database.Migrate();

        var bookingOptions = new DbContextOptionsBuilder<BookingsDbContext>()
            .UseNpgsql(
                ConnectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(BookingsDbContext).Assembly.FullName))
            .Options;
        using var bookingDatabase = new BookingsDbContext(bookingOptions, TimeProvider.System);
        bookingDatabase.Database.Migrate();

        var paymentOptions = new DbContextOptionsBuilder<PaymentsDbContext>()
            .UseNpgsql(
                ConnectionString,
                postgres => postgres.MigrationsAssembly(
                    typeof(PaymentsDbContext).Assembly.FullName))
            .Options;
        using var paymentDatabase = new PaymentsDbContext(paymentOptions, TimeProvider.System);
        paymentDatabase.Database.Migrate();
    }

    private void DropDatabase()
    {
        if (_databaseDropped)
        {
            return;
        }

        using var connection = new NpgsqlConnection(_adminConnectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText =
            $"DROP DATABASE IF EXISTS \"{_databaseName}\" WITH (FORCE)";
        command.ExecuteNonQuery();
        _databaseDropped = true;
    }

    [GeneratedRegex("^[a-z_][a-z0-9_]*$", RegexOptions.CultureInvariant)]
    private static partial Regex SafeIdentifier();
}
