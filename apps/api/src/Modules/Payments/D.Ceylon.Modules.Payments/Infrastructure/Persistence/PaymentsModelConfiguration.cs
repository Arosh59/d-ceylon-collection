using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Payments.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.Payments.Infrastructure.Persistence;

internal sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable(
            "payments",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_payments_status",
                    "status IN ('pending','authorised','captured','failed','refunded','cancelled')");
                table.HasCheckConstraint(
                    "ck_payments_kind",
                    "kind IN ('deposit','balance','manual-transfer','payment-link')");
                table.HasCheckConstraint(
                    "ck_payments_gateway",
                    "gateway IN ('stripe','local','manual')");
                table.HasCheckConstraint(
                    "ck_payments_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
                table.HasCheckConstraint(
                    "ck_payments_amount",
                    "amount > 0 AND amount <= 99999999.99");
                table.HasCheckConstraint(
                    "ck_payments_reconciliation",
                    "reconciliation_status IN ('unreconciled','reconciled','disputed')");
            });

        PaymentAudit.Configure(builder);
        builder.Property(x => x.BookingId).HasColumnName("booking_id");
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(64);
        builder.Property(x => x.Kind).HasColumnName("kind").HasMaxLength(30);
        builder.Property(x => x.Gateway).HasColumnName("gateway").HasMaxLength(30);
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(x => x.ReconciliationStatus)
            .HasColumnName("reconciliation_status")
            .HasMaxLength(20);
        builder.Property(x => x.PaymentLinkUrl)
            .HasColumnName("payment_link_url")
            .HasMaxLength(500);
        builder.Property(x => x.PaymentLinkExpiresAtUtc)
            .HasColumnName("payment_link_expires_at_utc");
        builder.Property(x => x.CapturedAtUtc).HasColumnName("captured_at_utc");
        builder.Property(x => x.FailedReason)
            .HasColumnName("failed_reason")
            .HasMaxLength(500);

        builder.HasIndex(x => x.IdempotencyKey).IsUnique()
            .HasDatabaseName("ux_payments_idempotency_key");
        builder.HasIndex(x => new { x.CustomerId, x.BookingId, x.Status })
            .HasDatabaseName("ix_payments_customer_booking_status");
        builder.HasIndex(x => new { x.BookingId, x.Status })
            .HasDatabaseName("ix_payments_booking_status");
        builder.HasIndex(x => new { x.ReconciliationStatus, x.Status })
            .HasDatabaseName("ix_payments_reconciliation_status");

        builder.HasMany(x => x.Transactions)
            .WithOne()
            .HasForeignKey(x => x.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Refunds)
            .WithOne()
            .HasForeignKey(x => x.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable(
            "payment_transactions",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_payment_transactions_gateway",
                    "gateway IN ('stripe','local','manual')");
                table.HasCheckConstraint(
                    "ck_payment_transactions_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
            });

        PaymentAudit.Configure(builder);
        builder.Property(x => x.PaymentId).HasColumnName("payment_id");
        builder.Property(x => x.Gateway).HasColumnName("gateway").HasMaxLength(30);
        builder.Property(x => x.GatewayReference)
            .HasColumnName("gateway_reference")
            .HasMaxLength(200);
        builder.Property(x => x.EventType).HasColumnName("event_type").HasMaxLength(50);
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.OccurredAtUtc).HasColumnName("occurred_at_utc");
        builder.Property(x => x.WebhookSignatureVerified)
            .HasColumnName("webhook_signature_verified");

        builder.HasIndex(x => new { x.PaymentId, x.OccurredAtUtc })
            .HasDatabaseName("ix_payment_transactions_payment_occurred");
        builder.HasIndex(x => x.GatewayReference)
            .HasDatabaseName("ix_payment_transactions_gateway_reference");
    }
}

internal sealed class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.ToTable(
            "refunds",
            table =>
            {
                table.HasCheckConstraint(
                    "ck_refunds_status",
                    "status IN ('pending','succeeded','failed')");
                table.HasCheckConstraint(
                    "ck_refunds_currency",
                    "currency IN ('EUR','GBP','LKR','USD')");
                table.HasCheckConstraint(
                    "ck_refunds_amount",
                    "amount > 0 AND amount <= 99999999.99");
            });

        PaymentAudit.Configure(builder);
        builder.Property(x => x.PaymentId).HasColumnName("payment_id");
        builder.Property(x => x.IdempotencyKey)
            .HasColumnName("idempotency_key")
            .HasMaxLength(64);
        builder.Property(x => x.GatewayReference)
            .HasColumnName("gateway_reference")
            .HasMaxLength(200);
        builder.Property(x => x.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(500);
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(x => x.InitiatedBySubject)
            .HasColumnName("initiated_by_subject")
            .HasMaxLength(200);
        builder.Property(x => x.ApprovedBySubject)
            .HasColumnName("approved_by_subject")
            .HasMaxLength(200);

        builder.HasIndex(x => x.IdempotencyKey).IsUnique()
            .HasDatabaseName("ux_refunds_idempotency_key");
        builder.HasIndex(x => new { x.PaymentId, x.Status })
            .HasDatabaseName("ix_refunds_payment_status");
    }
}

internal static class PaymentAudit
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
