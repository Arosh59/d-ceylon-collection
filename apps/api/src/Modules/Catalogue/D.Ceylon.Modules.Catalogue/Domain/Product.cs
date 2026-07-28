using D.Ceylon.BuildingBlocks.Domain;
using NpgsqlTypes;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class Product : AuditableEntity
{
    private Product()
    {
    }

    public Product(
        Guid id,
        Guid productTypeId,
        string name,
        string slug,
        string shortDescription,
        decimal? startingPrice,
        string currency,
        int? durationMinutes = null,
        string? description = null)
        : base(id)
    {
        if (productTypeId == Guid.Empty)
        {
            throw new ArgumentException("Product type identifiers cannot be empty.", nameof(productTypeId));
        }

        if (startingPrice is < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(startingPrice),
                "Starting price cannot be negative.");
        }

        if (durationMinutes is <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(durationMinutes),
                "Duration must be positive when supplied.");
        }

        ProductTypeId = productTypeId;
        Name = CatalogueGuard.Required(name, 200, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
        ShortDescription = CatalogueGuard.Required(
            shortDescription,
            500,
            nameof(shortDescription));
        Description = CatalogueGuard.Required(
            description ?? shortDescription,
            4_000,
            nameof(description));
        StartingPrice = startingPrice;
        Currency = CatalogueGuard.Currency(currency, nameof(currency));
        DurationMinutes = durationMinutes;
        PublicationState = PublicationState.Draft;
    }

    public Guid ProductTypeId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public string ShortDescription { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public decimal? StartingPrice { get; private set; }

    public string Currency { get; private set; } = string.Empty;

    public int? DurationMinutes { get; private set; }

    public PublicationState PublicationState { get; private set; }

    public NpgsqlTsVector SearchVector { get; private set; } = null!;

    public ProductType ProductType { get; private set; } = null!;

    public ICollection<ProductCategory> ProductCategories { get; } = new List<ProductCategory>();

    public ICollection<ProductCollectionLink> ProductCollections { get; } =
        new List<ProductCollectionLink>();

    public ICollection<ProductDestination> ProductDestinations { get; } = new List<ProductDestination>();

    public ICollection<ProductTag> ProductTags { get; } = new List<ProductTag>();

    public ICollection<ProductMedia> ProductMedia { get; } = new List<ProductMedia>();

    public void Publish() => PublicationState = PublicationState.Published;

    public void Archive() => PublicationState = PublicationState.Archived;
}
