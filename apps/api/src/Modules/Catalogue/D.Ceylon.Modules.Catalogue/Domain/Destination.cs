using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class Destination : AuditableEntity
{
    private Destination()
    {
    }

    public Destination(
        Guid id,
        string name,
        string slug,
        string? summary = null,
        string? description = null,
        Guid? heroMediaId = null)
        : base(id)
    {
        Name = CatalogueGuard.Required(name, 160, nameof(name));
        Slug = CatalogueGuard.Slug(slug, nameof(slug));
        Summary = summary is null
            ? null
            : CatalogueGuard.Required(summary, 500, nameof(summary));
        Description = description is null
            ? Summary
            : CatalogueGuard.Required(description, 4_000, nameof(description));
        HeroMediaId = heroMediaId;
        PublicationState = PublicationState.Draft;
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public string? Summary { get; private set; }

    public string? Description { get; private set; }

    public Guid? HeroMediaId { get; private set; }

    public PublicationState PublicationState { get; private set; }

    public MediaAsset? HeroMedia { get; private set; }

    public ICollection<ProductDestination> ProductDestinations { get; } = new List<ProductDestination>();

    public void Publish() => PublicationState = PublicationState.Published;
}
