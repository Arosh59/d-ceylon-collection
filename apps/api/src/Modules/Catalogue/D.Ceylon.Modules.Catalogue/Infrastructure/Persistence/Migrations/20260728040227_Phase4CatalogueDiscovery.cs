using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4CatalogueDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "catalogue",
                table: "products",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector",
                schema: "catalogue",
                table: "products",
                type: "tsvector",
                nullable: false)
                .Annotation("Npgsql:TsVectorConfig", "english")
                .Annotation("Npgsql:TsVectorProperties", new[] { "name", "short_description", "description" });

            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "catalogue",
                table: "destinations",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "hero_media_id",
                schema: "catalogue",
                table: "destinations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "publication_state",
                schema: "catalogue",
                table: "destinations",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Draft");

            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "catalogue",
                table: "collections",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "hero_media_id",
                schema: "catalogue",
                table: "collections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "publication_state",
                schema: "catalogue",
                table: "collections",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Draft");

            migrationBuilder.AddColumn<string>(
                name: "summary",
                schema: "catalogue",
                table: "collections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "media_assets",
                schema: "catalogue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    alt_text = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    width = table.Column<int>(type: "integer", nullable: false),
                    height = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_media_assets", x => x.id);
                    table.CheckConstraint("ck_media_assets_height", "height > 0");
                    table.CheckConstraint("ck_media_assets_width", "width > 0");
                });

            migrationBuilder.CreateTable(
                name: "tags",
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
                    table.PrimaryKey("PK_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_media",
                schema: "catalogue",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    media_asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_media", x => new { x.product_id, x.media_asset_id });
                    table.CheckConstraint("ck_product_media_sort_order", "sort_order >= 0");
                    table.ForeignKey(
                        name: "FK_product_media_media_assets_media_asset_id",
                        column: x => x.media_asset_id,
                        principalSchema: "catalogue",
                        principalTable: "media_assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_product_media_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalogue",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_tags",
                schema: "catalogue",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_tags", x => new { x.product_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_product_tags_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalogue",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalSchema: "catalogue",
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_products_publication_state_name",
                schema: "catalogue",
                table: "products",
                columns: new[] { "publication_state", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_products_search_vector",
                schema: "catalogue",
                table: "products",
                column: "search_vector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "ix_destinations_hero_media_id",
                schema: "catalogue",
                table: "destinations",
                column: "hero_media_id");

            migrationBuilder.CreateIndex(
                name: "ix_destinations_publication_state",
                schema: "catalogue",
                table: "destinations",
                column: "publication_state");

            migrationBuilder.CreateIndex(
                name: "ix_collections_hero_media_id",
                schema: "catalogue",
                table: "collections",
                column: "hero_media_id");

            migrationBuilder.CreateIndex(
                name: "ix_collections_publication_state",
                schema: "catalogue",
                table: "collections",
                column: "publication_state");

            migrationBuilder.CreateIndex(
                name: "ix_media_assets_updated_at_utc",
                schema: "catalogue",
                table: "media_assets",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_media_assets_asset_key",
                schema: "catalogue",
                table: "media_assets",
                column: "asset_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_product_media_media_asset_id",
                schema: "catalogue",
                table: "product_media",
                column: "media_asset_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_media_product_id_sort_order",
                schema: "catalogue",
                table: "product_media",
                columns: new[] { "product_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_product_tags_tag_id",
                schema: "catalogue",
                table: "product_tags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "ix_tags_name",
                schema: "catalogue",
                table: "tags",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_tags_updated_at_utc",
                schema: "catalogue",
                table: "tags",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ux_tags_slug",
                schema: "catalogue",
                table: "tags",
                column: "slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_collections_media_assets_hero_media_id",
                schema: "catalogue",
                table: "collections",
                column: "hero_media_id",
                principalSchema: "catalogue",
                principalTable: "media_assets",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_destinations_media_assets_hero_media_id",
                schema: "catalogue",
                table: "destinations",
                column: "hero_media_id",
                principalSchema: "catalogue",
                principalTable: "media_assets",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_collections_media_assets_hero_media_id",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropForeignKey(
                name: "FK_destinations_media_assets_hero_media_id",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropTable(
                name: "product_media",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "product_tags",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "media_assets",
                schema: "catalogue");

            migrationBuilder.DropTable(
                name: "tags",
                schema: "catalogue");

            migrationBuilder.DropIndex(
                name: "ix_products_publication_state_name",
                schema: "catalogue",
                table: "products");

            migrationBuilder.DropIndex(
                name: "ix_products_search_vector",
                schema: "catalogue",
                table: "products");

            migrationBuilder.DropIndex(
                name: "ix_destinations_hero_media_id",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropIndex(
                name: "ix_destinations_publication_state",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropIndex(
                name: "ix_collections_hero_media_id",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropIndex(
                name: "ix_collections_publication_state",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "catalogue",
                table: "products");

            migrationBuilder.DropColumn(
                name: "search_vector",
                schema: "catalogue",
                table: "products");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropColumn(
                name: "hero_media_id",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropColumn(
                name: "publication_state",
                schema: "catalogue",
                table: "destinations");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropColumn(
                name: "hero_media_id",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropColumn(
                name: "publication_state",
                schema: "catalogue",
                table: "collections");

            migrationBuilder.DropColumn(
                name: "summary",
                schema: "catalogue",
                table: "collections");
        }
    }
}
