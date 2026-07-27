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
