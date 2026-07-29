using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Bookings.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.Bookings.Infrastructure.Persistence;

internal sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable(
            "bookings",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_bookings_dates",
                    "travel_end_date >= travel_start_date");
                table.HasCheckConstraint(
                    "ck_bookings_status",
                    "status IN ('pending-confirmation','confirmed','partially-paid','paid','in-progress','completed','cancellation-requested','cancelled','refunded')");
                table.HasCheckConstraint(
                    "ck_bookings_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
                table.HasCheckConstraint(
                    "ck_bookings_amounts",
                    "total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount + 0.01");
            });

        BookingAudit.Configure(builder);
        builder.Property(x => x.BookingReference).HasColumnName("booking_reference").HasMaxLength(30);
        builder.Property(x => x.QuoteId).HasColumnName("quote_id");
        builder.Property(x => x.QuoteVersionId).HasColumnName("quote_version_id");
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.OrganisationId).HasColumnName("organisation_id");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(40);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(18, 2);
        builder.Property(x => x.PaidAmount).HasColumnName("paid_amount").HasPrecision(18, 2);
        builder.Property(x => x.TravelStartDate).HasColumnName("travel_start_date");
        builder.Property(x => x.TravelEndDate).HasColumnName("travel_end_date");
        builder.Property(x => x.ItineraryTitle).HasColumnName("itinerary_title").HasMaxLength(200);
        builder.Property(x => x.CustomerNotes).HasColumnName("customer_notes").HasMaxLength(2_000);
        builder.Property(x => x.InternalNotes).HasColumnName("internal_notes").HasMaxLength(2_000);
        builder.Property(x => x.ConfirmedAtUtc).HasColumnName("confirmed_at_utc");
        builder.Property(x => x.CancelledAtUtc).HasColumnName("cancelled_at_utc");
        builder.Property(x => x.CancellationReason)
            .HasColumnName("cancellation_reason")
            .HasMaxLength(500);

        builder.HasIndex(x => x.BookingReference).IsUnique()
            .HasDatabaseName("ux_bookings_reference");
        builder.HasIndex(x => x.QuoteId).IsUnique()
            .HasDatabaseName("ux_bookings_quote");
        builder.HasIndex(x => new { x.CustomerId, x.Status, x.UpdatedAtUtc })
            .HasDatabaseName("ix_bookings_customer_status_updated");
        builder.HasIndex(x => new { x.OrganisationId, x.Status, x.UpdatedAtUtc })
            .HasDatabaseName("ix_bookings_organisation_status_updated");
        builder.HasIndex(x => new { x.Status, x.TravelStartDate })
            .HasDatabaseName("ix_bookings_status_start_date");

        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Invoices)
            .WithOne()
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Vouchers)
            .WithOne()
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
{
    public void Configure(EntityTypeBuilder<BookingItem> builder)
    {
        builder.ToTable(
            "booking_items",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_booking_items_quantity",
                    "quantity > 0 AND quantity <= 1000");
                table.HasCheckConstraint(
                    "ck_booking_items_amounts",
                    "unit_amount >= 0 AND line_total >= 0");
            });

        BookingAudit.Configure(builder);
        builder.Property(x => x.BookingId).HasColumnName("booking_id");
        builder.Property(x => x.Position).HasColumnName("position");
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(1_000);
        builder.Property(x => x.Quantity).HasColumnName("quantity").HasPrecision(12, 2);
        builder.Property(x => x.UnitAmount).HasColumnName("unit_amount").HasPrecision(18, 2);
        builder.Property(x => x.LineTotal).HasColumnName("line_total").HasPrecision(18, 2);

        builder.HasIndex(x => new { x.BookingId, x.Position }).IsUnique()
            .HasDatabaseName("ux_booking_items_order");
    }
}

internal sealed class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable(
            "invoices",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_invoices_status",
                    "status IN ('draft','issued','paid','void')");
                table.HasCheckConstraint(
                    "ck_invoices_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
                table.HasCheckConstraint(
                    "ck_invoices_amounts",
                    "subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0");
            });

        BookingAudit.Configure(builder);
        builder.Property(x => x.BookingId).HasColumnName("booking_id");
        builder.Property(x => x.InvoiceNumber).HasColumnName("invoice_number").HasMaxLength(30);
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(18, 2);
        builder.Property(x => x.TaxTotal).HasColumnName("tax_total").HasPrecision(18, 2);
        builder.Property(x => x.AdjustmentTotal)
            .HasColumnName("adjustment_total")
            .HasPrecision(18, 2);
        builder.Property(x => x.GrandTotal).HasColumnName("grand_total").HasPrecision(18, 2);
        builder.Property(x => x.IssuedAtUtc).HasColumnName("issued_at_utc");
        builder.Property(x => x.DueAtUtc).HasColumnName("due_at_utc");
        builder.Property(x => x.PaidAtUtc).HasColumnName("paid_at_utc");
        builder.Property(x => x.DocumentKey).HasColumnName("document_key").HasMaxLength(500);

        builder.HasIndex(x => x.InvoiceNumber).IsUnique()
            .HasDatabaseName("ux_invoices_number");
        builder.HasIndex(x => new { x.BookingId, x.Status })
            .HasDatabaseName("ix_invoices_booking_status");
    }
}

internal sealed class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.ToTable(
            "vouchers",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_vouchers_status",
                    "status IN ('issued','redeemed','cancelled','expired')");
                table.HasCheckConstraint(
                    "ck_vouchers_validity",
                    "valid_until >= valid_from");
            });

        BookingAudit.Configure(builder);
        builder.Property(x => x.BookingId).HasColumnName("booking_id");
        builder.Property(x => x.VoucherCode).HasColumnName("voucher_code").HasMaxLength(50);
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200);
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(2_000);
        builder.Property(x => x.ValidFrom).HasColumnName("valid_from");
        builder.Property(x => x.ValidUntil).HasColumnName("valid_until");
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(x => x.RedeemedAtUtc).HasColumnName("redeemed_at_utc");
        builder.Property(x => x.IssuedAtUtc).HasColumnName("issued_at_utc");
        builder.Property(x => x.DocumentKey).HasColumnName("document_key").HasMaxLength(500);

        builder.HasIndex(x => x.VoucherCode).IsUnique()
            .HasDatabaseName("ux_vouchers_code");
        builder.HasIndex(x => new { x.BookingId, x.Status })
            .HasDatabaseName("ix_vouchers_booking_status");
    }
}

internal static class BookingAudit
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
