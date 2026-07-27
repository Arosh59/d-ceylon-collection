using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCatalogue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalogue");

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "collections",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collections", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "destinations",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_destinations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_types",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    short_description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    starting_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    publication_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                    table.CheckConstraint("ck_products_currency", "char_length(currency) = 3");
                    table.CheckConstraint("ck_products_duration", "duration_minutes IS NULL OR duration_minutes > 0");
                    table.CheckConstraint("ck_products_starting_price", "starting_price IS NULL OR starting_price >= 0");
                    table.ForeignKey(
                        name: "FK_products_product_types_product_type_id",
                        column: x => x.product_type_id,
                        principalSchema: "catalogue",
                        principalTable: "product_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_categories",
                schema: "catalogue",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_categories", x => new { x.product_id, x.category_id });
                    table.ForeignKey(
                        name: "FK_product_categories_categories_category_id",
                        column: x => x.category_id,
                        principalSchema: "catalogue",
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_categories_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalogue",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_collections",
                schema: "catalogue",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    collection_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_collections", x => new { x.product_id, x.collection_id });
                    table.ForeignKey(
                        name: "FK_product_collections_collections_collection_id",
                        column: x => x.collection_id,
                        principalSchema: "catalogue",
                        principalTable: "collections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_collections_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalogue",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_destinations",
                schema: "catalogue",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    destination_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_destinations", x => new { x.product_id, x.destination_id });
                    table.ForeignKey(
                        name: "FK_product_destinations_destinations_destination_id",
                        column: x => x.destination_id,
                        principalSchema: "catalogue",
                        principalTable: "destinations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_destinations_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalogue",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_categories_name",
                schema: "catalogue",
                table: "categories",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_categories_updated_at_utc",
                schema: "catalogue",
                table: "categories",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_categories_slug",
                schema: "catalogue",
                table: "categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_collections_name",
                schema: "catalogue",
                table: "collections",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_collections_updated_at_utc",
                schema: "catalogue",
                table: "collections",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_collections_slug",
                schema: "catalogue",
                table: "collections",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_destinations_name",
                schema: "catalogue",
                table: "destinations",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_destinations_updated_at_utc",
                schema: "catalogue",
                table: "destinations",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_destinations_slug",
                schema: "catalogue",
                table: "destinations",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_product_categories_category_id",
                schema: "catalogue",
                table: "product_categories",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_collections_collection_id",
                schema: "catalogue",
                table: "product_collections",
                column: "collection_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_destinations_destination_id",
                schema: "catalogue",
                table: "product_destinations",
                column: "destination_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_types_name",
                schema: "catalogue",
                table: "product_types",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_product_types_updated_at_utc",
                schema: "catalogue",
                table: "product_types",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_product_types_slug",
                schema: "catalogue",
                table: "product_types",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_products_name",
                schema: "catalogue",
                table: "products",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_products_product_type_id",
                schema: "catalogue",
                table: "products",
                column: "product_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_products_publication_state",
                schema: "catalogue",
                table: "products",
                column: "publication_state");

            migrationBuilder.CreateIndex(
                name: "ix_products_updated_at_utc",
                schema: "catalogue",
                table: "products",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_products_slug",
                schema: "catalogue",
                table: "products",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_categories",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "product_collections",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "product_destinations",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "categories",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "collections",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "destinations",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "products",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "product_types",
                schema: "catalogue");
        }
    }
}
