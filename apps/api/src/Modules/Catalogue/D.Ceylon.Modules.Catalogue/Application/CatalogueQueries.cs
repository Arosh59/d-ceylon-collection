using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.Catalogue.Domain;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Catalogue.Application;

internal sealed class CatalogueQueries(CatalogueDbContext database) : ICatalogueQueries
{
    public async Task<PagedResponse<ProductSummaryResponse>> GetPublishedProductsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Products
            .AsNoTracking()
            .Where(product => product.PublicationState == PublicationState.Published);

        var totalItems = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderBy(product => product.Name)
            .ThenBy(product => product.Id)
            .Skip(checked((pageNumber - 1) * pageSize))
            .Take(pageSize)
            .Select(product => new ProductSummaryResponse(
                product.Id,
                product.Name,
                product.Slug,
                product.ShortDescription,
                new ProductTypeResponse(
                    product.ProductType.Id,
                    product.ProductType.Name,
                    product.ProductType.Slug),
                product.StartingPrice,
                product.Currency,
                product.DurationMinutes))
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            items,
            pageNumber,
            pageSize,
            totalItems);
    }

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
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<PagedResponse<ProductTypeResponse>> GetProductTypesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.ProductTypes.AsNoTracking();
        var totalItems = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderBy(productType => productType.Name)
            .ThenBy(productType => productType.Id)
            .Skip(checked((pageNumber - 1) * pageSize))
            .Take(pageSize)
            .Select(productType => new ProductTypeResponse(
                productType.Id,
                productType.Name,
                productType.Slug))
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            items,
            pageNumber,
            pageSize,
            totalItems);
    }
}
