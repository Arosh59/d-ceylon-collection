using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D.Ceylon.Modules.SupplierOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOperationalResources : Migration
    {
        private static readonly string[] ArrivalBookingColumns = ["BookingId", "ArrivalAtUtc"];
        private static readonly string[] ArrivalStatusColumns = ["Status", "ArrivalAtUtc"];
        private static readonly string[] AssignmentBookingColumns = ["BookingId", "ServiceDate"];
        private static readonly string[] AssignmentDriverColumns = ["DriverId", "ServiceDate"];
        private static readonly string[] AssignmentGuideColumns = ["GuideId", "ServiceDate"];
        private static readonly string[] AssignmentVehicleColumns = ["VehicleId", "ServiceDate"];
        private static readonly string[] PersonStatusColumns = ["Status", "Name"];
        private static readonly string[] VehicleSupplierColumns = ["SupplierId", "Status"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "arrivals",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArrivalAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Airport = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    FlightNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_arrivals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "booking_resource_assignments",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    GuideId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_resource_assignments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "drivers",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    LicenceNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_drivers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "guides",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Languages = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_guides", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "vehicles",
                schema: "supplier_operations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_arrivals_BookingId_ArrivalAtUtc",
                schema: "supplier_operations",
                table: "arrivals",
                columns: ArrivalBookingColumns);

            migrationBuilder.CreateIndex(
                name: "IX_arrivals_Status_ArrivalAtUtc",
                schema: "supplier_operations",
                table: "arrivals",
                columns: ArrivalStatusColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_resource_assignments_BookingId_ServiceDate",
                schema: "supplier_operations",
                table: "booking_resource_assignments",
                columns: AssignmentBookingColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_resource_assignments_DriverId_ServiceDate",
                schema: "supplier_operations",
                table: "booking_resource_assignments",
                columns: AssignmentDriverColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_resource_assignments_GuideId_ServiceDate",
                schema: "supplier_operations",
                table: "booking_resource_assignments",
                columns: AssignmentGuideColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_resource_assignments_VehicleId_ServiceDate",
                schema: "supplier_operations",
                table: "booking_resource_assignments",
                columns: AssignmentVehicleColumns);

            migrationBuilder.CreateIndex(
                name: "IX_drivers_LicenceNumber",
                schema: "supplier_operations",
                table: "drivers",
                column: "LicenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_drivers_Status_Name",
                schema: "supplier_operations",
                table: "drivers",
                columns: PersonStatusColumns);

            migrationBuilder.CreateIndex(
                name: "IX_guides_Status_Name",
                schema: "supplier_operations",
                table: "guides",
                columns: PersonStatusColumns);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_RegistrationNumber",
                schema: "supplier_operations",
                table: "vehicles",
                column: "RegistrationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_SupplierId_Status",
                schema: "supplier_operations",
                table: "vehicles",
                columns: VehicleSupplierColumns);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "arrivals",
                schema: "supplier_operations");

            migrationBuilder.DropTable(
                name: "booking_resource_assignments",
                schema: "supplier_operations");

            migrationBuilder.DropTable(
                name: "drivers",
                schema: "supplier_operations");

            migrationBuilder.DropTable(
                name: "guides",
                schema: "supplier_operations");

            migrationBuilder.DropTable(
                name: "vehicles",
                schema: "supplier_operations");
        }
    }
}
