using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace D.Ceylon.Api.Endpoints;

internal static partial class CatalogueEndpoints
{
    public static RouteGroupBuilder MapCatalogueEndpoints(this RouteGroupBuilder versionGroup)
    {
        ArgumentNullException.ThrowIfNull(versionGroup);

        var catalogue = versionGroup
            .MapGroup("/catalogue")
            .WithTags("Catalogue")
            .RequireRateLimiting(RateLimitPolicyNames.Public);

        catalogue
            .MapGet("/products", GetProductsAsync)
            .WithName("GetProductsV1")
            .WithSummary("Gets a page of published products.")
            .Produces<PagedResponse<ProductSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();

        catalogue
            .MapGet("/products/{slug}", GetProductAsync)
            .WithName("GetProductBySlugV1")
            .WithSummary("Gets one published product by slug.")
            .Produces<ProductDetailResponse>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        catalogue
            .MapGet("/product-types", GetProductTypesAsync)
            .WithName("GetProductTypesV1")
            .WithSummary("Gets a page of product types.")
            .Produces<PagedResponse<ProductTypeResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();

        return versionGroup;
    }

    private static async Task<IResult> GetProductsAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        var response = await queries.GetPublishedProductsAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
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
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["slug"] = ["Slug format is invalid."],
                });
        }

        var response = await queries.GetPublishedProductAsync(slug, cancellationToken);
        return response is null
            ? TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Product not found",
                detail: "No published product matched the supplied slug.",
                type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found")
            : TypedResults.Ok(response);
    }

    private static async Task<IResult> GetProductTypesAsync(
        [AsParameters] PaginationRequest request,
        ICatalogueQueries queries,
        CancellationToken cancellationToken)
    {
        var response = await queries.GetProductTypesAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 20,
            cancellationToken);

        return TypedResults.Ok(response);
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex SlugPattern();
}

internal sealed class PaginationRequest
{
    [Range(1, 100_000)]
    public int? PageNumber { get; init; }

    [Range(1, 100)]
    public int? PageSize { get; init; }
}
