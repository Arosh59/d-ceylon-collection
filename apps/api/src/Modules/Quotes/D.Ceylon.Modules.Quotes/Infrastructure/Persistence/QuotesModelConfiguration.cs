using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Quotes.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.Quotes.Infrastructure.Persistence;

internal sealed class QuoteRequestConfiguration : IEntityTypeConfiguration<QuoteRequest>
{
    public void Configure(EntityTypeBuilder<QuoteRequest> builder)
    {
        builder.ToTable(
            "quote_requests",
            table => table.HasCheckConstraint(
                "ck_quote_requests_dates",
                "travel_end_date >= travel_start_date"));
        QuoteAudit.Configure(builder);
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.TravelPlanId).HasColumnName("travel_plan_id");
        builder.Property(x => x.ItineraryRevisionId).HasColumnName("itinerary_revision_id");
        builder.Property(x => x.ItineraryRevisionNumber).HasColumnName("itinerary_revision_number");
        builder.Property(x => x.ItineraryTitle).HasColumnName("itinerary_title").HasMaxLength(200);
        builder.Property(x => x.TravelStartDate).HasColumnName("travel_start_date");
        builder.Property(x => x.TravelEndDate).HasColumnName("travel_end_date");
        builder.Property(x => x.RuleVersion).HasColumnName("rule_version").HasMaxLength(100);
        builder.Property(x => x.ItineraryFingerprint)
            .HasColumnName("itinerary_fingerprint")
            .HasMaxLength(64);
        builder.Property(x => x.CustomerNotes).HasColumnName("customer_notes").HasMaxLength(2_000);
        builder.HasIndex(x => new { x.CustomerId, x.ItineraryRevisionId })
            .IsUnique()
            .HasDatabaseName("ux_quote_requests_customer_revision");
        builder.HasIndex(x => x.TravelPlanId)
            .HasDatabaseName("ix_quote_requests_travel_plan");
    }
}

internal sealed class QuoteConfiguration : IEntityTypeConfiguration<Quote>
{
    public void Configure(EntityTypeBuilder<Quote> builder)
    {
        builder.ToTable(
            "quotes",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_quotes_status",
                    "status IN ('draft','sent','accepted','declined','expired','withdrawn')");
                table.HasCheckConstraint(
                    "ck_quotes_currency",
                    "currency IS NULL OR currency IN ('EUR','GBP','LKR','USD')");
            });
        QuoteAudit.Configure(builder);
        builder.Property(x => x.RequestId).HasColumnName("request_id");
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.OrganisationId).HasColumnName("organisation_id");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.DraftAssumptions)
            .HasColumnName("draft_assumptions")
            .HasColumnType("text[]");
        builder.Property(x => x.DraftInclusions)
            .HasColumnName("draft_inclusions")
            .HasColumnType("text[]");
        builder.Property(x => x.DraftExclusions)
            .HasColumnName("draft_exclusions")
            .HasColumnType("text[]");
        builder.Property(x => x.DraftTerms).HasColumnName("draft_terms").HasMaxLength(5_000);
        builder.Property(x => x.InternalNotes).HasColumnName("internal_notes").HasMaxLength(2_000);
        builder.Property(x => x.CurrentVersionNumber).HasColumnName("current_version_number");
        builder.Property(x => x.CurrentVersionId).HasColumnName("current_version_id");
        builder.Property(x => x.CurrentExpiresAtUtc).HasColumnName("current_expires_at_utc");
        builder.HasOne(x => x.Request)
            .WithOne(x => x.Quote)
            .HasForeignKey<Quote>(x => x.RequestId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.RequestId).IsUnique()
            .HasDatabaseName("ux_quotes_request");
        builder.HasIndex(x => new { x.CustomerId, x.Status, x.UpdatedAtUtc })
            .HasDatabaseName("ix_quotes_customer_status_updated");
        builder.HasIndex(x => new { x.OrganisationId, x.Status, x.UpdatedAtUtc })
            .HasDatabaseName("ix_quotes_organisation_status_updated");
        builder.HasIndex(x => new { x.Status, x.CurrentExpiresAtUtc })
            .HasDatabaseName("ix_quotes_status_expiry");
        builder.HasMany(x => x.DraftLines)
            .WithOne()
            .HasForeignKey(x => x.QuoteId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.DraftComponents)
            .WithOne()
            .HasForeignKey(x => x.QuoteId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Versions)
            .WithOne()
            .HasForeignKey(x => x.QuoteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class QuoteDraftLineConfiguration : IEntityTypeConfiguration<QuoteDraftLine>
{
    public void Configure(EntityTypeBuilder<QuoteDraftLine> builder)
    {
        builder.ToTable(
            "quote_draft_lines",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_quote_draft_lines_quantity",
                    "quantity > 0 AND quantity <= 1000");
                table.HasCheckConstraint(
                    "ck_quote_draft_lines_unit_amount",
                    "unit_amount >= 0 AND unit_amount <= 99999999.99");
            });
        QuoteAudit.Configure(builder);
        builder.Property(x => x.QuoteId).HasColumnName("quote_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(1_000);
        builder.Property(x => x.Quantity).HasColumnName("quantity").HasPrecision(12, 2);
        builder.Property(x => x.UnitAmount).HasColumnName("unit_amount").HasPrecision(18, 2);
        builder.HasIndex(x => new { x.QuoteId, x.Position }).IsUnique()
            .HasDatabaseName("ux_quote_draft_lines_order");
    }
}

