using D.Ceylon.BuildingBlocks.Pagination;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class PagedResponseTests
{
    private static readonly string[] PageItems = ["item-3", "item-4"];

    [Fact]
    public void CreateCalculatesStablePaginationMetadata()
    {
        var response = PagedResponse.Create(
            PageItems,
            pageNumber: 2,
            pageSize: 2,
            totalItems: 5);

        Assert.Equal(2, response.Pagination.PageNumber);
        Assert.Equal(2, response.Pagination.PageSize);
        Assert.Equal(5, response.Pagination.TotalItems);
        Assert.Equal(3, response.Pagination.TotalPages);
        Assert.True(response.Pagination.HasPreviousPage);
        Assert.True(response.Pagination.HasNextPage);
    }

    [Fact]
    public void CreateRepresentsAnEmptyResultWithoutPhantomPages()
    {
        var response = PagedResponse.Create(
            Array.Empty<string>(),
            pageNumber: 1,
            pageSize: 20,
            totalItems: 0);

        Assert.Empty(response.Items);
        Assert.Equal(0, response.Pagination.TotalPages);
        Assert.False(response.Pagination.HasPreviousPage);
        Assert.False(response.Pagination.HasNextPage);
    }
}
