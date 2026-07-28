using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.Catalogue.Domain;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Catalogue.Application;

internal sealed class CatalogueQueries(
    CatalogueDbContext database,
    ICatalogueSearchProvider searchProvider)
    : ICatalogueQueries
{
    public Task<PagedResponse<ProductSummaryResponse>> SearchPublishedProductsAsync(
        CatalogueSearchCriteria criteria,
        CancellationToken cancellationToken) =>
        searchProvider.SearchAsync(criteria, cancellationToken);

    public Task<ProductDetailResponse?> GetPublishedProductAsync(
        string slug,
        CancellationToken cancellationToken) =>
        database.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Where(product =>
                product.Slug == slug
                && product.PublicationState == PublicationState.Published)
            .Select(product => new ProductDetailResponse(
                product.Id,
                product.Name,
                product.Slug,
                product.ShortDescription,
                product.Description,
                new ProductTypeResponse(
                    product.ProductType.Id,
                    product.ProductType.Name,
                    product.ProductType.Slug),
                product.StartingPrice,
                product.Currency,
                product.DurationMinutes,
                product.ProductCategories
                    .OrderBy(item => item.Category.Name)
                    .Select(item => new NamedReferenceResponse(
                        item.Category.Id,
                        item.Category.Name,
                        item.Category.Slug))
                    .ToList(),
                product.ProductCollections
                    .OrderBy(item => item.Collection.Name)
                    .Select(item => new NamedReferenceResponse(
                        item.Collection.Id,
                        item.Collection.Name,
                        item.Collection.Slug))
                    .ToList(),
                product.ProductDestinations
                    .OrderBy(item => item.Destination.Name)
                    .Select(item => new NamedReferenceResponse(
                        item.Destination.Id,
                        item.Destination.Name,
                        item.Destination.Slug))
                    .ToList(),
                product.ProductTags
                    .OrderBy(item => item.Tag.Name)
                    .Select(item => new NamedReferenceResponse(
                        item.Tag.Id,
                        item.Tag.Name,
                        item.Tag.Slug))
                    .ToList(),
                product.ProductMedia
                    .OrderBy(item => item.SortOrder)
                    .ThenBy(item => item.MediaAssetId)
                    .Select(item => new MediaMetadataResponse(
                        item.MediaAsset.Id,
                        item.MediaAsset.AssetKey,
                        item.MediaAsset.AltText,
                        item.MediaAsset.Width,
                        item.MediaAsset.Height))
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<PlanningCatalogueItem>> GetPlanningCatalogueAsync(
        IReadOnlyCollection<string> destinationSlugs,
        CancellationToken cancellationToken) =>
        await database.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Where(product =>
                product.PublicationState == PublicationState.Published
                && product.ProductDestinations.Any(link =>
                    destinationSlugs.Contains(link.Destination.Slug)))
            .OrderBy(product => product.Slug)
            .Select(product => new PlanningCatalogueItem(
                product.Slug,
                product.Name,
                product.DurationMinutes,
                new[] { product.ProductType.Slug },
                product.ProductCategories
                    .OrderBy(link => link.Category.Slug)
                    .Select(link => link.Category.Slug)
                    .ToArray(),
                product.ProductDestinations
                    .OrderBy(link => link.Destination.Slug)
                    .Select(link => link.Destination.Slug)
                    .ToArray(),
                product.ProductTags
                    .OrderBy(link => link.Tag.Slug)
                    .Select(link => link.Tag.Slug)
                    .ToArray()))
            .ToListAsync(cancellationToken);

    public Task<PagedResponse<ProductTypeResponse>> GetProductTypesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        PageAsync(
            database.ProductTypes.AsNoTracking(),
            pageNumber,
            pageSize,
            productType => new ProductTypeResponse(
                productType.Id,
                productType.Name,
                productType.Slug),
            cancellationToken);

    public Task<PagedResponse<NamedReferenceResponse>> GetCategoriesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        PageAsync(
            database.Categories.AsNoTracking(),
            pageNumber,
            pageSize,
            category => new NamedReferenceResponse(
                category.Id,
                category.Name,
                category.Slug),
            cancellationToken);

    public Task<PagedResponse<NamedReferenceResponse>> GetTagsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        PageAsync(
            database.Tags.AsNoTracking(),
            pageNumber,
            pageSize,
            tag => new NamedReferenceResponse(tag.Id, tag.Name, tag.Slug),
            cancellationToken);

    public Task<PagedResponse<CollectionSummaryResponse>> GetCollectionsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        PageAsync(
            database.Collections
                .AsNoTracking()
                .Where(item => item.PublicationState == PublicationState.Published),
            pageNumber,
            pageSize,
            item => new CollectionSummaryResponse(
                item.Id,
                item.Name,
                item.Slug,
                item.Summary ?? string.Empty,
                item.HeroMedia == null
                    ? null
                    : new MediaMetadataResponse(
                        item.HeroMedia.Id,
                        item.HeroMedia.AssetKey,
                        item.HeroMedia.AltText,
                        item.HeroMedia.Width,
                        item.HeroMedia.Height)),
            cancellationToken);

    public Task<CollectionDetailResponse?> GetCollectionAsync(
        string slug,
        CancellationToken cancellationToken) =>
        database.Collections
            .AsNoTracking()
            .Where(item =>
                item.Slug == slug
                && item.PublicationState == PublicationState.Published)
            .Select(item => new CollectionDetailResponse(
                item.Id,
                item.Name,
                item.Slug,
                item.Summary ?? string.Empty,
                item.Description ?? string.Empty,
                item.HeroMedia == null
                    ? null
                    : new MediaMetadataResponse(
                        item.HeroMedia.Id,
                        item.HeroMedia.AssetKey,
                        item.HeroMedia.AltText,
                        item.HeroMedia.Width,
                        item.HeroMedia.Height),
                item.ProductCollections.Count(link =>
                    link.Product.PublicationState == PublicationState.Published)))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<PagedResponse<DestinationSummaryResponse>> GetDestinationsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        PageAsync(
            database.Destinations
                .AsNoTracking()
                .Where(item => item.PublicationState == PublicationState.Published),
            pageNumber,
            pageSize,
            item => new DestinationSummaryResponse(
                item.Id,
                item.Name,
                item.Slug,
                item.Summary ?? string.Empty,
                item.HeroMedia == null
                    ? null
                    : new MediaMetadataResponse(
                        item.HeroMedia.Id,
                        item.HeroMedia.AssetKey,
                        item.HeroMedia.AltText,
                        item.HeroMedia.Width,
                        item.HeroMedia.Height)),
            cancellationToken);

    public Task<DestinationDetailResponse?> GetDestinationAsync(
        string slug,
        CancellationToken cancellationToken) =>
        database.Destinations
            .AsNoTracking()
            .Where(item =>
                item.Slug == slug
                && item.PublicationState == PublicationState.Published)
            .Select(item => new DestinationDetailResponse(
                item.Id,
                item.Name,
                item.Slug,
                item.Summary ?? string.Empty,
                item.Description ?? string.Empty,
                item.HeroMedia == null
                    ? null
                    : new MediaMetadataResponse(
                        item.HeroMedia.Id,
                        item.HeroMedia.AssetKey,
                        item.HeroMedia.AltText,
                        item.HeroMedia.Width,
                        item.HeroMedia.Height),
                item.ProductDestinations.Count(link =>
                    link.Product.PublicationState == PublicationState.Published)))
            .SingleOrDefaultAsync(cancellationToken);

    private static async Task<PagedResponse<TResponse>> PageAsync<TEntity, TResponse>(
        IQueryable<TEntity> query,
        int pageNumber,
        int pageSize,
        System.Linq.Expressions.Expression<Func<TEntity, TResponse>> projection,
        CancellationToken cancellationToken)
        where TEntity : class
    {
        var totalItems = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderBy(item => EF.Property<string>(item, "Name"))
            .ThenBy(item => EF.Property<Guid>(item, "Id"))
            .Skip(checked((pageNumber - 1) * pageSize))
            .Take(pageSize)
            .Select(projection)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(items, pageNumber, pageSize, totalItems);
    }
}
