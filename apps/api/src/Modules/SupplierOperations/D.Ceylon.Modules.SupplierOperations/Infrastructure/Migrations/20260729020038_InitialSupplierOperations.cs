using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D.Ceylon.Modules.SupplierOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSupplierOperations : Migration
    {
        private static readonly string[] BookingStatusColumns = ["BookingId", "Status"];
        private static readonly string[] SupplierStatusColumns = ["SupplierId", "Status"];
        private static readonly string[] SupplierNameColumns = ["Status", "Name"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "supplier_operations");

            migrationBuilder.CreateTable(
                name: "booking_operation_tasks",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_operation_tasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ContactName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_booking_operation_tasks_BookingId_Status",
                schema: "supplier_operations",
                table: "booking_operation_tasks",
                columns: BookingStatusColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_operation_tasks_SupplierId_Status",
                schema: "supplier_operations",
                table: "booking_operation_tasks",
                columns: SupplierStatusColumns);

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_Status_Name",
                schema: "supplier_operations",
                table: "suppliers",
                columns: SupplierNameColumns);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "booking_operation_tasks",
                schema: "supplier_operations");

            migrationBuilder.DropTable(
                name: "suppliers",
                schema: "supplier_operations");
        }
    }
}
