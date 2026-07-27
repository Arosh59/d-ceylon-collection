using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.Catalogue.Contracts;

public sealed record ProductTypeResponse(Guid Id, string Name, string Slug);

public sealed record ProductSummaryResponse(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    ProductTypeResponse ProductType,
    decimal? StartingPrice,
    string Currency,
    int? DurationMinutes);

public sealed record ProductDetailResponse(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    ProductTypeResponse ProductType,
    decimal? StartingPrice,
    string Currency,
    int? DurationMinutes,
    IReadOnlyList<NamedReferenceResponse> Categories,
    IReadOnlyList<NamedReferenceResponse> Collections,
    IReadOnlyList<NamedReferenceResponse> Destinations);

public sealed record NamedReferenceResponse(Guid Id, string Name, string Slug);

public interface ICatalogueQueries
{
    Task<PagedResponse<ProductSummaryResponse>> GetPublishedProductsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<ProductDetailResponse?> GetPublishedProductAsync(
        string slug,
        CancellationToken cancellationToken);

    Task<PagedResponse<ProductTypeResponse>> GetProductTypesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);
}
