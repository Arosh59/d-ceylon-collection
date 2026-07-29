using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Editorial.Contracts;

namespace D.Ceylon.Api.Endpoints;

internal static partial class EditorialEndpoints
{
    public static RouteGroupBuilder MapEditorialEndpoints(this RouteGroupBuilder versionGroup)
    {
        var editorial = versionGroup.MapGroup("/editorial")
            .WithTags("Editorial")
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicyNames.Public);

        editorial.MapGet("/journal", GetJournalAsync)
            .WithName("GetJournalArticlesV1")
            .Produces<PagedResponse<JournalArticleSummary>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .AddEndpointFilter<ValidationEndpointFilter<PaginationRequest>>();
        editorial.MapGet("/journal/{slug}", GetJournalArticleAsync)
            .WithName("GetJournalArticleBySlugV1")
            .Produces<JournalArticleDetail>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);
        editorial.MapGet("/promotions", GetPromotionsAsync)
            .WithName("GetPromotionsV1")
            .Produces<IReadOnlyList<PromotionResponse>>()
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);

        return versionGroup;
    }

    private static async Task<IResult> GetJournalAsync(
        [AsParameters] PaginationRequest request,
        IEditorialQueries queries,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await queries.GetPublishedJournalAsync(
            request.PageNumber ?? 1,
            request.PageSize ?? 12,
            cancellationToken));

    private static async Task<IResult> GetJournalArticleAsync(
        string slug,
        IEditorialQueries queries,
        CancellationToken cancellationToken)
    {
        if (!SlugPattern().IsMatch(slug))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["The journal slug is invalid."],
            });
        }

        var article = await queries.GetPublishedJournalArticleAsync(slug, cancellationToken);
        return article is null
            ? TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Journal article not found",
                detail: "No published journal article matched the supplied slug.")
            : TypedResults.Ok(article);
    }

    private static async Task<IResult> GetPromotionsAsync(
        IEditorialQueries queries,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await queries.GetPublishedPromotionsAsync(cancellationToken));

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex SlugPattern();
}
