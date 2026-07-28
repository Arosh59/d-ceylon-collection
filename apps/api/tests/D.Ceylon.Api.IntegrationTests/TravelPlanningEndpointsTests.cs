using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class TravelPlanningEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task PlannerRequiresAuthenticationAndValidatesInput()
    {
        using var anonymous = _factory.CreateClient();
        using var unauthorised = await anonymous.GetAsync(
            "/api/v1/customer/travel-plans",
            TestContext.Current.CancellationToken);
        using var client = await CustomerClient();
        using var invalid = await client.PostAsJsonAsync(
            "/api/v1/customer/travel-plans",
            new
            {
                title = "Invalid",
                travelStartDate = "2027-03-10",
                travelEndDate = "2027-03-01",
                pace = "fast",
                destinationSlugs = Array.Empty<string>(),
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, unauthorised.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Equal("application/problem+json", invalid.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task CustomerCanGenerateEditReorderAndRepeatADraft()
    {
        using var client = await CustomerClient();
        var traveller = await CreateTraveller(client);
        using var created = await client.PostAsJsonAsync(
            "/api/v1/customer/travel-plans",
            Request(traveller.GetProperty("id").GetGuid()),
            TestContext.Current.CancellationToken);
        created.EnsureSuccessStatusCode();
        var first = await Body(created);
        var planId = first.GetProperty("id").GetGuid();
        var revision = first.GetProperty("currentRevision");
        var fingerprint = revision.GetProperty("inputFingerprint").GetString();
        var days = revision.GetProperty("days").EnumerateArray().ToArray();
        Assert.Equal(3, days.Length);
        Assert.Equal("dceylon-deterministic-v1", revision.GetProperty("ruleVersion").GetString());
        Assert.Equal(
            traveller.GetProperty("id").GetGuid(),
            first.GetProperty("input").GetProperty("travellerIds")[0].GetGuid());

        var firstDay = days[0];
        using var dayUpdate = await client.PutAsJsonAsync(
            $"/api/v1/customer/travel-plans/{planId}/days/{firstDay.GetProperty("id").GetGuid()}",
            new
            {
                title = "Arrival and gentle orientation",
                concurrencyToken = firstDay.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        dayUpdate.EnsureSuccessStatusCode();
        var edited = await Body(dayUpdate);
        var editedDays = edited.GetProperty("currentRevision").GetProperty("days")
            .EnumerateArray().ToArray();

        using var itemCreate = await client.PostAsJsonAsync(
            $"/api/v1/customer/travel-plans/{planId}/days/{editedDays[0].GetProperty("id").GetGuid()}/items",
            new
            {
                title = "Private reflection time",
                notes = "Customer-authored draft note.",
                durationMinutes = 30,
                destinationSlug = "ella",
                position = 1,
            },
            TestContext.Current.CancellationToken);
        itemCreate.EnsureSuccessStatusCode();
        var withItem = await Body(itemCreate);
        var currentDays = withItem.GetProperty("currentRevision").GetProperty("days")
            .EnumerateArray().ToArray();
        var custom = currentDays[0].GetProperty("items").EnumerateArray()
            .Single(item => item.GetProperty("source").GetString() == "custom");
        using var reorder = await client.PostAsJsonAsync(
            $"/api/v1/customer/travel-plans/{planId}/items/{custom.GetProperty("id").GetGuid()}/reorder",
            new
            {
                targetDayId = currentDays[1].GetProperty("id").GetGuid(),
                position = 1,
                concurrencyToken = custom.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        reorder.EnsureSuccessStatusCode();
        var reordered = await Body(reorder);
        Assert.Equal(
            "Private reflection time",
            reordered.GetProperty("currentRevision").GetProperty("days")[1]
                .GetProperty("items")[0].GetProperty("title").GetString());

        using var regenerated = await client.PostAsJsonAsync(
            $"/api/v1/customer/travel-plans/{planId}/generate",
            new { concurrencyToken = reordered.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        regenerated.EnsureSuccessStatusCode();
        var repeat = await Body(regenerated);
        Assert.Equal(2, repeat.GetProperty("currentRevision").GetProperty("revisionNumber").GetInt32());
        Assert.Equal(
            fingerprint,
            repeat.GetProperty("currentRevision").GetProperty("inputFingerprint").GetString());

        using var stale = await client.PostAsJsonAsync(
            $"/api/v1/customer/travel-plans/{planId}/generate",
            new { concurrencyToken = reordered.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);

        await using var auditScope = _factory.Services.CreateAsyncScope();
        var audit = auditScope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        var events = await audit.SecurityAuditEvents.Select(x => x.EventType)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains("travel-plan-generated", events);
        Assert.Contains("itinerary-day-updated", events);
        Assert.Contains("itinerary-item-reordered", events);
    }

    [Fact]
    public async Task OwnershipIndexesAndAuditAreEnforced()
    {
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var records = scope.ServiceProvider.GetRequiredService<ITravelPlanRecords>();
            _ = await records.CreateAsync(
                Guid.Parse("90000000-0000-0000-0000-000000000001"),
                Request(Guid.Empty, includeTraveller: false),
                TestContext.Current.CancellationToken);
        }

        using var client = await CustomerClient();
        using var list = await client.GetAsync(
            "/api/v1/customer/travel-plans?pageNumber=1&pageSize=100",
            TestContext.Current.CancellationToken);
        list.EnsureSuccessStatusCode();
        var page = await Body(list);
        Assert.DoesNotContain(
            page.GetProperty("items").EnumerateArray(),
            item => item.GetProperty("title").GetString() == "Other owner");

        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var indexCommand = connection.CreateCommand();
        indexCommand.CommandText =
            """
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'itineraries_travel_planning'
            """;
        await using var reader = await indexCommand.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
            indexes.Add(reader.GetString(0));
        Assert.Contains("ix_travel_plans_customer_status_updated", indexes);
        Assert.Contains("ux_itinerary_revisions_plan_number", indexes);
        Assert.Contains("ix_itinerary_items_day_order", indexes);

    }

    private static CreateTravelPlanRequest Request(
        Guid travellerId,
        bool includeTraveller = true) =>
        new()
        {
            Title = includeTraveller ? "Deterministic Ella draft" : "Other owner",
            TravelStartDate = new DateOnly(2027, 2, 10),
            TravelEndDate = new DateOnly(2027, 2, 12),
            Pace = "balanced",
            DestinationSlugs = ["ella"],
            TravellerIds = includeTraveller ? [travellerId] : [],
            Interests = ["nature", "slow-travel"],
            ProductTypeSlugs = ["experience"],
            CategorySlugs = ["nature"],
            TagSlugs = ["slow-travel"],
            AccessibilityConsiderations = "Step-free options where possible.",
            DietaryConsiderations = "Vegetarian.",
        };

    private static async Task<JsonElement> CreateTraveller(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync(
            "/api/v1/customer/travellers",
            new { givenName = "Planner", familyName = "Traveller" },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return await Body(response);
    }

    private async Task<HttpClient> CustomerClient()
    {
        using var issuer = _factory.CreateClient();
        issuer.DefaultRequestHeaders.Add(
            "X-Test-Authentication-Key", ApiApplicationFactory.TestEndpointKey);
        using var response = await issuer.PostAsJsonAsync(
            "/api/v1/access/testing/token",
            new { persona = "customer" },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await Body(response);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
}
