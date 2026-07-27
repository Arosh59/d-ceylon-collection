namespace D.Ceylon.BuildingBlocks.Pagination;

public sealed record PaginationMetadata(
    int PageNumber,
    int PageSize,
    long TotalItems,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage);

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    PaginationMetadata Pagination);

public static class PagedResponse
{
    public static PagedResponse<T> Create<T>(
        IReadOnlyList<T> items,
        int pageNumber,
        int pageSize,
        long totalItems)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentOutOfRangeException.ThrowIfLessThan(pageNumber, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(pageSize, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(totalItems);

        var totalPages = totalItems == 0
            ? 0
            : checked((int)Math.Ceiling(totalItems / (double)pageSize));

        return new PagedResponse<T>(
            items,
            new PaginationMetadata(
                pageNumber,
                pageSize,
                totalItems,
                totalPages,
                pageNumber > 1,
                pageNumber < totalPages));
    }
}
