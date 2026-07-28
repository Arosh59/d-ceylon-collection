using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Catalogue.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;

internal sealed class ProductTypeConfiguration : IEntityTypeConfiguration<ProductType>
{
    public void Configure(EntityTypeBuilder<ProductType> builder)
    {
        builder.ToTable("product_types");
        ConfigureAuditable(builder);

        builder.Property(entity => entity.Name)
            .HasColumnName("name")
            .HasMaxLength(120)
            .IsRequired();
        builder.Property(entity => entity.Slug)
            .HasColumnName("slug")
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(entity => entity.Slug)
            .IsUnique()
            .HasDatabaseName("ux_product_types_slug");
        builder.HasIndex(entity => entity.Name)
            .HasDatabaseName("ix_product_types_name");
    }

    private static void ConfigureAuditable<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity =>
        AuditableConfiguration.Configure(builder);
}

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable(
            "products",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_products_starting_price",
                    "starting_price IS NULL OR starting_price >= 0");
                table.HasCheckConstraint(
                    "ck_products_currency",
                    "char_length(currency) = 3");
                table.HasCheckConstraint(
                    "ck_products_duration",
                    "duration_minutes IS NULL OR duration_minutes > 0");
            });
        AuditableConfiguration.Configure(builder);

        builder.Property(entity => entity.ProductTypeId)
            .HasColumnName("product_type_id");
        builder.Property(entity => entity.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(entity => entity.Slug)
            .HasColumnName("slug")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(entity => entity.ShortDescription)
            .HasColumnName("short_description")
            .HasMaxLength(500)
            .IsRequired();
        builder.Property(entity => entity.Description)
            .HasColumnName("description")
            .HasMaxLength(4_000)
            .IsRequired();
        builder.Property(entity => entity.StartingPrice)
            .HasColumnName("starting_price")
            .HasPrecision(18, 2);
        builder.Property(entity => entity.Currency)
            .HasColumnName("currency")
            .HasMaxLength(3)
            .IsFixedLength()
            .IsRequired();
        builder.Property(entity => entity.DurationMinutes)
            .HasColumnName("duration_minutes");
        builder.Property(entity => entity.PublicationState)
            .HasColumnName("publication_state")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(entity => entity.SearchVector)
            .HasColumnName("search_vector");
        builder.HasGeneratedTsVectorColumn(
            entity => entity.SearchVector,
            "english",
            entity => new
            {
                entity.Name,
                entity.ShortDescription,
                entity.Description,
            });

        builder.HasOne(entity => entity.ProductType)
            .WithMany(entity => entity.Products)
            .HasForeignKey(entity => entity.ProductTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(entity => entity.Slug)
            .IsUnique()
            .HasDatabaseName("ux_products_slug");
        builder.HasIndex(entity => entity.ProductTypeId)
            .HasDatabaseName("ix_products_product_type_id");
        builder.HasIndex(entity => entity.PublicationState)
            .HasDatabaseName("ix_products_publication_state");
        builder.HasIndex(entity => new { entity.PublicationState, entity.Name })
            .HasDatabaseName("ix_products_publication_state_name");
        builder.HasIndex(entity => entity.SearchVector)
            .HasMethod("GIN")
            .HasDatabaseName("ix_products_search_vector");
        builder.HasIndex(entity => entity.Name)
            .HasDatabaseName("ix_products_name");
    }
}

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        AuditableConfiguration.Configure(builder);
        NamedEntityConfiguration.Configure(builder, 120);
    }
}

