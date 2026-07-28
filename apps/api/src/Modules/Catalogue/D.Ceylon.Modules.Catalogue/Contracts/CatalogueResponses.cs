using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.Catalogue.Contracts;

public sealed record ProductTypeResponse(Guid Id, string Name, string Slug);

public sealed record NamedReferenceResponse(Guid Id, string Name, string Slug);

public sealed record MediaMetadataResponse(
    Guid Id,
    string AssetKey,
    string AltText,
    int Width,
    int Height);

public sealed record ProductSummaryResponse(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    ProductTypeResponse ProductType,
    decimal? StartingPrice,
    string Currency,
    int? DurationMinutes,
    MediaMetadataResponse? PrimaryMedia,
    IReadOnlyList<NamedReferenceResponse> Collections,
    IReadOnlyList<NamedReferenceResponse> Destinations);

public sealed record ProductDetailResponse(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    string Description,
    ProductTypeResponse ProductType,
    decimal? StartingPrice,
    string Currency,
    int? DurationMinutes,
    IReadOnlyList<NamedReferenceResponse> Categories,
    IReadOnlyList<NamedReferenceResponse> Collections,
    IReadOnlyList<NamedReferenceResponse> Destinations,
    IReadOnlyList<NamedReferenceResponse> Tags,
    IReadOnlyList<MediaMetadataResponse> Media);

public sealed record CollectionSummaryResponse(
    Guid Id,
    string Name,
    string Slug,
    string Summary,
    MediaMetadataResponse? HeroMedia);

public sealed record CollectionDetailResponse(
    Guid Id,
    string Name,
    string Slug,
    string Summary,
    string Description,
    MediaMetadataResponse? HeroMedia,
    int PublishedProductCount);

public sealed record DestinationSummaryResponse(
    Guid Id,
    string Name,
    string Slug,
    string Summary,
    MediaMetadataResponse? HeroMedia);

public sealed record DestinationDetailResponse(
    Guid Id,
    string Name,
    string Slug,
    string Summary,
    string Description,
    MediaMetadataResponse? HeroMedia,
    int PublishedProductCount);

public sealed record CatalogueSearchCriteria(
    int PageNumber,
    int PageSize,
    string? Query,
    string? ProductType,
    string? Category,
    string? Collection,
    string? Destination,
    string? Tag,
    decimal? MinimumPrice,
    decimal? MaximumPrice,
    int? MinimumDurationMinutes,
    int? MaximumDurationMinutes,
    string Sort);

public interface ICatalogueQueries
{
    Task<PagedResponse<ProductSummaryResponse>> SearchPublishedProductsAsync(
        CatalogueSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<ProductDetailResponse?> GetPublishedProductAsync(
        string slug,
        CancellationToken cancellationToken);

    Task<PagedResponse<ProductTypeResponse>> GetProductTypesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<PagedResponse<NamedReferenceResponse>> GetCategoriesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<PagedResponse<NamedReferenceResponse>> GetTagsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<PagedResponse<CollectionSummaryResponse>> GetCollectionsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<CollectionDetailResponse?> GetCollectionAsync(
        string slug,
        CancellationToken cancellationToken);

    Task<PagedResponse<DestinationSummaryResponse>> GetDestinationsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<DestinationDetailResponse?> GetDestinationAsync(
        string slug,
        CancellationToken cancellationToken);
}
