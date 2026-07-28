using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.Catalogue.Domain;

public sealed class MediaAsset : AuditableEntity
{
    private MediaAsset()
    {
    }

    public MediaAsset(
        Guid id,
        string assetKey,
        string altText,
        int width,
        int height)
        : base(id)
    {
        if (width <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(width), "Width must be positive.");
        }

        if (height <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(height), "Height must be positive.");
        }

        AssetKey = CatalogueGuard.Required(assetKey, 200, nameof(assetKey));
        AltText = CatalogueGuard.Required(altText, 300, nameof(altText));
        Width = width;
        Height = height;
    }

    public string AssetKey { get; private set; } = string.Empty;

    public string AltText { get; private set; } = string.Empty;

    public int Width { get; private set; }

    public int Height { get; private set; }

    public ICollection<ProductMedia> ProductMedia { get; } = new List<ProductMedia>();
}
