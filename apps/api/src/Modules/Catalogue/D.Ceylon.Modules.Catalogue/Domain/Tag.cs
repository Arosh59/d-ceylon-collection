using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class Tag : AuditableEntity
{
    private Tag()
    {
    }

    public Tag(Guid id, string name, string slug)
        : base(id)
    {
        Name = CatalogueGuard.Required(name, 120, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public ICollection<ProductTag> ProductTags { get; } = new List<ProductTag>();
}
