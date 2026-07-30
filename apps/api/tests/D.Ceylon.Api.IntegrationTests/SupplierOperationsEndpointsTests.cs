using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class SupplierOperationsEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task SupplierOperationsRequireStaffAndAuditSuccessfulChanges()
    {
        using var anonymous = _factory.CreateClient();
        using var unauthenticated = await anonymous.GetAsync(
            "/api/v1/operations/suppliers",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        using var customer = await AuthenticatedClientAsync("customer");
        using var forbidden = await customer.GetAsync(
            "/api/v1/operations/suppliers",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        using var staff = await AuthenticatedClientAsync("staff");
        using var supplierResponse = await staff.PostAsJsonAsync(
            "/api/v1/operations/suppliers",
            new
            {
                name = "Test Transport Partner",
                category = "transport",
                contactName = "Operations Contact",
                contactEmail = "operations@example.test",
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, supplierResponse.StatusCode);
        var supplier = await BodyAsync(supplierResponse);

        using var pageResponse = await staff.GetAsync(
            "/api/v1/operations/suppliers?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        pageResponse.EnsureSuccessStatusCode();
        Assert.Contains(
            (await BodyAsync(pageResponse)).GetProperty("items").EnumerateArray(),
            item => item.GetProperty("id").GetGuid() == supplier.GetProperty("id").GetGuid());

        await using var scope = _factory.Services.CreateAsyncScope();
        var audit = scope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        Assert.Contains(
            await audit.SecurityAuditEvents.Select(item => item.EventType)
                .ToListAsync(TestContext.Current.CancellationToken),
            eventType => eventType == "supplier-created");
    }

    [Fact]
    public async Task OperationTasksValidateBookingReferencesAndIndexes()
    {
        using var staff = await AuthenticatedClientAsync("staff");
        using var invalid = await staff.PostAsJsonAsync(
            "/api/v1/operations/tasks",
            new { bookingId = Guid.Empty, title = "Invalid task" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        using var missingBooking = await staff.PostAsJsonAsync(
            "/api/v1/operations/tasks",
            new { bookingId = Guid.NewGuid(), title = "Unresolved booking" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, missingBooking.StatusCode);

        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'supplier_operations'
            """;
        await using var reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
        {
            indexes.Add(reader.GetString(0));
        }

        Assert.Contains("IX_booking_operation_tasks_BookingId_Status", indexes);
        Assert.Contains("IX_booking_operation_tasks_SupplierId_Status", indexes);
        Assert.Contains("IX_suppliers_Status_Name", indexes);
    }

    [Fact]
    public async Task OperationalResourcesRequireStaffAndValidateReferences()
    {
        using var staff = await AuthenticatedClientAsync("staff");
        using var vehicleResponse = await staff.PostAsJsonAsync(
            "/api/v1/operations/vehicles",
            new
            {
                name = "Hill Country Van",
                registrationNumber = "WP-CA-1234",
                capacity = 8,
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, vehicleResponse.StatusCode);

        using var driverResponse = await staff.PostAsJsonAsync(
            "/api/v1/operations/drivers",
            new { name = "Test Driver", phone = "+94770000000", licenceNumber = "B1234567" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, driverResponse.StatusCode);

        using var guideResponse = await staff.PostAsJsonAsync(
            "/api/v1/operations/guides",
            new { name = "Test Guide", phone = "+94771111111", languages = "English, Sinhala" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, guideResponse.StatusCode);

        using var arrivals = await staff.PostAsJsonAsync(
            "/api/v1/operations/arrivals",
            new
            {
                bookingId = Guid.NewGuid(),
                arrivalAtUtc = "2026-08-01T10:30:00Z",
                airport = "Bandaranaike International Airport",
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, arrivals.StatusCode);

        using var vehiclePage = await staff.GetAsync(
            "/api/v1/operations/vehicles?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        vehiclePage.EnsureSuccessStatusCode();
        Assert.Contains(
            (await BodyAsync(vehiclePage)).GetProperty("items").EnumerateArray(),
            item => item.GetProperty("registrationNumber").GetString() == "WP-CA-1234");
    }

    private async Task<HttpClient> AuthenticatedClientAsync(string persona)
    {
        using var issuer = _factory.CreateClient();
        issuer.DefaultRequestHeaders.Add(
            "X-Test-Authentication-Key",
            ApiApplicationFactory.TestEndpointKey);
        using var response = await issuer.PostAsJsonAsync(
            "/api/v1/access/testing/token",
            new { persona },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var token = (await BodyAsync(response)).GetProperty("accessToken").GetString();

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<JsonElement> BodyAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
}
