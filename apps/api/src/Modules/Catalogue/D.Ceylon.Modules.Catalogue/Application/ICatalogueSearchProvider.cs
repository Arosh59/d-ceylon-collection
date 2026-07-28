using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;

namespace D.Ceylon.Modules.Catalogue.Application;

internal interface ICatalogueSearchProvider
{
    Task<PagedResponse<ProductSummaryResponse>> SearchAsync(
        CatalogueSearchCriteria criteria,
        CancellationToken cancellationToken);
}
