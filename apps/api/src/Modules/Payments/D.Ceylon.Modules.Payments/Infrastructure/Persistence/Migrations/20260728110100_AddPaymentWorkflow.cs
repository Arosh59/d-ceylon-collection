using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.Payments.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "payments");

            migrationBuilder.CreateTable(
                name: "payments",
                schema: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    gateway = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    reconciliation_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    payment_link_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    payment_link_expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    captured_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    failed_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.id);
                    table.CheckConstraint("ck_payments_amount", "amount > 0 AND amount <= 99999999.99");
                    table.CheckConstraint("ck_payments_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_payments_gateway", "gateway IN ('stripe','local','manual')");
                    table.CheckConstraint("ck_payments_kind", "kind IN ('deposit','balance','manual-transfer','payment-link')");
                    table.CheckConstraint("ck_payments_reconciliation", "reconciliation_status IN ('unreconciled','reconciled','disputed')");
                    table.CheckConstraint("ck_payments_status", "status IN ('pending','authorised','captured','failed','refunded','cancelled')");
                });

            migrationBuilder.CreateTable(
                name: "payment_transactions",
                schema: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    gateway = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    gateway_reference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    occurred_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    webhook_signature_verified = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_transactions", x => x.id);
                    table.CheckConstraint("ck_payment_transactions_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_payment_transactions_gateway", "gateway IN ('stripe','local','manual')");
                    table.ForeignKey(
                        name: "FK_payment_transactions_payments_payment_id",
                        column: x => x.payment_id,
                        principalSchema: "payments",
                        principalTable: "payments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refunds",
                schema: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    gateway_reference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    initiated_by_subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    approved_by_subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refunds", x => x.id);
                    table.CheckConstraint("ck_refunds_amount", "amount > 0 AND amount <= 99999999.99");
                    table.CheckConstraint("ck_refunds_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_refunds_status", "status IN ('pending','succeeded','failed')");
                    table.ForeignKey(
                        name: "FK_refunds_payments_payment_id",
                        column: x => x.payment_id,
                        principalSchema: "payments",
                        principalTable: "payments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Indexes
            migrationBuilder.CreateIndex(
                name: "ux_payments_idempotency_key",
                schema: "payments",
                table: "payments",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_payments_customer_booking_status",
                schema: "payments",
                table: "payments",
                columns: new[] { "customer_id", "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_payments_booking_status",
                schema: "payments",
                table: "payments",
                columns: new[] { "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_payments_reconciliation_status",
                schema: "payments",
                table: "payments",
                columns: new[] { "reconciliation_status", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_payment_transactions_payment_occurred",
                schema: "payments",
                table: "payment_transactions",
                columns: new[] { "payment_id", "occurred_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_payment_transactions_gateway_reference",
                schema: "payments",
                table: "payment_transactions",
                column: "gateway_reference");

            migrationBuilder.CreateIndex(
                name: "ux_refunds_idempotency_key",
                schema: "payments",
                table: "refunds",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_refunds_payment_status",
                schema: "payments",
                table: "refunds",
                columns: new[] { "payment_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "refunds", schema: "payments");
            migrationBuilder.DropTable(name: "payment_transactions", schema: "payments");
            migrationBuilder.DropTable(name: "payments", schema: "payments");
            migrationBuilder.DropSchema(name: "payments");
        }
    }
}
