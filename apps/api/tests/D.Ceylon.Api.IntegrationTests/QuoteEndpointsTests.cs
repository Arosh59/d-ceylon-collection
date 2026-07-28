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

public sealed class QuoteEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private static readonly string[] EllaDestination = ["ella"];
    private static readonly string[] NatureInterest = ["nature"];
    private static readonly string[] ExperienceProductType = ["experience"];
    private static readonly string[] NatureCategory = ["nature"];
    private static readonly string[] SlowTravelTag = ["slow-travel"];

    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task QuoteWorkflowVersionsPricesAndAuditsCommercialTransitions()
    {
        using var customer = await AuthenticatedClient("customer");
        var plan = await CreatePlan(customer);
        var quote = await RequestQuote(customer, plan);
        var quoteId = quote.GetProperty("id").GetGuid();

        using var agent = await AuthenticatedClient("agent");
        using var queueResponse = await agent.GetAsync(
            "/api/v1/agent/quotes?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        queueResponse.EnsureSuccessStatusCode();
        var queue = await Body(queueResponse);
        Assert.Contains(
            queue.GetProperty("items").EnumerateArray(),
            item => item.GetProperty("id").GetGuid() == quoteId
                && item.GetProperty("isUnassigned").GetBoolean());

        using var preparedResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/prepare",
            new
            {
                currency = "USD",
                concurrencyToken = quote.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        preparedResponse.EnsureSuccessStatusCode();
        var prepared = await Body(preparedResponse);

        using var updatedResponse = await agent.PutAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/draft",
            DraftRequest(
                prepared.GetProperty("concurrencyToken").GetGuid(),
                "Private Sri Lanka journey",
                1250m),
            TestContext.Current.CancellationToken);
        updatedResponse.EnsureSuccessStatusCode();
        var updated = await Body(updatedResponse);
        Assert.Equal(
            1345m,
            updated.GetProperty("draft").GetProperty("grandTotal").GetProperty("amount")
                .GetDecimal());

        using var sentResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/send",
            new
            {
                expiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                concurrencyToken = updated.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        sentResponse.EnsureSuccessStatusCode();
        var sent = await Body(sentResponse);
        var firstVersion = sent.GetProperty("versions")[0];
        Assert.Equal("sent", sent.GetProperty("status").GetString());
        Assert.Equal(1345m, firstVersion.GetProperty("grandTotal").GetProperty("amount").GetDecimal());
        Assert.Equal("USD", firstVersion.GetProperty("currency").GetString());

        using var customerDetailResponse = await customer.GetAsync(
            $"/api/v1/customer/quotes/{quoteId}",
            TestContext.Current.CancellationToken);
        customerDetailResponse.EnsureSuccessStatusCode();
        var customerDetailText = await customerDetailResponse.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);
        using var customerDocument = JsonDocument.Parse(customerDetailText);
        var customerDetail = customerDocument.RootElement.Clone();
        Assert.False(customerDetail.TryGetProperty("draft", out _));
        Assert.DoesNotContain(
            "Agent-only",
            customerDetailText,
            StringComparison.Ordinal);

        using var declinedResponse = await customer.PostAsJsonAsync(
            $"/api/v1/customer/quotes/{quoteId}/decline",
            new
            {
                versionId = firstVersion.GetProperty("id").GetGuid(),
                concurrencyToken = customerDetail.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        declinedResponse.EnsureSuccessStatusCode();
        var declined = await Body(declinedResponse);
        Assert.Equal("declined", declined.GetProperty("status").GetString());

        using var reviseResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/revise",
            new { concurrencyToken = declined.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        reviseResponse.EnsureSuccessStatusCode();
        var revised = await Body(reviseResponse);

        using var secondDraftResponse = await agent.PutAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/draft",
            DraftRequest(
                revised.GetProperty("concurrencyToken").GetGuid(),
                "Revised private Sri Lanka journey",
                1400m),
            TestContext.Current.CancellationToken);
        secondDraftResponse.EnsureSuccessStatusCode();
        var secondDraft = await Body(secondDraftResponse);
        using var secondSentResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/send",
            new
            {
                expiresAtUtc = DateTimeOffset.UtcNow.AddDays(45),
                concurrencyToken = secondDraft.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        secondSentResponse.EnsureSuccessStatusCode();
        var secondSent = await Body(secondSentResponse);
        var versions = secondSent.GetProperty("versions").EnumerateArray().ToArray();
        Assert.Equal(2, versions.Length);
        Assert.Equal(
            "Private Sri Lanka journey",
            versions[0].GetProperty("lines")[0].GetProperty("title").GetString());
        Assert.Equal(
            1250m,
            versions[0].GetProperty("lines")[0].GetProperty("unitPrice")
                .GetProperty("amount").GetDecimal());
        Assert.Equal(
            "Revised private Sri Lanka journey",
            versions[1].GetProperty("lines")[0].GetProperty("title").GetString());

        using var refreshedCustomerResponse = await customer.GetAsync(
            $"/api/v1/customer/quotes/{quoteId}",
            TestContext.Current.CancellationToken);
        refreshedCustomerResponse.EnsureSuccessStatusCode();
        var refreshedCustomer = await Body(refreshedCustomerResponse);
        using var acceptedResponse = await customer.PostAsJsonAsync(
            $"/api/v1/customer/quotes/{quoteId}/accept",
            new
            {
                versionId = versions[1].GetProperty("id").GetGuid(),
                concurrencyToken = refreshedCustomer.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        acceptedResponse.EnsureSuccessStatusCode();
        var accepted = await Body(acceptedResponse);
        Assert.Equal("accepted", accepted.GetProperty("status").GetString());

        using var invalidWithdraw = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/withdraw",
            new { concurrencyToken = accepted.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, invalidWithdraw.StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var audit = scope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        var events = await audit.SecurityAuditEvents
            .Select(item => item.EventType)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains("quote-request-created", events);
        Assert.Contains("quote-version-sent", events);
        Assert.Contains("quote-declined", events);
        Assert.Contains("quote-accepted", events);
    }

    [Fact]
    public async Task AuthenticationOwnershipValidationConcurrencyAndIndexesAreEnforced()
    {
        using var anonymous = _factory.CreateClient();
        using var denied = await anonymous.GetAsync(
            "/api/v1/customer/quotes",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);

        using var customer = await AuthenticatedClient("customer");
        var plan = await CreatePlan(customer);
        var quote = await RequestQuote(customer, plan);
        var quoteId = quote.GetProperty("id").GetGuid();
        using var agent = await AuthenticatedClient("agent");
        using var preparedResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/prepare",
            new
            {
                currency = "USD",
                concurrencyToken = quote.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        preparedResponse.EnsureSuccessStatusCode();
        var prepared = await Body(preparedResponse);

        using var invalidDraft = await agent.PutAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/draft",
            new
            {
                currency = "BTC",
                terms = "",
                lines = Array.Empty<object>(),
                components = Array.Empty<object>(),
                concurrencyToken = prepared.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, invalidDraft.StatusCode);
        Assert.Equal(
            "application/problem+json",
            invalidDraft.Content.Headers.ContentType?.MediaType);

        using var stalePrepare = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/prepare",
            new
            {
                currency = "USD",
                concurrencyToken = quote.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, stalePrepare.StatusCode);

        using var otherCustomer = await AuthenticatedClient("customer-other");
        using var crossCustomer = await otherCustomer.GetAsync(
            $"/api/v1/customer/quotes/{quoteId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, crossCustomer.StatusCode);

        using var otherAgent = await AuthenticatedClient("agent-other");
        using var crossOrganisation = await otherAgent.GetAsync(
            $"/api/v1/agent/quotes/{quoteId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, crossOrganisation.StatusCode);

        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'quotes'
            """;
        await using var reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
            indexes.Add(reader.GetString(0));
        Assert.Contains("ux_quote_requests_customer_revision", indexes);
        Assert.Contains("ix_quotes_customer_status_updated", indexes);
        Assert.Contains("ix_quotes_organisation_status_updated", indexes);
        Assert.Contains("ix_quotes_status_expiry", indexes);
        Assert.Contains("ux_quote_versions_quote_number", indexes);
    }

    [Fact]
    public async Task SentQuoteExpiresDeterministicallyWhenItsDeadlinePasses()
    {
        using var customer = await AuthenticatedClient("customer");
        var plan = await CreatePlan(customer);
        var quote = await RequestQuote(customer, plan);
        var quoteId = quote.GetProperty("id").GetGuid();

        using var agent = await AuthenticatedClient("agent");
        using var preparedResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/prepare",
            new
            {
                currency = "USD",
                concurrencyToken = quote.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        preparedResponse.EnsureSuccessStatusCode();
        var prepared = await Body(preparedResponse);

        using var draftResponse = await agent.PutAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/draft",
            DraftRequest(
                prepared.GetProperty("concurrencyToken").GetGuid(),
                "Expiring private journey",
                900m),
            TestContext.Current.CancellationToken);
        draftResponse.EnsureSuccessStatusCode();
        var draft = await Body(draftResponse);

        using var sentResponse = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/send",
            new
            {
                expiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
                concurrencyToken = draft.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        sentResponse.EnsureSuccessStatusCode();

        await using (var connection = new NpgsqlConnection(_factory.ConnectionString))
        {
            await connection.OpenAsync(TestContext.Current.CancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText =
                """
                UPDATE quotes.quotes
                SET current_expires_at_utc = NOW() - INTERVAL '1 day'
                WHERE id = @quoteId
                """;
            command.Parameters.AddWithValue("quoteId", quoteId);
            Assert.Equal(
                1,
                await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken));
        }

        using var expiredResponse = await customer.GetAsync(
            $"/api/v1/customer/quotes/{quoteId}",
            TestContext.Current.CancellationToken);
        expiredResponse.EnsureSuccessStatusCode();
        var expired = await Body(expiredResponse);
        Assert.Equal("expired", expired.GetProperty("status").GetString());

        using var rejectedAcceptance = await customer.PostAsJsonAsync(
            $"/api/v1/customer/quotes/{quoteId}/accept",
            new
            {
                versionId = expired.GetProperty("currentVersionId").GetGuid(),
                concurrencyToken = expired.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, rejectedAcceptance.StatusCode);
    }

    private static async Task<JsonElement> CreatePlan(HttpClient customer)
    {
        using var response = await customer.PostAsJsonAsync(
            "/api/v1/customer/travel-plans",
            new
            {
                title = $"Reviewed quote draft {Guid.NewGuid():N}",
                travelStartDate = "2027-05-10",
                travelEndDate = "2027-05-12",
                pace = "balanced",
                destinationSlugs = EllaDestination,
                travellerIds = Array.Empty<Guid>(),
                interests = NatureInterest,
                productTypeSlugs = ExperienceProductType,
                categorySlugs = NatureCategory,
                tagSlugs = SlowTravelTag,
            },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return await Body(response);
    }

    private static async Task<JsonElement> RequestQuote(
        HttpClient customer,
        JsonElement plan)
    {
        using var response = await customer.PostAsJsonAsync(
            "/api/v1/customer/quotes",
            new
            {
                travelPlanId = plan.GetProperty("id").GetGuid(),
                itineraryRevisionId = plan.GetProperty("currentRevision")
                    .GetProperty("id").GetGuid(),
                customerNotes = "Please prepare a transparent itemized quote.",
            },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return await Body(response);
    }

    private static object DraftRequest(Guid concurrencyToken, string title, decimal amount) =>
        new
        {
            currency = "USD",
            assumptions = new[] { "Subject to supplier confirmation." },
            inclusions = new[] { "Private ground transport." },
            exclusions = new[] { "International flights." },
            terms = "This sent quote is not a booking or payment confirmation.",
            internalNotes = "Agent-only preparation context.",
            lines = new[]
            {
                new
                {
                    title,
                    description = "Reviewed itinerary services.",
                    quantity = 1m,
                    unitAmount = amount,
                },
            },
            components = new object[]
            {
                new { kind = "tax", label = "Local taxes", amount = 100m },
                new { kind = "adjustment", label = "Collection adjustment", amount = -5m },
            },
            concurrencyToken,
        };

    private async Task<HttpClient> AuthenticatedClient(string persona)
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
        var body = await Body(response);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            body.GetProperty("accessToken").GetString());
        return client;
    }

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
}
