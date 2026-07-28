using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "customers_travellers");

            migrationBuilder.CreateTable(
                name: "customer_profiles",
                schema: "customers_travellers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    given_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    family_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contact_email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    contact_phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    country_code = table.Column<string>(type: "character(2)", fixedLength: true, maxLength: 2, nullable: true),
                    preferred_locale = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    preferred_contact_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    marketing_consent = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "saved_itineraries",
                schema: "customers_travellers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    travel_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    travel_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    primary_destination_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saved_itineraries", x => x.id);
                    table.CheckConstraint("ck_saved_itineraries_travel_dates", "travel_end_date IS NULL OR travel_start_date IS NULL OR travel_end_date >= travel_start_date");
                });

            migrationBuilder.CreateTable(
                name: "travellers",
                schema: "customers_travellers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    given_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    family_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    date_of_birth = table.Column<DateOnly>(type: "date", nullable: true),
                    accessibility_needs = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    dietary_needs = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    emergency_contact_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    emergency_contact_phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travellers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "wishlist_entries",
                schema: "customers_travellers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wishlist_entries", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_customer_profiles_contact_email",
                schema: "customers_travellers",
                table: "customer_profiles",
                column: "contact_email");

            migrationBuilder.CreateIndex(
                name: "ix_customer_profiles_updated_at",
                schema: "customers_travellers",
                table: "customer_profiles",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_customer_profiles_customer_id",
                schema: "customers_travellers",
                table: "customer_profiles",
                column: "customer_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_saved_itineraries_customer_archived_updated",
                schema: "customers_travellers",
                table: "saved_itineraries",
                columns: new[] { "customer_id", "is_archived", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_saved_itineraries_destination_slug",
                schema: "customers_travellers",
                table: "saved_itineraries",
                column: "primary_destination_slug");

            migrationBuilder.CreateIndex(
                name: "ix_saved_itineraries_updated_at",
                schema: "customers_travellers",
                table: "saved_itineraries",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_travellers_customer_id",
                schema: "customers_travellers",
                table: "travellers",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_travellers_customer_name",
                schema: "customers_travellers",
                table: "travellers",
                columns: new[] { "customer_id", "family_name", "given_name" });

            migrationBuilder.CreateIndex(
                name: "ix_travellers_updated_at",
                schema: "customers_travellers",
                table: "travellers",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_wishlist_entries_customer_created_at",
                schema: "customers_travellers",
                table: "wishlist_entries",
                columns: new[] { "customer_id", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_wishlist_entries_updated_at",
                schema: "customers_travellers",
                table: "wishlist_entries",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_wishlist_entries_customer_product",
                schema: "customers_travellers",
                table: "wishlist_entries",
                columns: new[] { "customer_id", "product_slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_profiles",
                schema: "customers_travellers");

            migrationBuilder.DropTable(
                name: "saved_itineraries",
                schema: "customers_travellers");

            migrationBuilder.DropTable(
                name: "travellers",
                schema: "customers_travellers");

            migrationBuilder.DropTable(
                name: "wishlist_entries",
                schema: "customers_travellers");
        }
    }
}