internal sealed class QuoteDraftPriceComponentConfiguration
    : IEntityTypeConfiguration<QuoteDraftPriceComponent>
{
    public void Configure(EntityTypeBuilder<QuoteDraftPriceComponent> builder)
    {
        builder.ToTable(
            "quote_draft_price_components",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_quote_draft_components_kind",
                    "kind IN ('tax','adjustment')");
                table.HasCheckConstraint(
                    "ck_quote_draft_components_amount",
                    "amount >= -99999999.99 AND amount <= 99999999.99");
            });
        QuoteAudit.Configure(builder);
        builder.Property(x => x.QuoteId).HasColumnName("quote_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Kind).HasColumnName("kind").HasMaxLength(20);
        builder.Property(x => x.Label).HasColumnName("label").HasMaxLength(200);
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.HasIndex(x => new { x.QuoteId, x.Position }).IsUnique()
            .HasDatabaseName("ux_quote_draft_components_order");
    }
}

internal sealed class QuoteVersionConfiguration : IEntityTypeConfiguration<QuoteVersion>
{
    public void Configure(EntityTypeBuilder<QuoteVersion> builder)
    {
        builder.ToTable(
            "quote_versions",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_quote_versions_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
                table.HasCheckConstraint(
                    "ck_quote_versions_expiry",
                    "expires_at_utc > sent_at_utc");
                table.HasCheckConstraint(
                    "ck_quote_versions_totals",
                    "subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0");
            });
        QuoteAudit.Configure(builder);
        builder.Property(x => x.QuoteId).HasColumnName("quote_id");
        builder.Property(x => x.VersionNumber).HasColumnName("version_number");
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.SentAtUtc).HasColumnName("sent_at_utc");
        builder.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc");
        builder.Property(x => x.CreatedBySubject)
            .HasColumnName("created_by_subject")
            .HasMaxLength(200);
        builder.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(18, 2);
        builder.Property(x => x.TaxTotal).HasColumnName("tax_total").HasPrecision(18, 2);
        builder.Property(x => x.AdjustmentTotal)
            .HasColumnName("adjustment_total")
            .HasPrecision(18, 2);
        builder.Property(x => x.GrandTotal).HasColumnName("grand_total").HasPrecision(18, 2);
        builder.Property(x => x.Assumptions)
            .HasColumnName("assumptions")
            .HasColumnType("text[]");
        builder.Property(x => x.Inclusions)
            .HasColumnName("inclusions")
            .HasColumnType("text[]");
        builder.Property(x => x.Exclusions)
            .HasColumnName("exclusions")
            .HasColumnType("text[]");
        builder.Property(x => x.Terms).HasColumnName("terms").HasMaxLength(5_000);
        builder.HasIndex(x => new { x.QuoteId, x.VersionNumber }).IsUnique()
            .HasDatabaseName("ux_quote_versions_quote_number");
        builder.HasIndex(x => x.ExpiresAtUtc)
            .HasDatabaseName("ix_quote_versions_expiry");
        builder.HasMany(x => x.Lines)
            .WithOne()
            .HasForeignKey(x => x.QuoteVersionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Components)
            .WithOne()
            .HasForeignKey(x => x.QuoteVersionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class QuoteVersionLineConfiguration : IEntityTypeConfiguration<QuoteVersionLine>
{
    public void Configure(EntityTypeBuilder<QuoteVersionLine> builder)
    {
        builder.ToTable("quote_version_lines");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.QuoteVersionId).HasColumnName("quote_version_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(1_000);
        builder.Property(x => x.Quantity).HasColumnName("quantity").HasPrecision(12, 2);
        builder.Property(x => x.UnitAmount).HasColumnName("unit_amount").HasPrecision(18, 2);
        builder.Property(x => x.LineTotal).HasColumnName("line_total").HasPrecision(18, 2);
        builder.HasIndex(x => new { x.QuoteVersionId, x.Position }).IsUnique()
            .HasDatabaseName("ux_quote_version_lines_order");
    }
}

internal sealed class QuoteVersionPriceComponentConfiguration
    : IEntityTypeConfiguration<QuoteVersionPriceComponent>
{
    public void Configure(EntityTypeBuilder<QuoteVersionPriceComponent> builder)
    {
        builder.ToTable("quote_version_price_components");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.QuoteVersionId).HasColumnName("quote_version_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Kind).HasColumnName("kind").HasMaxLength(20);
        builder.Property(x => x.Label).HasColumnName("label").HasMaxLength(200);
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.HasIndex(x => new { x.QuoteVersionId, x.Position }).IsUnique()
            .HasDatabaseName("ux_quote_version_components_order");
    }
}

internal static class QuoteAudit
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        builder.Property(x => x.ConcurrencyToken)
            .HasColumnName("concurrency_token")
            .IsConcurrencyToken();
    }
}
