using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.Editorial.Contracts;

public sealed class EditorialUnavailableException(string message) : Exception(message);

public sealed record JournalArticleSummary(
    string Slug,
    string Title,
    string? Summary,
    string? HeroImageUrl,
    DateTimeOffset? PublishedAtUtc);

public sealed record JournalArticleDetail(
    string Slug,
    string Title,
    string? Summary,
    string Content,
    string? HeroImageUrl,
    DateTimeOffset? PublishedAtUtc);

public sealed record PromotionResponse(
    string Id,
    string Title,
    string? Summary,
    string? CallToActionLabel,
    string? CallToActionUrl,
    string? ImageUrl);

public interface IEditorialQueries
{
    Task<PagedResponse<JournalArticleSummary>> GetPublishedJournalAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<JournalArticleDetail?> GetPublishedJournalArticleAsync(
        string slug,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PromotionResponse>> GetPublishedPromotionsAsync(
        CancellationToken cancellationToken);
}
