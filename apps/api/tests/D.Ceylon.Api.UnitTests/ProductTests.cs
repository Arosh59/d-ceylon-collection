using D.Ceylon.Modules.Catalogue.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class ProductTests
{
    [Fact]
    public void ConstructorNormalizesSafeCatalogueValues()
    {
        var productTypeId = Guid.NewGuid();

        var product = new Product(
            Guid.NewGuid(),
            productTypeId,
            "  Coastal Escape  ",
            "Coastal-Escape",
            "  A considered journey along the southern coast.  ",
            1250.50m,
            "usd",
            4_320);

        Assert.Equal(productTypeId, product.ProductTypeId);
        Assert.Equal("Coastal Escape", product.Name);
        Assert.Equal("coastal-escape", product.Slug);
        Assert.Equal(
            "A considered journey along the southern coast.",
            product.ShortDescription);
        Assert.Equal(1250.50m, product.StartingPrice);
        Assert.Equal("USD", product.Currency);
        Assert.Equal(4_320, product.DurationMinutes);
        Assert.Equal(PublicationState.Draft, product.PublicationState);
        Assert.NotEqual(Guid.Empty, product.ConcurrencyToken);
    }

    [Theory]
    [InlineData("spaces are invalid")]
    [InlineData("double--hyphen")]
    [InlineData("-leading")]
    public void ConstructorRejectsInvalidSlugs(string slug)
    {
        var exception = Assert.Throws<ArgumentException>(
            () => new Product(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "Test",
                slug,
                "Description",
                null,
                "USD"));

        Assert.Equal("slug", exception.ParamName);
    }

    [Fact]
    public void ConstructorRejectsNegativeStartingPrice()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(
            () => new Product(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "Test",
                "test",
                "Description",
                -0.01m,
                "USD"));

        Assert.Equal("startingPrice", exception.ParamName);
    }

    [Fact]
    public void ConstructorRejectsEmptyProductTypeIdentifier()
    {
        var exception = Assert.Throws<ArgumentException>(
            () => new Product(
                Guid.NewGuid(),
                Guid.Empty,
                "Test",
                "test",
                "Description",
                null,
                "USD"));

        Assert.Equal("productTypeId", exception.ParamName);
    }
}
