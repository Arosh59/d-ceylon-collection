using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class Category : AuditableEntity
{
    private Category()
    {
    }

    public Category(Guid id, string name, string slug)
        : base(id)
    {
        Name = CatalogueGuard.Required(name, 120, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public ICollection<ProductCategory> ProductCategories { get; } = new List<ProductCategory>();
}
