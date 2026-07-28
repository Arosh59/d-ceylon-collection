using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase5OrganisationsAgents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "organisations_agents");

            migrationBuilder.CreateTable(
                name: "organisations",
                schema: "organisations_agents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "agents",
                schema: "organisations_agents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organisation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agents", x => x.id);
                    table.ForeignKey(
                        name: "FK_agents_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalSchema: "organisations_agents",
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "organisation_users",
                schema: "organisations_agents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organisation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    membership_role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    concurrency_token = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organisation_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_organisation_users_organisations_organisation_id",
                        column: x => x.organisation_id,
                        principalSchema: "organisations_agents",
                        principalTable: "organisations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_agents_organisation_active",
                schema: "organisations_agents",
                table: "agents",
                columns: new[] { "organisation_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ux_agents_user_id",
                schema: "organisations_agents",
                table: "agents",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_organisation_users_organisation_active",
                schema: "organisations_agents",
                table: "organisation_users",
                columns: new[] { "organisation_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_organisation_users_user_id",
                schema: "organisations_agents",
                table: "organisation_users",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ux_organisation_users_organisation_user",
                schema: "organisations_agents",
                table: "organisation_users",
                columns: new[] { "organisation_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_organisations_is_active",
                schema: "organisations_agents",
                table: "organisations",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ux_organisations_slug",
                schema: "organisations_agents",
                table: "organisations",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agents",
                schema: "organisations_agents");

            migrationBuilder.DropTable(
                name: "organisation_users",
                schema: "organisations_agents");

            migrationBuilder.DropTable(
                name: "organisations",
                schema: "organisations_agents");
        }
    }
}
