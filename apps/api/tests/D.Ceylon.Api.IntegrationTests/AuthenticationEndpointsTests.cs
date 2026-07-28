using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class AuthenticationEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task ProtectedEndpointRequiresBearerTokenAndReturnsProblemDetails()
    {
        using var client = _factory.CreateClient();
        using var response = await client.GetAsync(
            "/api/v1/access/me",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(401, body.GetProperty("status").GetInt32());
        Assert.True(body.TryGetProperty("correlationId", out _));
    }

    [Fact]
    public async Task InvalidBearerTokenIsRejected()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "not-a-jwt");

        using var response = await client.GetAsync(
            "/api/v1/access/me",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExpiredBearerTokenIsRejected()
    {
        var issuer = _factory.Services.GetRequiredService<ITestingTokenIssuer>();
        var expired = issuer.Issue("customer", TimeSpan.FromMinutes(-1));
        using var client = AuthenticatedClient(expired.AccessToken);

        using var response = await client.GetAsync(
            "/api/v1/access/me",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CustomerTokenSupportsCurrentAccessAndEnforcesOwnership()
    {
        var token = await IssueTokenAsync("customer");
        using var client = AuthenticatedClient(token.AccessToken);

        using var me = await client.GetAsync(
            "/api/v1/access/me",
            TestContext.Current.CancellationToken);
        using var owned = await client.GetAsync(
            $"/api/v1/access/customer/{token.CustomerId}",
            TestContext.Current.CancellationToken);
        using var another = await client.GetAsync(
            $"/api/v1/access/customer/{Guid.NewGuid()}",
            TestContext.Current.CancellationToken);
        using var agent = await client.GetAsync(
            "/api/v1/access/agent/20000000-0000-0000-0000-000000000001",
            TestContext.Current.CancellationToken);

        me.EnsureSuccessStatusCode();
        owned.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, another.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, agent.StatusCode);
        Assert.Equal(
            "application/problem+json",
            another.Content.Headers.ContentType?.MediaType);
        var forbidden = await another.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.True(forbidden.TryGetProperty("correlationId", out _));
        var current = await me.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Contains(
            current.GetProperty("roles").EnumerateArray(),
            role => role.GetString() == "customer");
    }

    [Fact]
    public async Task AgentTokenCannotCrossOrganisationBoundary()
    {
        var token = await IssueTokenAsync("agent");
        using var client = AuthenticatedClient(token.AccessToken);

        using var owned = await client.GetAsync(
            $"/api/v1/access/agent/{token.OrganisationId}",
            TestContext.Current.CancellationToken);
        using var another = await client.GetAsync(
            $"/api/v1/access/agent/{Guid.NewGuid()}",
            TestContext.Current.CancellationToken);

        owned.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, another.StatusCode);
    }

    [Fact]
    public async Task TestingTokenEndpointRequiresKeyAndWritesAuditEvents()
    {
        using var client = _factory.CreateClient();
        using var denied = await client.PostAsJsonAsync(
            "/api/v1/access/testing/token",
            new { persona = "customer" },
            TestContext.Current.CancellationToken);
        var issued = await IssueTokenAsync("agent");

        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(issued.AccessToken));

        await using var scope = _factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        var auditEvents = await database.SecurityAuditEvents
            .OrderBy(item => item.OccurredAtUtc)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains(auditEvents, item => item.Outcome == "denied");
        Assert.Contains(
            auditEvents,
            item => item.Outcome == "issued" && item.Subject == "test-agent");
    }

    [Fact]
    public async Task PhaseFiveIndexesAreApplied()
    {
        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT schemaname, indexname
            FROM pg_indexes
            WHERE schemaname IN ('identity_access', 'organisations_agents')
            """;
        await using var reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
        {
            indexes.Add($"{reader.GetString(0)}.{reader.GetString(1)}");
        }

        Assert.Contains("identity_access.ux_users_issuer_subject", indexes);
        Assert.Contains("identity_access.ux_customers_user_id", indexes);
        Assert.Contains(
            "identity_access.ix_security_audit_events_subject_occurred_at",
            indexes);
        Assert.Contains(
            "organisations_agents.ux_organisation_users_organisation_user",
            indexes);
        Assert.Contains("organisations_agents.ix_agents_organisation_active", indexes);
    }

    private HttpClient AuthenticatedClient(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private async Task<TestTokenResponse> IssueTokenAsync(string persona)
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            "X-Test-Authentication-Key",
            ApiApplicationFactory.TestEndpointKey);
        using var response = await client.PostAsJsonAsync(
            "/api/v1/access/testing/token",
            new { persona },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var identity = body.GetProperty("identity");
        return new TestTokenResponse(
            body.GetProperty("accessToken").GetString()!,
            identity.TryGetProperty("customerId", out var customer)
                && customer.ValueKind != JsonValueKind.Null
                    ? customer.GetGuid()
                    : null,
            identity.TryGetProperty("organisationId", out var organisation)
                && organisation.ValueKind != JsonValueKind.Null
                    ? organisation.GetGuid()
                    : null);
    }

    private sealed record TestTokenResponse(
        string AccessToken,
        Guid? CustomerId,
        Guid? OrganisationId);
}
