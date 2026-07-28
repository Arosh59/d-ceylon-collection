using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.CustomersTravellers.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;

internal sealed class CustomerProfileConfiguration : IEntityTypeConfiguration<CustomerProfile>
{
    public void Configure(EntityTypeBuilder<CustomerProfile> builder)
    {
        builder.ToTable("customer_profiles");
        CustomerAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.CustomerId).HasColumnName("customer_id");
        builder.Property(entity => entity.GivenName).HasColumnName("given_name").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.FamilyName).HasColumnName("family_name").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.ContactEmail).HasColumnName("contact_email").HasMaxLength(320);
        builder.Property(entity => entity.ContactPhone).HasColumnName("contact_phone").HasMaxLength(40);
        builder.Property(entity => entity.CountryCode).HasColumnName("country_code").HasMaxLength(2).IsFixedLength();
        builder.Property(entity => entity.PreferredLocale).HasColumnName("preferred_locale").HasMaxLength(20).IsRequired();
        builder.Property(entity => entity.PreferredContactMethod).HasColumnName("preferred_contact_method").HasMaxLength(20).IsRequired();
        builder.Property(entity => entity.MarketingConsent).HasColumnName("marketing_consent");
        builder.HasIndex(entity => entity.CustomerId).IsUnique().HasDatabaseName("ux_customer_profiles_customer_id");
        builder.HasIndex(entity => entity.ContactEmail).HasDatabaseName("ix_customer_profiles_contact_email");
    }
}

internal sealed class TravellerConfiguration : IEntityTypeConfiguration<Traveller>
{
    public void Configure(EntityTypeBuilder<Traveller> builder)
    {
        builder.ToTable("travellers");
        CustomerAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.CustomerId).HasColumnName("customer_id");
        builder.Property(entity => entity.GivenName).HasColumnName("given_name").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.FamilyName).HasColumnName("family_name").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.DateOfBirth).HasColumnName("date_of_birth");
        builder.Property(entity => entity.AccessibilityNeeds).HasColumnName("accessibility_needs").HasMaxLength(1_000);
        builder.Property(entity => entity.DietaryNeeds).HasColumnName("dietary_needs").HasMaxLength(1_000);
        builder.Property(entity => entity.EmergencyContactName).HasColumnName("emergency_contact_name").HasMaxLength(200);
        builder.Property(entity => entity.EmergencyContactPhone).HasColumnName("emergency_contact_phone").HasMaxLength(40);
        builder.HasIndex(entity => new { entity.CustomerId, entity.FamilyName, entity.GivenName })
            .HasDatabaseName("ix_travellers_customer_name");
        builder.HasIndex(entity => entity.CustomerId).HasDatabaseName("ix_travellers_customer_id");
    }
}

internal sealed class WishlistEntryConfiguration : IEntityTypeConfiguration<WishlistEntry>
{
    public void Configure(EntityTypeBuilder<WishlistEntry> builder)
    {
        builder.ToTable("wishlist_entries");
        CustomerAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.CustomerId).HasColumnName("customer_id");
        builder.Property(entity => entity.ProductSlug).HasColumnName("product_slug").HasMaxLength(200).IsRequired();
        builder.Property(entity => entity.Note).HasColumnName("note").HasMaxLength(500);
        builder.HasIndex(entity => new { entity.CustomerId, entity.ProductSlug })
            .IsUnique().HasDatabaseName("ux_wishlist_entries_customer_product");
        builder.HasIndex(entity => new { entity.CustomerId, entity.CreatedAtUtc })
            .HasDatabaseName("ix_wishlist_entries_customer_created_at");
    }
}

internal sealed class SavedItineraryConfiguration : IEntityTypeConfiguration<SavedItinerary>
{
    public void Configure(EntityTypeBuilder<SavedItinerary> builder)
    {
        builder.ToTable(
            "saved_itineraries",
            table => table.HasCheckConstraint(
                "ck_saved_itineraries_travel_dates",
                "travel_end_date IS NULL OR travel_start_date IS NULL OR travel_end_date >= travel_start_date"));
        CustomerAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.CustomerId).HasColumnName("customer_id");
        builder.Property(entity => entity.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(entity => entity.Summary).HasColumnName("summary").HasMaxLength(2_000);
        builder.Property(entity => entity.TravelStartDate).HasColumnName("travel_start_date");
        builder.Property(entity => entity.TravelEndDate).HasColumnName("travel_end_date");
        builder.Property(entity => entity.PrimaryDestinationSlug).HasColumnName("primary_destination_slug").HasMaxLength(200);
        builder.Property(entity => entity.IsArchived).HasColumnName("is_archived");
        builder.HasIndex(entity => new { entity.CustomerId, entity.IsArchived, entity.UpdatedAtUtc })
            .HasDatabaseName("ix_saved_itineraries_customer_archived_updated");
        builder.HasIndex(entity => entity.PrimaryDestinationSlug)
            .HasDatabaseName("ix_saved_itineraries_destination_slug");
    }
}

internal static class CustomerAuditConfiguration
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(entity => entity.CreatedAtUtc).HasColumnName("created_at_utc");
        builder.Property(entity => entity.UpdatedAtUtc).HasColumnName("updated_at_utc");
        builder.Property(entity => entity.ConcurrencyToken)
            .HasColumnName("concurrency_token")
            .IsConcurrencyToken();
        builder.HasIndex(entity => entity.UpdatedAtUtc).HasDatabaseName($"ix_{builder.Metadata.GetTableName()}_updated_at");
    }
}
