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