internal sealed class CollectionConfiguration : IEntityTypeConfiguration<TravelCollectionEntry>
{
    public void Configure(EntityTypeBuilder<TravelCollectionEntry> builder)
    {
        builder.ToTable("collections");
        AuditableConfiguration.Configure(builder);
        NamedEntityConfiguration.Configure(builder, 120);
        builder.Property(entity => entity.Summary)
            .HasColumnName("summary")
            .HasMaxLength(500);
        builder.Property(entity => entity.Description)
            .HasColumnName("description")
            .HasMaxLength(4_000);
        builder.Property(entity => entity.HeroMediaId)
            .HasColumnName("hero_media_id");
        builder.Property(entity => entity.PublicationState)
            .HasColumnName("publication_state")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.HasOne(entity => entity.HeroMedia)
            .WithMany()
            .HasForeignKey(entity => entity.HeroMediaId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(entity => entity.HeroMediaId)
            .HasDatabaseName("ix_collections_hero_media_id");
        builder.HasIndex(entity => entity.PublicationState)
            .HasDatabaseName("ix_collections_publication_state");
    }
}

internal sealed class DestinationConfiguration : IEntityTypeConfiguration<Destination>
{
    public void Configure(EntityTypeBuilder<Destination> builder)
    {
        builder.ToTable("destinations");
        AuditableConfiguration.Configure(builder);
        NamedEntityConfiguration.Configure(builder, 160);
        builder.Property(entity => entity.Summary)
            .HasColumnName("summary")
            .HasMaxLength(500);
        builder.Property(entity => entity.Description)
            .HasColumnName("description")
            .HasMaxLength(4_000);
        builder.Property(entity => entity.HeroMediaId)
            .HasColumnName("hero_media_id");
        builder.Property(entity => entity.PublicationState)
            .HasColumnName("publication_state")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.HasOne(entity => entity.HeroMedia)
            .WithMany()
            .HasForeignKey(entity => entity.HeroMediaId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(entity => entity.HeroMediaId)
            .HasDatabaseName("ix_destinations_hero_media_id");
        builder.HasIndex(entity => entity.PublicationState)
            .HasDatabaseName("ix_destinations_publication_state");
    }
}

internal sealed class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("tags");
        AuditableConfiguration.Configure(builder);
        NamedEntityConfiguration.Configure(builder, 120);
    }
}

internal sealed class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable(
            "media_assets",
            table =>
            {
                table.HasCheckConstraint("ck_media_assets_width", "width > 0");
                table.HasCheckConstraint("ck_media_assets_height", "height > 0");
            });
        AuditableConfiguration.Configure(builder);
        builder.Property(entity => entity.AssetKey)
            .HasColumnName("asset_key")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(entity => entity.AltText)
            .HasColumnName("alt_text")
            .HasMaxLength(300)
            .IsRequired();
        builder.Property(entity => entity.Width)
            .HasColumnName("width");
        builder.Property(entity => entity.Height)
            .HasColumnName("height");
        builder.HasIndex(entity => entity.AssetKey)
            .IsUnique()
            .HasDatabaseName("ux_media_assets_asset_key");
    }
}

internal sealed class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> builder)
    {
        builder.ToTable("product_categories");
        builder.HasKey(entity => new { entity.ProductId, entity.CategoryId });
        builder.Property(entity => entity.ProductId).HasColumnName("product_id");
        builder.Property(entity => entity.CategoryId).HasColumnName("category_id");
        builder.HasOne(entity => entity.Product)
            .WithMany(entity => entity.ProductCategories)
            .HasForeignKey(entity => entity.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Category)
            .WithMany(entity => entity.ProductCategories)
            .HasForeignKey(entity => entity.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.CategoryId)
            .HasDatabaseName("ix_product_categories_category_id");
    }
}

internal sealed class ProductCollectionConfiguration : IEntityTypeConfiguration<ProductCollectionLink>
{
    public void Configure(EntityTypeBuilder<ProductCollectionLink> builder)
    {
        builder.ToTable("product_collections");
        builder.HasKey(entity => new { entity.ProductId, entity.CollectionId });
        builder.Property(entity => entity.ProductId).HasColumnName("product_id");
        builder.Property(entity => entity.CollectionId).HasColumnName("collection_id");
        builder.HasOne(entity => entity.Product)
            .WithMany(entity => entity.ProductCollections)
            .HasForeignKey(entity => entity.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Collection)
            .WithMany(entity => entity.ProductCollections)
            .HasForeignKey(entity => entity.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.CollectionId)
            .HasDatabaseName("ix_product_collections_collection_id");
    }
}

