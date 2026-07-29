using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.Bookings.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "bookings");

            migrationBuilder.CreateTable(
                name: "bookings",
                schema: "bookings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_reference = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    quote_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organisation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    paid_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    travel_start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    travel_end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    itinerary_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    customer_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    internal_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    confirmed_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancellation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.id);
                    table.CheckConstraint("ck_bookings_amounts", "total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount + 0.01");
                    table.CheckConstraint("ck_bookings_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_bookings_dates", "travel_end_date >= travel_start_date");
                    table.CheckConstraint("ck_bookings_status", "status IN ('pending-confirmation','confirmed','partially-paid','paid','in-progress','completed','cancellation-requested','cancelled','refunded')");
                });

            migrationBuilder.CreateTable(
                name: "booking_items",
                schema: "bookings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    unit_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    line_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_items", x => x.id);
                    table.CheckConstraint("ck_booking_items_amounts", "unit_amount >= 0 AND line_total >= 0");
                    table.CheckConstraint("ck_booking_items_quantity", "quantity > 0 AND quantity <= 1000");
                    table.ForeignKey(
                        name: "FK_booking_items_bookings_booking_id",
                        column: x => x.booking_id,
                        principalSchema: "bookings",
                        principalTable: "bookings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                schema: "bookings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    tax_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    adjustment_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    grand_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    issued_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    due_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    paid_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    document_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoices", x => x.id);
                    table.CheckConstraint("ck_invoices_amounts", "subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0");
                    table.CheckConstraint("ck_invoices_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_invoices_status", "status IN ('draft','issued','paid','void')");
                    table.ForeignKey(
                        name: "FK_invoices_bookings_booking_id",
                        column: x => x.booking_id,
                        principalSchema: "bookings",
                        principalTable: "bookings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vouchers",
                schema: "bookings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    voucher_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    valid_from = table.Column<DateOnly>(type: "date", nullable: false),
                    valid_until = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    redeemed_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    issued_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    document_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vouchers", x => x.id);
                    table.CheckConstraint("ck_vouchers_status", "status IN ('issued','redeemed','cancelled','expired')");
                    table.CheckConstraint("ck_vouchers_validity", "valid_until >= valid_from");
                    table.ForeignKey(
                        name: "FK_vouchers_bookings_booking_id",
                        column: x => x.booking_id,
                        principalSchema: "bookings",
                        principalTable: "bookings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Indexes
            migrationBuilder.CreateIndex(
                name: "ux_bookings_reference",
                schema: "bookings",
                table: "bookings",
                column: "booking_reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_bookings_quote",
                schema: "bookings",
                table: "bookings",
                column: "quote_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_bookings_customer_status_updated",
                schema: "bookings",
                table: "bookings",
                columns: new[] { "customer_id", "status", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_bookings_organisation_status_updated",
                schema: "bookings",
                table: "bookings",
                columns: new[] { "organisation_id", "status", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_bookings_status_start_date",
                schema: "bookings",
                table: "bookings",
                columns: new[] { "status", "travel_start_date" });

            migrationBuilder.CreateIndex(
                name: "ux_booking_items_order",
                schema: "bookings",
                table: "booking_items",
                columns: new[] { "booking_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_invoices_number",
                schema: "bookings",
                table: "invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_booking_status",
                schema: "bookings",
                table: "invoices",
                columns: new[] { "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ux_vouchers_code",
                schema: "bookings",
                table: "vouchers",
                column: "voucher_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vouchers_booking_status",
                schema: "bookings",
                table: "vouchers",
                columns: new[] { "booking_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "vouchers", schema: "bookings");
            migrationBuilder.DropTable(name: "invoices", schema: "bookings");
            migrationBuilder.DropTable(name: "booking_items", schema: "bookings");
            migrationBuilder.DropTable(name: "bookings", schema: "bookings");
            migrationBuilder.DropSchema(name: "bookings");
        }
    }
}
