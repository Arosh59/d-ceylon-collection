using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence;

internal sealed class TravelPlanConfiguration : IEntityTypeConfiguration<TravelPlan>
{
    public void Configure(EntityTypeBuilder<TravelPlan> builder)
    {
        builder.ToTable(
            "travel_plans",
            table => table.HasCheckConstraint(
                "ck_travel_plans_dates",
                "travel_end_date >= travel_start_date AND travel_end_date - travel_start_date <= 29"));
        Audit.Configure(builder);
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.SavedItineraryId).HasColumnName("saved_itinerary_id");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(x => x.TravelStartDate).HasColumnName("travel_start_date");
        builder.Property(x => x.TravelEndDate).HasColumnName("travel_end_date");
        builder.Property(x => x.Pace).HasColumnName("pace").HasMaxLength(20).IsRequired();
        builder.Property(x => x.AccessibilityConsiderations).HasColumnName("accessibility_considerations").HasMaxLength(1_000);
        builder.Property(x => x.DietaryConsiderations).HasColumnName("dietary_considerations").HasMaxLength(1_000);
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
        builder.Property(x => x.RuleVersion).HasColumnName("rule_version").HasMaxLength(100).IsRequired();
        builder.Property(x => x.InputFingerprint).HasColumnName("input_fingerprint").HasMaxLength(64).IsRequired();
        builder.Property(x => x.CurrentRevisionNumber).HasColumnName("current_revision_number");
        builder.HasIndex(x => new { x.CustomerId, x.Status, x.UpdatedAtUtc })
            .HasDatabaseName("ix_travel_plans_customer_status_updated");
        builder.HasIndex(x => new { x.CustomerId, x.SavedItineraryId })
            .HasDatabaseName("ix_travel_plans_customer_saved_itinerary");
        builder.HasIndex(x => new { x.RuleVersion, x.InputFingerprint })
            .HasDatabaseName("ix_travel_plans_rule_fingerprint");
        builder.HasMany(x => x.Destinations).WithOne().HasForeignKey(x => x.TravelPlanId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Travellers).WithOne().HasForeignKey(x => x.TravelPlanId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Interests).WithOne().HasForeignKey(x => x.TravelPlanId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Preferences).WithOne().HasForeignKey(x => x.TravelPlanId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Revisions).WithOne().HasForeignKey(x => x.TravelPlanId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class TravelPlanDestinationConfiguration : IEntityTypeConfiguration<TravelPlanDestination>
{
    public void Configure(EntityTypeBuilder<TravelPlanDestination> builder)
    {
        builder.ToTable("travel_plan_destinations");
        builder.HasKey(x => new { x.TravelPlanId, x.Slug });
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.Slug).HasColumnName("destination_slug").HasMaxLength(200);
        builder.Property(x => x.Position).HasColumnName("position");
        builder.HasIndex(x => new { x.TravelPlanId, x.Position }).IsUnique()
            .HasDatabaseName("ux_travel_plan_destinations_order");
        builder.HasIndex(x => x.Slug).HasDatabaseName("ix_travel_plan_destinations_slug");
    }
}

internal sealed class TravelPlanTravellerConfiguration : IEntityTypeConfiguration<TravelPlanTraveller>
{
    public void Configure(EntityTypeBuilder<TravelPlanTraveller> builder)
    {
        builder.ToTable("travel_plan_travellers");
        builder.HasKey(x => new { x.TravelPlanId, x.TravellerId });
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.TravellerId).HasColumnName("traveller_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.HasIndex(x => x.TravellerId).HasDatabaseName("ix_travel_plan_travellers_traveller");
    }
}

internal sealed class TravelPlanInterestConfiguration : IEntityTypeConfiguration<TravelPlanInterest>
{
    public void Configure(EntityTypeBuilder<TravelPlanInterest> builder)
    {
        builder.ToTable("travel_plan_interests");
        builder.HasKey(x => new { x.TravelPlanId, x.Slug });
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.Slug).HasColumnName("interest_slug").HasMaxLength(200);
        builder.Property(x => x.Position).HasColumnName("position");
    }
}

internal sealed class TravelPlanPreferenceConfiguration : IEntityTypeConfiguration<TravelPlanPreference>
{
    public void Configure(EntityTypeBuilder<TravelPlanPreference> builder)
    {
        builder.ToTable("travel_plan_preferences");
        builder.HasKey(x => new { x.TravelPlanId, x.Kind, x.Slug });
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.Kind).HasColumnName("kind").HasMaxLength(30);
        builder.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(200);
        builder.Property(x => x.Position).HasColumnName("position");
        builder.HasIndex(x => new { x.Kind, x.Slug }).HasDatabaseName("ix_travel_plan_preferences_lookup");
    }
}

internal sealed class ItineraryRevisionConfiguration : IEntityTypeConfiguration<ItineraryRevision>
{
    public void Configure(EntityTypeBuilder<ItineraryRevision> builder)
    {
        builder.ToTable("itinerary_revisions");
        Audit.Configure(builder);
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.RevisionNumber).HasColumnName("revision_number");
        builder.Property(x => x.RuleVersion).HasColumnName("rule_version").HasMaxLength(100);
        builder.Property(x => x.InputFingerprint).HasColumnName("input_fingerprint").HasMaxLength(64);
        builder.Property(x => x.GeneratedAtUtc).HasColumnName("generated_at_utc");
        builder.HasIndex(x => new { x.TravelPlanId, x.RevisionNumber }).IsUnique()
            .HasDatabaseName("ux_itinerary_revisions_plan_number");
        builder.HasMany(x => x.Days).WithOne().HasForeignKey(x => x.ItineraryRevisionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ItineraryDayConfiguration : IEntityTypeConfiguration<ItineraryDay>
{
    public void Configure(EntityTypeBuilder<ItineraryDay> builder)
    {
        builder.ToTable("itinerary_days");
        Audit.Configure(builder);
        builder.Property(x => x.ItineraryRevisionId).HasColumnName("itinerary_revision_id");
        builder.Property(x => x.DayNumber).HasColumnName("day_number");
        builder.Property(x => x.Date).HasColumnName("date");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.HasIndex(x => new { x.ItineraryRevisionId, x.DayNumber }).IsUnique()
            .HasDatabaseName("ux_itinerary_days_revision_order");
        builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.ItineraryDayId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ItineraryItemConfiguration : IEntityTypeConfiguration<ItineraryItem>
{
    public void Configure(EntityTypeBuilder<ItineraryItem> builder)
    {
        builder.ToTable("itinerary_items");
        Audit.Configure(builder);
        builder.Property(x => x.ItineraryDayId).HasColumnName("itinerary_day_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(2_000);
        builder.Property(x => x.DurationMinutes).HasColumnName("duration_minutes");
        builder.Property(x => x.DestinationSlug).HasColumnName("destination_slug").HasMaxLength(200);
        builder.Property(x => x.ProductSlug).HasColumnName("product_slug").HasMaxLength(200);
        builder.Property(x => x.Source).HasColumnName("source").HasMaxLength(20);
        builder.HasIndex(x => new { x.ItineraryDayId, x.Position })
            .HasDatabaseName("ix_itinerary_items_day_order");
        builder.HasIndex(x => x.ProductSlug).HasDatabaseName("ix_itinerary_items_product_slug");
        builder.HasIndex(x => x.DestinationSlug).HasDatabaseName("ix_itinerary_items_destination_slug");
    }
}

internal static class Audit
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        builder.Property(x => x.ConcurrencyToken).HasColumnName("concurrency_token").IsConcurrencyToken();
    }
}
