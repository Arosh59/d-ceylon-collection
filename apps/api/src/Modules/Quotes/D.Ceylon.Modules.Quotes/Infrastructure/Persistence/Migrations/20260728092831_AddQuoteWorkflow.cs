using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.Quotes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "quotes");

            migrationBuilder.CreateTable(
                name: "quote_requests",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    itinerary_revision_id = table.Column<Guid>(type: "uuid", nullable: false),
                    itinerary_revision_number = table.Column<int>(type: "integer", nullable: false),
                    itinerary_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    travel_start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    travel_end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    rule_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    itinerary_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    customer_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_requests", x => x.id);
                    table.CheckConstraint("ck_quote_requests_dates", "travel_end_date >= travel_start_date");
                });

            migrationBuilder.CreateTable(
                name: "quotes",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organisation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    draft_assumptions = table.Column<string[]>(type: "text[]", nullable: false),
                    draft_inclusions = table.Column<string[]>(type: "text[]", nullable: false),
                    draft_exclusions = table.Column<string[]>(type: "text[]", nullable: false),
                    draft_terms = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    internal_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    current_version_number = table.Column<int>(type: "integer", nullable: false),
                    current_version_id = table.Column<Guid>(type: "uuid", nullable: true),
                    current_expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quotes", x => x.id);
                    table.CheckConstraint("ck_quotes_currency", "currency IS NULL OR currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_quotes_status", "status IN ('draft','sent','accepted','declined','expired','withdrawn')");
                    table.ForeignKey(
                        name: "FK_quotes_quote_requests_request_id",
                        column: x => x.request_id,
                        principalSchema: "quotes",
                        principalTable: "quote_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quote_draft_lines",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    unit_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_draft_lines", x => x.id);
                    table.CheckConstraint("ck_quote_draft_lines_quantity", "quantity > 0 AND quantity <= 1000");
                    table.CheckConstraint("ck_quote_draft_lines_unit_amount", "unit_amount >= 0 AND unit_amount <= 99999999.99");
                    table.ForeignKey(
                        name: "FK_quote_draft_lines_quotes_quote_id",
                        column: x => x.quote_id,
                        principalSchema: "quotes",
                        principalTable: "quotes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quote_draft_price_components",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_draft_price_components", x => x.id);
                    table.CheckConstraint("ck_quote_draft_components_amount", "amount >= -99999999.99 AND amount <= 99999999.99");
                    table.CheckConstraint("ck_quote_draft_components_kind", "kind IN ('tax','adjustment')");
                    table.ForeignKey(
                        name: "FK_quote_draft_price_components_quotes_quote_id",
                        column: x => x.quote_id,
                        principalSchema: "quotes",
                        principalTable: "quotes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quote_versions",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version_number = table.Column<int>(type: "integer", nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    sent_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by_subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    tax_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    adjustment_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    grand_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    assumptions = table.Column<string[]>(type: "text[]", nullable: false),
                    inclusions = table.Column<string[]>(type: "text[]", nullable: false),
                    exclusions = table.Column<string[]>(type: "text[]", nullable: false),
                    terms = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_versions", x => x.id);
                    table.CheckConstraint("ck_quote_versions_currency", "currency IN ('EUR','GBP','LKR','USD')");
                    table.CheckConstraint("ck_quote_versions_expiry", "expires_at_utc > sent_at_utc");
                    table.CheckConstraint("ck_quote_versions_totals", "subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0");
                    table.ForeignKey(
                        name: "FK_quote_versions_quotes_quote_id",
                        column: x => x.quote_id,
                        principalSchema: "quotes",
                        principalTable: "quotes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quote_version_lines",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    unit_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    line_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_version_lines", x => x.id);
                    table.ForeignKey(
                        name: "FK_quote_version_lines_quote_versions_quote_version_id",
                        column: x => x.quote_version_id,
                        principalSchema: "quotes",
                        principalTable: "quote_versions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quote_version_price_components",
                schema: "quotes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quote_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_version_price_components", x => x.id);
                    table.ForeignKey(
                        name: "FK_quote_version_price_components_quote_versions_quote_version~",
                        column: x => x.quote_version_id,
                        principalSchema: "quotes",
                        principalTable: "quote_versions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ux_quote_draft_lines_order",
                schema: "quotes",
                table: "quote_draft_lines",
                columns: new[] { "quote_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_quote_draft_components_order",
                schema: "quotes",
                table: "quote_draft_price_components",
                columns: new[] { "quote_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_quote_requests_travel_plan",
                schema: "quotes",
                table: "quote_requests",
                column: "travel_plan_id");

            migrationBuilder.CreateIndex(
                name: "ux_quote_requests_customer_revision",
                schema: "quotes",
                table: "quote_requests",
                columns: new[] { "customer_id", "itinerary_revision_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_quote_version_lines_order",
                schema: "quotes",
                table: "quote_version_lines",
                columns: new[] { "quote_version_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_quote_version_components_order",
                schema: "quotes",
                table: "quote_version_price_components",
                columns: new[] { "quote_version_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_quote_versions_expiry",
                schema: "quotes",
                table: "quote_versions",
                column: "expires_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_quote_versions_quote_number",
                schema: "quotes",
                table: "quote_versions",
                columns: new[] { "quote_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_quotes_customer_status_updated",
                schema: "quotes",
                table: "quotes",
                columns: new[] { "customer_id", "status", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_quotes_organisation_status_updated",
                schema: "quotes",
                table: "quotes",
                columns: new[] { "organisation_id", "status", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_quotes_status_expiry",
                schema: "quotes",
                table: "quotes",
                columns: new[] { "status", "current_expires_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ux_quotes_request",
                schema: "quotes",
                table: "quotes",
                column: "request_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "quote_draft_lines",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quote_draft_price_components",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quote_version_lines",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quote_version_price_components",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quote_versions",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quotes",
                schema: "quotes");

            migrationBuilder.DropTable(
                name: "quote_requests",
                schema: "quotes");
        }
    }
}