internal sealed class ProductDestinationConfiguration : IEntityTypeConfiguration<ProductDestination>
{
    public void Configure(EntityTypeBuilder<ProductDestination> builder)
    {
        builder.ToTable("product_destinations");
        builder.HasKey(entity => new { entity.ProductId, entity.DestinationId });
        builder.Property(entity => entity.ProductId).HasColumnName("product_id");
        builder.Property(entity => entity.DestinationId).HasColumnName("destination_id");
        builder.HasOne(entity => entity.Product)
            .WithMany(entity => entity.ProductDestinations)
            .HasForeignKey(entity => entity.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Destination)
            .WithMany(entity => entity.ProductDestinations)
            .HasForeignKey(entity => entity.DestinationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.DestinationId)
            .HasDatabaseName("ix_product_destinations_destination_id");
    }
}

internal sealed class ProductTagConfiguration : IEntityTypeConfiguration<ProductTag>
{
    public void Configure(EntityTypeBuilder<ProductTag> builder)
    {
        builder.ToTable("product_tags");
        builder.HasKey(entity => new { entity.ProductId, entity.TagId });
        builder.Property(entity => entity.ProductId).HasColumnName("product_id");
        builder.Property(entity => entity.TagId).HasColumnName("tag_id");
        builder.HasOne(entity => entity.Product)
            .WithMany(entity => entity.ProductTags)
            .HasForeignKey(entity => entity.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Tag)
            .WithMany(entity => entity.ProductTags)
            .HasForeignKey(entity => entity.TagId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.TagId)
            .HasDatabaseName("ix_product_tags_tag_id");
    }
}

internal sealed class ProductMediaConfiguration : IEntityTypeConfiguration<ProductMedia>
{
    public void Configure(EntityTypeBuilder<ProductMedia> builder)
    {
        builder.ToTable(
            "product_media",
            table => table.HasCheckConstraint(
                "ck_product_media_sort_order",
                "sort_order >= 0"));
        builder.HasKey(entity => new { entity.ProductId, entity.MediaAssetId });
        builder.Property(entity => entity.ProductId).HasColumnName("product_id");
        builder.Property(entity => entity.MediaAssetId).HasColumnName("media_asset_id");
        builder.Property(entity => entity.SortOrder).HasColumnName("sort_order");
        builder.HasOne(entity => entity.Product)
            .WithMany(entity => entity.ProductMedia)
            .HasForeignKey(entity => entity.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.MediaAsset)
            .WithMany(entity => entity.ProductMedia)
            .HasForeignKey(entity => entity.MediaAssetId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(entity => entity.MediaAssetId)
            .HasDatabaseName("ix_product_media_media_asset_id");
        builder.HasIndex(entity => new { entity.ProductId, entity.SortOrder })
            .HasDatabaseName("ix_product_media_product_id_sort_order");
    }
}

internal static class AuditableConfiguration
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();
        builder.Property(entity => entity.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(entity => entity.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(entity => entity.ConcurrencyToken)
            .HasColumnName("concurrency_token")
            .IsConcurrencyToken()
            .IsRequired();

        builder.HasIndex(entity => entity.UpdatedAtUtc)
            .HasDatabaseName($"ix_{builder.Metadata.GetTableName()}_updated_at_utc");
    }
}

internal static class NamedEntityConfiguration
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder, int nameLength)
        where TEntity : AuditableEntity
    {
        builder.Property<string>("Name")
            .HasColumnName("name")
            .HasMaxLength(nameLength)
            .IsRequired();
        builder.Property<string>("Slug")
            .HasColumnName("slug")
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex("Slug")
            .IsUnique()
            .HasDatabaseName($"ux_{builder.Metadata.GetTableName()}_slug");
        builder.HasIndex("Name")
            .HasDatabaseName($"ix_{builder.Metadata.GetTableName()}_name");
    }
}
