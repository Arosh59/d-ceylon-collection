using System.Text.RegularExpressions;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Seeding;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace D.Ceylon.Api.IntegrationTests;

public sealed partial class ApiApplicationFactory : WebApplicationFactory<Program>
{
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
