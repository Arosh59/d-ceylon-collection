using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D.Ceylon.Modules.CustomersTravellers.Domain;
using D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class CustomerRecordsEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task CustomerRecordsRequireAuthenticationAndValidateInput()
    {
        using var anonymous = _factory.CreateClient();
        using var unauthorised = await anonymous.GetAsync(
            "/api/v1/customer/profile",
            TestContext.Current.CancellationToken);

        var token = await IssueCustomerTokenAsync();
        using var client = AuthenticatedClient(token.AccessToken);
        using var invalidProfile = await client.PostAsJsonAsync(
            "/api/v1/customer/profile",
            new
            {
                givenName = "Asha",
                familyName = "Perera",
                preferredLocale = "en-LK",
                preferredContactMethod = "phone",
                marketingConsent = false,
            },
            TestContext.Current.CancellationToken);
        using var invalidTraveller = await client.PostAsJsonAsync(
            "/api/v1/customer/travellers",
            new
            {
                givenName = "Maya",
                familyName = "Perera",
                emergencyContactName = "Asha",
            },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, unauthorised.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidProfile.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidTraveller.StatusCode);
        Assert.Equal(
            "application/problem+json",
            invalidTraveller.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task CustomerOwnsProfileTravellersWishlistAndSavedItineraries()
    {
        var token = await IssueCustomerTokenAsync();
        Assert.NotNull(token.CustomerId);
        using var client = AuthenticatedClient(token.AccessToken);

        using var profileCreate = await client.PostAsJsonAsync(
            "/api/v1/customer/profile",
            new
            {
                givenName = "Asha",
                familyName = "Perera",
                contactEmail = "asha@example.test",
                countryCode = "lk",
                preferredLocale = "en-LK",
                preferredContactMethod = "email",
                marketingConsent = false,
            },
            TestContext.Current.CancellationToken);
        profileCreate.EnsureSuccessStatusCode();
        var profile = await BodyAsync(profileCreate);
        Assert.Equal("LK", profile.GetProperty("countryCode").GetString());

        var firstTraveller = await CreateTravellerAsync(client, "Maya", "Perera");
        _ = await CreateTravellerAsync(client, "Nimal", "Silva");
        using var travellersPage = await client.GetAsync(
            "/api/v1/customer/travellers?pageNumber=1&pageSize=1",
            TestContext.Current.CancellationToken);
        travellersPage.EnsureSuccessStatusCode();
        var page = await BodyAsync(travellersPage);
        Assert.Equal(
            2,
            page.GetProperty("pagination").GetProperty("totalItems").GetInt64());
        Assert.Single(page.GetProperty("items").EnumerateArray());

        var travellerId = firstTraveller.GetProperty("id").GetGuid();
        var staleToken = firstTraveller.GetProperty("concurrencyToken").GetGuid();
        using var travellerUpdate = await client.PutAsJsonAsync(
            $"/api/v1/customer/travellers/{travellerId}",
            new
            {
                givenName = "Maya",
                familyName = "Perera",
                dietaryNeeds = "Vegetarian meals only",
                concurrencyToken = staleToken,
            },
            TestContext.Current.CancellationToken);
        travellerUpdate.EnsureSuccessStatusCode();
        using var staleUpdate = await client.PutAsJsonAsync(
            $"/api/v1/customer/travellers/{travellerId}",
            new
            {
                givenName = "Maya",
                familyName = "Perera",
                concurrencyToken = staleToken,
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, staleUpdate.StatusCode);
        var conflict = await BodyAsync(staleUpdate);
        Assert.True(conflict.TryGetProperty("correlationId", out _));

        using var wishlistCreate = await client.PostAsJsonAsync(
            "/api/v1/customer/wishlist",
            new
            {
                productSlug = "tea-country-rail-estate-walk",
                note = "Consider for the highlands.",
            },
            TestContext.Current.CancellationToken);
        wishlistCreate.EnsureSuccessStatusCode();
        using var duplicateWishlist = await client.PostAsJsonAsync(
            "/api/v1/customer/wishlist",
            new
            {
                productSlug = "tea-country-rail-estate-walk",
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, duplicateWishlist.StatusCode);

        using var itineraryCreate = await client.PostAsJsonAsync(
            "/api/v1/customer/saved-itineraries",
            new
            {
                title = "Highlands foundation",
                summary = "A private planning note, not a generated itinerary.",
                travelStartDate = "2027-02-10",
                travelEndDate = "2027-02-15",
                primaryDestinationSlug = "ella",
            },
            TestContext.Current.CancellationToken);
        itineraryCreate.EnsureSuccessStatusCode();
        using var itineraryList = await client.GetAsync(
            "/api/v1/customer/saved-itineraries?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        itineraryList.EnsureSuccessStatusCode();
        var itineraries = await BodyAsync(itineraryList);
        Assert.Single(itineraries.GetProperty("items").EnumerateArray());

        var otherTravellerId = await InsertTravellerForAnotherCustomerAsync();
        using var crossCustomer = await client.GetAsync(
            $"/api/v1/customer/travellers/{otherTravellerId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, crossCustomer.StatusCode);

        using var profileDelete = await client.DeleteAsync(
            $"/api/v1/customer/profile?concurrencyToken={profile.GetProperty("concurrencyToken").GetGuid()}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, profileDelete.StatusCode);
        using var missingProfile = await client.GetAsync(
            "/api/v1/customer/profile",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, missingProfile.StatusCode);

        await AssertAuditEventsAsync();
    }

    [Fact]
    public async Task PhaseSixIndexesAndMigrationAreApplied()
    {
        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'customers_travellers'
            """;
        await using var reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
        {
            indexes.Add(reader.GetString(0));
        }

        Assert.Contains("ux_customer_profiles_customer_id", indexes);
        Assert.Contains("ix_travellers_customer_name", indexes);
        Assert.Contains("ux_wishlist_entries_customer_product", indexes);
        Assert.Contains("ix_saved_itineraries_customer_archived_updated", indexes);
    }

    private static async Task<JsonElement> CreateTravellerAsync(
        HttpClient client,
        string givenName,
        string familyName)
    {
        using var response = await client.PostAsJsonAsync(
            "/api/v1/customer/travellers",
            new
            {
                givenName,
                familyName,
            },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return await BodyAsync(response);
    }

    private async Task<Guid> InsertTravellerForAnotherCustomerAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var database =
            scope.ServiceProvider.GetRequiredService<CustomersTravellersDbContext>();
        var traveller = new Traveller(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Other",
            "Customer",
            null,
            null,
            null,
            null,
            null);
        database.Travellers.Add(traveller);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        return traveller.Id;
    }

    private async Task AssertAuditEventsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        var eventTypes = await database.SecurityAuditEvents
            .Select(item => item.EventType)
            .ToListAsync(TestContext.Current.CancellationToken);

        Assert.Contains("customer-profile-created", eventTypes);
        Assert.Contains("customer-profile-deleted", eventTypes);
        Assert.Contains("traveller-created", eventTypes);
        Assert.Contains("traveller-updated", eventTypes);
        Assert.Contains("wishlist-entry-created", eventTypes);
        Assert.Contains("saved-itinerary-created", eventTypes);
    }

    private HttpClient AuthenticatedClient(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private async Task<TestTokenResponse> IssueCustomerTokenAsync()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            "X-Test-Authentication-Key",
            ApiApplicationFactory.TestEndpointKey);
        using var response = await client.PostAsJsonAsync(
            "/api/v1/access/testing/token",
            new { persona = "customer" },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await BodyAsync(response);
        var identity = body.GetProperty("identity");
        return new TestTokenResponse(
            body.GetProperty("accessToken").GetString()!,
            identity.GetProperty("customerId").GetGuid());
    }

    private static async Task<JsonElement> BodyAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

    private sealed record TestTokenResponse(string AccessToken, Guid? CustomerId);
}
