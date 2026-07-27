using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class TravelCollectionEntry : AuditableEntity
{
    private TravelCollectionEntry()
    {
    }

    public TravelCollectionEntry(Guid id, string name, string slug)
        : base(id)
    {
        Name = CatalogueGuard.Required(name, 120, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public ICollection<ProductCollectionLink> ProductCollections { get; } =
        new List<ProductCollectionLink>();
}
