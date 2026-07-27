using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class Destination : AuditableEntity
{
    private Destination()
    {
    }

    public Destination(Guid id, string name, string slug, string? summary = null)
        : base(id)
    {
        Name = CatalogueGuard.Required(name, 160, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
        Summary = summary is null
            ? null
            : CatalogueGuard.Required(summary, 500, nameof(summary));
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public string? Summary { get; private set; }

    public ICollection<ProductDestination> ProductDestinations { get; } = new List<ProductDestination>();
}
