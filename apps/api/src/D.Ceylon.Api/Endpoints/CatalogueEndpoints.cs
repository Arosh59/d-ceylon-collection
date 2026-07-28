using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static partial class CatalogueEndpoints
{
    public static RouteGroupBuilder MapCatalogueEndpoints(this RouteGroupBuilder versionGroup)
    {
        ArgumentNullException.ThrowIfNull(versionGroup);

        var catalogue = versionGroup
            .MapGroup("/catalogue")
            .WithTags("Catalogue")
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicyNames.Public);

        catalogue
            .MapGet("/products", GetProductsAsync)
            .WithName("GetProductsV1")
            .WithSummary("Searches and filters published catalogue products.")
            .Produces<PagedResponse<ProductSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<ProductDiscoveryRequest>>();

        catalogue
            .MapGet("/products/{slug}", GetProductAsync)
            .WithName("GetProductBySlugV1")
            .WithSummary("Gets one published product by slug.")
            .Produces<ProductDetailResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        MapPagedReference(
            catalogue,
            "/product-types",
            "GetProductTypesV1",
            "Gets product types.",
            GetProductTypesAsync)
            .Produces<PagedResponse<ProductTypeResponse>>();
        MapPagedReference(
            catalogue,
            "/categories",
            "GetCategoriesV1",
            "Gets catalogue categories.",
            GetCategoriesAsync)
            .Produces<PagedResponse<NamedReferenceResponse>>();
        MapPagedReference(
            catalogue,
            "/tags",
            "GetTagsV1",
            "Gets catalogue tags.",
            GetTagsAsync)
            .Produces<PagedResponse<NamedReferenceResponse>>();

        catalogue
            .MapGet("/collections", GetCollectionsAsync)
            .WithName("GetCollectionsV1")
            .WithSummary("Gets published travel collections.")
            .Produces<PagedResponse<CollectionSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();
        catalogue
            .MapGet("/collections/{slug}", GetCollectionAsync)
            .WithName("GetCollectionBySlugV1")
            .WithSummary("Gets one published travel collection.")
            .Produces<CollectionDetailResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        catalogue
            .MapGet("/destinations", GetDestinationsAsync)
            .WithName("GetDestinationsV1")
            .WithSummary("Gets published destinations.")
            .Produces<PagedResponse<DestinationSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();
        catalogue
            .MapGet("/destinations/{slug}", GetDestinationAsync)
            .WithName("GetDestinationBySlugV1")
            .WithSummary("Gets one published destination.")
            .Produces<DestinationDetailResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        return versionGroup;
    }

    private static async Task<IResult> GetProductsAsync(
        [AsParameters] ProductDiscoveryRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        var response = await queries.SearchPublishedProductsAsync(
            new CatalogueSearchCriteria(
                request.PageNumber ?? 1,
                request.PageSize ?? 12,
                Normalize(request.Query),
                Normalize(request.ProductType),
                Normalize(request.Category),
                Normalize(request.Collection),
                Normalize(request.Destination),
                Normalize(request.Tag),
                request.MinimumPrice,
                request.MaximumPrice,
                request.MinimumDurationMinutes,
                request.MaximumDurationMinutes,
                request.Sort ?? "name"),
            cancellationToken);

        return TypedResults.Ok(response);
    }

    private static async Task<IResult> GetProductAsync(
        string slug,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        if (!SlugPattern().IsMatch(slug))
        {
            return InvalidSlug();
        }

        var response = await queries.GetPublishedProductAsync(slug, cancellationToken);
        return response is null
            ? NotFound("Product not found", "No published product matched the supplied slug.")
            : TypedResults.Ok(response);
    }

    private static Task<IResult> GetProductTypesAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken) =>
        ToOkAsync(queries.GetProductTypesAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken));

    private static Task<IResult> GetCategoriesAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken) =>
        ToOkAsync(queries.GetCategoriesAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken));

    private static Task<IResult> GetTagsAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken) =>
        ToOkAsync(queries.GetTagsAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken));

    private static Task<IResult> GetCollectionsAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken) =>
        ToOkAsync(queries.GetCollectionsAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken));

    private static async Task<IResult> GetCollectionAsync(
        string slug,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        if (!SlugPattern().IsMatch(slug))
        {
            return InvalidSlug();
        }

        var response = await queries.GetCollectionAsync(slug, cancellationToken);
        return response is null
            ? NotFound(
                "Collection not found",
                "No published collection matched the supplied slug.")
            : TypedResults.Ok(response);
    }

    private static Task<IResult> GetDestinationsAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken) =>
        ToOkAsync(queries.GetDestinationsAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken));

    private static async Task<IResult> GetDestinationAsync(
        string slug,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        if (!SlugPattern().IsMatch(slug))
        {
            return InvalidSlug();
        }

        var response = await queries.GetDestinationAsync(slug, cancellationToken);
        return response is null
            ? NotFound(
                "Destination not found",
                "No published destination matched the supplied slug.")
            : TypedResults.Ok(response);
    }

    private static RouteHandlerBuilder MapPagedReference(
        RouteGroupBuilder group,
        string pattern,
        string name,
        string summary,
        Delegate handler) =>
        group.MapGet(pattern, handler)
            .WithName(name)
            .WithSummary(summary)
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();

    private static async Task<IResult> ToOkAsync<T>(Task<T> response) =>
        TypedResults.Ok(await response);

    private static ValidationProblem InvalidSlug() =>
        TypedResults.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["slug"] = ["Slug format is invalid."],
            });

    private static ProblemHttpResult NotFound(string title, string detail) =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: title,
            detail: detail,
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex SlugPattern();
}

internal class PaginationRequest
{
    [Range(1, 100_000)]
    public int? PageNumber { get; init; }

    [Range(1, 100)]
    public int? PageSize { get; init; }
}

internal sealed class ProductDiscoveryRequest : PaginationRequest, IValidatableObject
{
    [StringLength(100, MinimumLength = 2)]
    public string? Query { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? ProductType { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Category { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Collection { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Destination { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Tag { get; init; }

    [Range(typeof(decimal), "0", "100000000")]
    public decimal? MinimumPrice { get; init; }

    [Range(typeof(decimal), "0", "100000000")]
    public decimal? MaximumPrice { get; init; }

    [Range(1, 525_600)]
    public int? MinimumDurationMinutes { get; init; }

    [Range(1, 525_600)]
    public int? MaximumDurationMinutes { get; init; }

    [RegularExpression("^(name|price-asc|price-desc|duration-asc)$")]
    public string? Sort { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinimumPrice > MaximumPrice)
        {
            yield return new ValidationResult(
                "Minimum price cannot exceed maximum price.",
                [nameof(MinimumPrice), nameof(MaximumPrice)]);
        }

        if (MinimumDurationMinutes > MaximumDurationMinutes)
        {
            yield return new ValidationResult(
                "Minimum duration cannot exceed maximum duration.",
                [nameof(MinimumDurationMinutes), nameof(MaximumDurationMinutes)]);
        }
    }
}
