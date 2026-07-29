using System.Net.Http.Headers;
using System.Text.Json;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Editorial.Contracts;
using Microsoft.Extensions.Options;

namespace D.Ceylon.Modules.Editorial.Application;

internal sealed class DirectusEditorialQueries(
    IHttpClientFactory httpClientFactory,
    IOptions<DirectusEditorialOptions> options)
    : IEditorialQueries
{
    public async Task<PagedResponse<JournalArticleSummary>> GetPublishedJournalAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var offset = (pageNumber - 1) * pageSize;
        var response = await GetAsync<DirectusList<DirectusJournalArticle>>(
            $"items/journal_articles?filter[status][_eq]=published&sort=-date_published&limit={pageSize}&offset={offset}&meta=filter_count&fields=slug,title,summary,hero_image,date_published",
            cancellationToken);
        var total = response.Meta?.FilterCount ?? response.Data.Count;

        return PagedResponse.Create(
            response.Data.Select(ToSummary).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<JournalArticleDetail?> GetPublishedJournalArticleAsync(
        string slug,
        CancellationToken cancellationToken)
    {
        var response = await GetAsync<DirectusList<DirectusJournalArticle>>(
            $"items/journal_articles?filter[status][_eq]=published&filter[slug][_eq]={Uri.EscapeDataString(slug)}&limit=1&fields=slug,title,summary,content,hero_image,date_published",
            cancellationToken);
        var article = response.Data.SingleOrDefault();
        return article is null ? null : ToDetail(article);
    }

    public async Task<IReadOnlyList<PromotionResponse>> GetPublishedPromotionsAsync(
        CancellationToken cancellationToken)
    {
        var response = await GetAsync<DirectusList<DirectusPromotion>>(
            "items/promotions?filter[status][_eq]=published&sort=sort&limit=20&fields=id,title,summary,cta_label,cta_url,image",
            cancellationToken);
        return response.Data.Select(promotion => new PromotionResponse(
            promotion.Id,
            promotion.Title,
            promotion.Summary,
            promotion.CallToActionLabel,
            promotion.CallToActionUrl,
            promotion.Image)).ToArray();
    }

    private async Task<T> GetAsync<T>(string relativePath, CancellationToken cancellationToken)
    {
        var configuration = options.Value;
        if (!configuration.IsConfigured)
        {
            throw new EditorialUnavailableException(
                "Editorial content is not configured for this environment.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, relativePath);
        if (!string.IsNullOrWhiteSpace(configuration.StaticToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                configuration.StaticToken);
        }

        using var response = await httpClientFactory.CreateClient(DirectusEditorialOptions.HttpClientName)
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new EditorialUnavailableException(
                "Editorial content is temporarily unavailable.");
        }

        await using var content = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<T>(
            content,
            DirectusJsonContext.Default.Options,
            cancellationToken);
        return payload ?? throw new EditorialUnavailableException(
            "Editorial content returned an invalid response.");
    }

    private static JournalArticleSummary ToSummary(DirectusJournalArticle article) => new(
        article.Slug,
        article.Title,
        article.Summary,
        article.HeroImage,
        article.PublishedAtUtc);

    private static JournalArticleDetail ToDetail(DirectusJournalArticle article) => new(
        article.Slug,
        article.Title,
        article.Summary,
        article.Content ?? string.Empty,
        article.HeroImage,
        article.PublishedAtUtc);
}

internal sealed record DirectusList<T>(IReadOnlyList<T> Data, DirectusMeta? Meta);

internal sealed record DirectusMeta(long? FilterCount);

internal sealed record DirectusJournalArticle(
    string Slug,
    string Title,
    string? Summary,
    string? Content,
    string? HeroImage,
    DateTimeOffset? PublishedAtUtc);

internal sealed record DirectusPromotion(
    string Id,
    string Title,
    string? Summary,
    string? CallToActionLabel,
    string? CallToActionUrl,
    string? Image);
