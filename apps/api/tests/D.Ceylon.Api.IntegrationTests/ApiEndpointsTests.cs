using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class ApiEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task HealthEndpointsReportHealthyDependencies()
    {
        using var liveResponse = await _client.GetAsync(
            "/health/live",
            TestContext.Current.CancellationToken);
        using var readyResponse = await _client.GetAsync(
            "/health/ready",
            TestContext.Current.CancellationToken);

        liveResponse.EnsureSuccessStatusCode();
        readyResponse.EnsureSuccessStatusCode();

        var live = await liveResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var ready = await readyResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Equal("healthy", live.GetProperty("status").GetString());
        Assert.Equal("healthy", ready.GetProperty("status").GetString());
        Assert.Contains(
            ready.GetProperty("checks").EnumerateArray(),
            check => check.GetProperty("name").GetString() == "catalogue-database");
    }

    [Fact]
    public async Task CatalogueListReturnsAnEmptyPaginatedDto()
    {
        using var response = await _client.GetAsync(
            "/api/v1/catalogue/products?pageNumber=1&pageSize=10",
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Equal(JsonValueKind.Array, body.GetProperty("items").ValueKind);
        Assert.Empty(body.GetProperty("items").EnumerateArray());
        Assert.Equal(1, body.GetProperty("pagination").GetProperty("pageNumber").GetInt32());
        Assert.Equal(10, body.GetProperty("pagination").GetProperty("pageSize").GetInt32());
        Assert.Equal(0, body.GetProperty("pagination").GetProperty("totalItems").GetInt64());
        Assert.False(body.TryGetProperty("concurrencyToken", out _));
    }

    [Fact]
    public async Task PaginationDefaultsAreAppliedWhenQueryParametersAreOmitted()
    {
        using var response = await _client.GetAsync(
            "/api/v1/catalogue/product-types",
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Equal(1, body.GetProperty("pagination").GetProperty("pageNumber").GetInt32());
        Assert.Equal(20, body.GetProperty("pagination").GetProperty("pageSize").GetInt32());
    }

    [Fact]
    public async Task InvalidPaginationReturnsProblemDetails()
    {
        using var response = await _client.GetAsync(
            "/api/v1/catalogue/products?pageNumber=0&pageSize=101",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var errors = body.GetProperty("errors");
        Assert.True(errors.TryGetProperty("pageNumber", out _));
        Assert.True(errors.TryGetProperty("pageSize", out _));
        Assert.True(body.TryGetProperty("correlationId", out _));
    }

    [Fact]
    public async Task ResponsesPreserveValidCorrelationAndSecurityHeaders()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/health/live");
        request.Headers.Add("X-Correlation-ID", "integration-test-123");

        using var response = await _client.SendAsync(
            request,
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        Assert.Equal(
            "integration-test-123",
            response.Headers.GetValues("X-Correlation-ID").Single());
        Assert.Equal(
            "nosniff",
            response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal(
            "DENY",
            response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal(
            "no-store",
            response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task OpenApiDescribesVersionedCatalogueRoutes()
    {
        using var response = await _client.GetAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var document = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var paths = document.GetProperty("paths");

        Assert.True(paths.TryGetProperty("/api/v1/catalogue/products", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/products/{slug}", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/product-types", out _));
    }
}
