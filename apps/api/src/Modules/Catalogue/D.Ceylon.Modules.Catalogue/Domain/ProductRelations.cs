namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class ProductCategory
{
    private ProductCategory()
    {
    }

    public ProductCategory(Guid productId, Guid categoryId)
    {
        ProductId = RequireIdentifier(productId, nameof(productId));
        CategoryId = RequireIdentifier(categoryId, nameof(categoryId));
    }

    public Guid ProductId { get; private set; }

    public Guid CategoryId { get; private set; }

    public Product Product { get; private set; } = null!;

    public Category Category { get; private set; } = null!;

    private static Guid RequireIdentifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;
}

public sealed class ProductCollectionLink
{
    private ProductCollectionLink()
    {
    }

    public ProductCollectionLink(Guid productId, Guid collectionId)
    {
        ProductId = RequireIdentifier(productId, nameof(productId));
        CollectionId = RequireIdentifier(collectionId, nameof(collectionId));
    }

    public Guid ProductId { get; private set; }

    public Guid CollectionId { get; private set; }

    public Product Product { get; private set; } = null!;

    public TravelCollectionEntry Collection { get; private set; } = null!;

    private static Guid RequireIdentifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;
}

public sealed class ProductDestination
{
    private ProductDestination()
    {
    }

    public ProductDestination(Guid productId, Guid destinationId)
    {
        ProductId = RequireIdentifier(productId, nameof(productId));
        DestinationId = RequireIdentifier(destinationId, nameof(destinationId));
    }

    public Guid ProductId { get; private set; }

    public Guid DestinationId { get; private set; }

    public Product Product { get; private set; } = null!;

    public Destination Destination { get; private set; } = null!;

    private static Guid RequireIdentifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;
}

public sealed class ProductTag
{
    private ProductTag()
    {
    }

    public ProductTag(Guid productId, Guid tagId)
    {
        ProductId = RequireIdentifier(productId, nameof(productId));
        TagId = RequireIdentifier(tagId, nameof(tagId));
    }

    public Guid ProductId { get; private set; }

    public Guid TagId { get; private set; }

    public Product Product { get; private set; } = null!;

    public Tag Tag { get; private set; } = null!;

    private static Guid RequireIdentifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;
}

public sealed class ProductMedia
{
    private ProductMedia()
    {
    }

    public ProductMedia(Guid productId, Guid mediaAssetId, int sortOrder)
    {
        ProductId = RequireIdentifier(productId, nameof(productId));
        MediaAssetId = RequireIdentifier(mediaAssetId, nameof(mediaAssetId));
        if (sortOrder < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(sortOrder),
                "Media sort order cannot be negative.");
        }

        SortOrder = sortOrder;
    }

    public Guid ProductId { get; private set; }

    public Guid MediaAssetId { get; private set; }

    public int SortOrder { get; private set; }

    public Product Product { get; private set; } = null!;

    public MediaAsset MediaAsset { get; private set; } = null!;

    private static Guid RequireIdentifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;
}
