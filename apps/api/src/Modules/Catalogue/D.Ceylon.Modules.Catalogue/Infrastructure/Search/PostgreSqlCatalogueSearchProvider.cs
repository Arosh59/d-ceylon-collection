using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Application;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.Catalogue.Domain;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Search;

internal sealed class PostgreSqlCatalogueSearchProvider(CatalogueDbContext database)
    : ICatalogueSearchProvider
{
    public async Task<PagedResponse<ProductSummaryResponse>> SearchAsync(
        CatalogueSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = database.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Where(product => product.PublicationState == PublicationState.Published);

        if (!string.IsNullOrWhiteSpace(criteria.Query))
        {
            query = query.Where(product =>
                product.SearchVector.Matches(
                    EF.Functions.PlainToTsQuery("english", criteria.Query)));
        }

        if (criteria.ProductType is not null)
        {
            query = query.Where(product => product.ProductType.Slug == criteria.ProductType);
        }

        if (criteria.Category is not null)
        {
            query = query.Where(product =>
                product.ProductCategories.Any(link => link.Category.Slug == criteria.Category));
        }

        if (criteria.Collection is not null)
        {
            query = query.Where(product =>
                product.ProductCollections.Any(link => link.Collection.Slug == criteria.Collection));
        }

        if (criteria.Destination is not null)
        {
            query = query.Where(product =>
                product.ProductDestinations.Any(link =>
                    link.Destination.Slug == criteria.Destination));
        }

        if (criteria.Tag is not null)
        {
            query = query.Where(product =>
                product.ProductTags.Any(link => link.Tag.Slug == criteria.Tag));
        }

        if (criteria.MinimumPrice is not null)
        {
            query = query.Where(product => product.StartingPrice >= criteria.MinimumPrice);
        }

        if (criteria.MaximumPrice is not null)
        {
            query = query.Where(product => product.StartingPrice <= criteria.MaximumPrice);
        }

        if (criteria.MinimumDurationMinutes is not null)
        {
            query = query.Where(product =>
                product.DurationMinutes >= criteria.MinimumDurationMinutes);
        }

        if (criteria.MaximumDurationMinutes is not null)
        {
            query = query.Where(product =>
                product.DurationMinutes <= criteria.MaximumDurationMinutes);
        }

        query = criteria.Sort switch
        {
            "price-asc" => query
                .OrderBy(product => product.StartingPrice == null)
                .ThenBy(product => product.StartingPrice)
                .ThenBy(product => product.Name),
            "price-desc" => query
                .OrderBy(product => product.StartingPrice == null)
                .ThenByDescending(product => product.StartingPrice)
                .ThenBy(product => product.Name),
            "duration-asc" => query
                .OrderBy(product => product.DurationMinutes == null)
                .ThenBy(product => product.DurationMinutes)
                .ThenBy(product => product.Name),
            _ => query.OrderBy(product => product.Name).ThenBy(product => product.Id),
        };

        var totalItems = await query.LongCountAsync(cancellationToken);
        var items = await query
            .Skip(checked((criteria.PageNumber - 1) * criteria.PageSize))
            .Take(criteria.PageSize)
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
                product.DurationMinutes,
                product.ProductMedia
                    .OrderBy(item => item.SortOrder)
                    .ThenBy(item => item.MediaAssetId)
                    .Select(item => new MediaMetadataResponse(
                        item.MediaAsset.Id,
                        item.MediaAsset.AssetKey,
                        item.MediaAsset.AltText,
                        item.MediaAsset.Width,
                        item.MediaAsset.Height))
                    .FirstOrDefault(),
                product.ProductCollections
                    .Where(link =>
                        link.Collection.PublicationState == PublicationState.Published)
                    .OrderBy(link => link.Collection.Name)
                    .Select(link => new NamedReferenceResponse(
                        link.Collection.Id,
                        link.Collection.Name,
                        link.Collection.Slug))
                    .ToList(),
                product.ProductDestinations
                    .Where(link =>
                        link.Destination.PublicationState == PublicationState.Published)
                    .OrderBy(link => link.Destination.Name)
                    .Select(link => new NamedReferenceResponse(
                        link.Destination.Id,
                        link.Destination.Name,
                        link.Destination.Slug))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            items,
            criteria.PageNumber,
            criteria.PageSize,
            totalItems);
    }
}
