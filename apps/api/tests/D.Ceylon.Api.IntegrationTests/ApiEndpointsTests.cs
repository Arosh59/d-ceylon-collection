using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class ApiEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly string _connectionString = factory.ConnectionString;

    [Fact]
    public async Task CatalogueDiscoveryIndexesAreApplied()
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'catalogue'
            """;
        await using var reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);
        var indexes = new List<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
        {
            indexes.Add(reader.GetString(0));
        }

        Assert.Contains("ix_products_search_vector", indexes);
        Assert.Contains("ix_products_publication_state_name", indexes);
        Assert.Contains("ix_product_media_product_id_sort_order", indexes);
        Assert.Contains("ix_product_tags_tag_id", indexes);
    }

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
    public async Task CatalogueListReturnsSeededPaginatedDtos()
    {
        using var response = await _client.GetAsync(
            "/api/v1/catalogue/products?pageNumber=1&pageSize=10",
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Equal(JsonValueKind.Array, body.GetProperty("items").ValueKind);
        Assert.Equal(10, body.GetProperty("items").GetArrayLength());
        Assert.Equal(1, body.GetProperty("pagination").GetProperty("pageNumber").GetInt32());
        Assert.Equal(10, body.GetProperty("pagination").GetProperty("pageSize").GetInt32());
        Assert.Equal(10, body.GetProperty("pagination").GetProperty("totalItems").GetInt64());
        Assert.False(body.TryGetProperty("concurrencyToken", out _));
    }

    [Fact]
    public async Task ProductDiscoverySupportsSearchFiltersPaginationAndEmptyResults()
    {
        using var searchResponse = await _client.GetAsync(
            "/api/v1/catalogue/products?query=railway&collection=flow&pageSize=2",
            TestContext.Current.CancellationToken);
        using var filterResponse = await _client.GetAsync(
            "/api/v1/catalogue/products?productType=accommodation&destination=ella",
            TestContext.Current.CancellationToken);
        using var emptyResponse = await _client.GetAsync(
            "/api/v1/catalogue/products?tag=active&destination=tangalle",
            TestContext.Current.CancellationToken);

        searchResponse.EnsureSuccessStatusCode();
        filterResponse.EnsureSuccessStatusCode();
        emptyResponse.EnsureSuccessStatusCode();

        var search = await searchResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var filter = await filterResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var empty = await emptyResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Contains(
            search.GetProperty("items").EnumerateArray(),
            item => item.GetProperty("slug").GetString() == "tea-country-rail-estate-walk");
        Assert.Single(filter.GetProperty("items").EnumerateArray());
        Assert.Equal(
            "ella-canopy-hideaway",
            filter.GetProperty("items")[0].GetProperty("slug").GetString());
        Assert.Empty(empty.GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task PublishedDiscoveryResourcesAndDetailsAreDtoOnly()
    {
        using var collectionsResponse = await _client.GetAsync(
            "/api/v1/catalogue/collections",
            TestContext.Current.CancellationToken);
        using var destinationResponse = await _client.GetAsync(
            "/api/v1/catalogue/destinations/ella",
            TestContext.Current.CancellationToken);
        using var productResponse = await _client.GetAsync(
            "/api/v1/catalogue/products/ella-canopy-hideaway",
            TestContext.Current.CancellationToken);

        collectionsResponse.EnsureSuccessStatusCode();
        destinationResponse.EnsureSuccessStatusCode();
        productResponse.EnsureSuccessStatusCode();

        var collections = await collectionsResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var destination = await destinationResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var product = await productResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        Assert.Equal(5, collections.GetProperty("items").GetArrayLength());
        Assert.Equal("ella", destination.GetProperty("slug").GetString());
        Assert.Equal("placeholder:ella", destination.GetProperty("heroMedia").GetProperty("assetKey").GetString());
        Assert.Equal("placeholder:ella-canopy-hideaway", product.GetProperty("media")[0].GetProperty("assetKey").GetString());
        Assert.False(product.TryGetProperty("publicationState", out _));
        Assert.False(product.TryGetProperty("concurrencyToken", out _));
    }

    [Fact]
    public async Task InvalidDiscoveryRangesReturnCorrelatedProblemDetails()
    {
        using var response = await _client.GetAsync(
            "/api/v1/catalogue/products?minimumPrice=500&maximumPrice=100&query=rail",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var errors = body.GetProperty("errors");
        Assert.True(errors.TryGetProperty("minimumPrice", out _));
        Assert.True(errors.TryGetProperty("maximumPrice", out _));
        Assert.True(body.TryGetProperty("correlationId", out _));
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
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/categories", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/tags", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/collections", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/collections/{slug}", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/destinations", out _));
        Assert.True(paths.TryGetProperty("/api/v1/catalogue/destinations/{slug}", out _));
    }
}
