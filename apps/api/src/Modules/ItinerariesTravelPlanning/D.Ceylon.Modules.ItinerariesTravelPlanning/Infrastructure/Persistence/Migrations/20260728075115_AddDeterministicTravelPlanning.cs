using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDeterministicTravelPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "itineraries_travel_planning");

            migrationBuilder.CreateTable(
                name: "travel_plans",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    saved_itinerary_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    travel_start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    travel_end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    pace = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    accessibility_considerations = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    dietary_considerations = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    rule_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    input_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    current_revision_number = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_plans", x => x.id);
                    table.CheckConstraint("ck_travel_plans_dates", "travel_end_date >= travel_start_date AND travel_end_date - travel_start_date <= 29");
                });

            migrationBuilder.CreateTable(
                name: "itinerary_revisions",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    revision_number = table.Column<int>(type: "integer", nullable: false),
                    rule_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    input_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    generated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itinerary_revisions", x => x.id);
                    table.ForeignKey(
                        name: "FK_itinerary_revisions_travel_plans_travel_plan_id",
                        column: x => x.travel_plan_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "travel_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "travel_plan_destinations",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    destination_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_plan_destinations", x => new { x.travel_plan_id, x.destination_slug });
                    table.ForeignKey(
                        name: "FK_travel_plan_destinations_travel_plans_travel_plan_id",
                        column: x => x.travel_plan_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "travel_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "travel_plan_interests",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    interest_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_plan_interests", x => new { x.travel_plan_id, x.interest_slug });
                    table.ForeignKey(
                        name: "FK_travel_plan_interests_travel_plans_travel_plan_id",
                        column: x => x.travel_plan_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "travel_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "travel_plan_preferences",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_plan_preferences", x => new { x.travel_plan_id, x.kind, x.slug });
                    table.ForeignKey(
                        name: "FK_travel_plan_preferences_travel_plans_travel_plan_id",
                        column: x => x.travel_plan_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "travel_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "travel_plan_travellers",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    travel_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    traveller_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_plan_travellers", x => new { x.travel_plan_id, x.traveller_id });
                    table.ForeignKey(
                        name: "FK_travel_plan_travellers_travel_plans_travel_plan_id",
                        column: x => x.travel_plan_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "travel_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "itinerary_days",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    itinerary_revision_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_number = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itinerary_days", x => x.id);
                    table.ForeignKey(
                        name: "FK_itinerary_days_itinerary_revisions_itinerary_revision_id",
                        column: x => x.itinerary_revision_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "itinerary_revisions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "itinerary_items",
                schema: "itineraries_travel_planning",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    itinerary_day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    destination_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    product_slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_itinerary_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_itinerary_items_itinerary_days_itinerary_day_id",
                        column: x => x.itinerary_day_id,
                        principalSchema: "itineraries_travel_planning",
                        principalTable: "itinerary_days",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_itinerary_days_revision_order",
                schema: "itineraries_travel_planning",
                table: "itinerary_days",
                columns: new[] { "itinerary_revision_id", "day_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_itinerary_items_day_order",
                schema: "itineraries_travel_planning",
                table: "itinerary_items",
                columns: new[] { "itinerary_day_id", "position" });

            migrationBuilder.CreateIndex(
                name: "ix_itinerary_items_destination_slug",
                schema: "itineraries_travel_planning",
                table: "itinerary_items",
                column: "destination_slug");

            migrationBuilder.CreateIndex(
                name: "ix_itinerary_items_product_slug",
                schema: "itineraries_travel_planning",
                table: "itinerary_items",
                column: "product_slug");

            migrationBuilder.CreateIndex(
                name: "ux_itinerary_revisions_plan_number",
                schema: "itineraries_travel_planning",
                table: "itinerary_revisions",
                columns: new[] { "travel_plan_id", "revision_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_travel_plan_destinations_slug",
                schema: "itineraries_travel_planning",
                table: "travel_plan_destinations",
                column: "destination_slug");

            migrationBuilder.CreateIndex(
                name: "ux_travel_plan_destinations_order",
                schema: "itineraries_travel_planning",
                table: "travel_plan_destinations",
                columns: new[] { "travel_plan_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_travel_plan_preferences_lookup",
                schema: "itineraries_travel_planning",
                table: "travel_plan_preferences",
                columns: new[] { "kind", "slug" });

            migrationBuilder.CreateIndex(
                name: "ix_travel_plan_travellers_traveller",
                schema: "itineraries_travel_planning",
                table: "travel_plan_travellers",
                column: "traveller_id");

            migrationBuilder.CreateIndex(
                name: "ix_travel_plans_customer_saved_itinerary",
                schema: "itineraries_travel_planning",
                table: "travel_plans",
                columns: new[] { "customer_id", "saved_itinerary_id" });

            migrationBuilder.CreateIndex(
                name: "ix_travel_plans_customer_status_updated",
                schema: "itineraries_travel_planning",
                table: "travel_plans",
                columns: new[] { "customer_id", "status", "updated_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_travel_plans_rule_fingerprint",
                schema: "itineraries_travel_planning",
                table: "travel_plans",
                columns: new[] { "rule_version", "input_fingerprint" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "itinerary_items",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "travel_plan_destinations",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "travel_plan_interests",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "travel_plan_preferences",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "travel_plan_travellers",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "itinerary_days",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "itinerary_revisions",
                schema: "itineraries_travel_planning");

            migrationBuilder.DropTable(
                name: "travel_plans",
                schema: "itineraries_travel_planning");
        }
    }
}
