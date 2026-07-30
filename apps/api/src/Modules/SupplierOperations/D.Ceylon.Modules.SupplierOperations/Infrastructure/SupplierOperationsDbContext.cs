using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.SupplierOperations.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.SupplierOperations.Infrastructure;

public sealed class SupplierOperationsDbContext(
    DbContextOptions<SupplierOperationsDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<BookingOperationTask> Tasks => Set<BookingOperationTask>();

    public DbSet<Vehicle> Vehicles => Set<Vehicle>();

    public DbSet<Driver> Drivers => Set<Driver>();

    public DbSet<Guide> Guides => Set<Guide>();

    public DbSet<Arrival> Arrivals => Set<Arrival>();

    public DbSet<BookingResourceAssignment> Assignments => Set<BookingResourceAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("supplier_operations");

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("suppliers");
            entity.Property(supplier => supplier.Name).HasMaxLength(200);
            entity.Property(supplier => supplier.Category).HasMaxLength(60);
            entity.Property(supplier => supplier.ContactName).HasMaxLength(120);
            entity.Property(supplier => supplier.ContactEmail).HasMaxLength(320);
            entity.Property(supplier => supplier.Status).HasMaxLength(20);
            entity.HasIndex(supplier => new { supplier.Status, supplier.Name });
        });

        modelBuilder.Entity<BookingOperationTask>(entity =>
        {
            entity.ToTable("booking_operation_tasks");
            entity.Property(task => task.Title).HasMaxLength(200);
            entity.Property(task => task.Status).HasMaxLength(20);
            entity.Property(task => task.Notes).HasMaxLength(2000);
            entity.HasIndex(task => new { task.BookingId, task.Status });
            entity.HasIndex(task => new { task.SupplierId, task.Status });
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("vehicles");
            entity.Property(vehicle => vehicle.Name).HasMaxLength(160);
            entity.Property(vehicle => vehicle.RegistrationNumber).HasMaxLength(40);
            entity.Property(vehicle => vehicle.Status).HasMaxLength(20);
            entity.Property(vehicle => vehicle.Notes).HasMaxLength(1000);
            entity.HasIndex(vehicle => vehicle.RegistrationNumber).IsUnique();
            entity.HasIndex(vehicle => new { vehicle.SupplierId, vehicle.Status });
        });

        modelBuilder.Entity<Driver>(entity =>
        {
            entity.ToTable("drivers");
            entity.Property(driver => driver.Name).HasMaxLength(160);
            entity.Property(driver => driver.Phone).HasMaxLength(40);
            entity.Property(driver => driver.LicenceNumber).HasMaxLength(80);
            entity.Property(driver => driver.Status).HasMaxLength(20);
            entity.HasIndex(driver => new { driver.Status, driver.Name });
            entity.HasIndex(driver => driver.LicenceNumber).IsUnique();
        });

        modelBuilder.Entity<Guide>(entity =>
        {
            entity.ToTable("guides");
            entity.Property(guide => guide.Name).HasMaxLength(160);
            entity.Property(guide => guide.Phone).HasMaxLength(40);
            entity.Property(guide => guide.Languages).HasMaxLength(300);
            entity.Property(guide => guide.Status).HasMaxLength(20);
            entity.HasIndex(guide => new { guide.Status, guide.Name });
        });

        modelBuilder.Entity<Arrival>(entity =>
        {
            entity.ToTable("arrivals");
            entity.Property(arrival => arrival.Airport).HasMaxLength(120);
            entity.Property(arrival => arrival.FlightNumber).HasMaxLength(30);
            entity.Property(arrival => arrival.Status).HasMaxLength(20);
            entity.Property(arrival => arrival.Notes).HasMaxLength(1000);
            entity.HasIndex(arrival => new { arrival.BookingId, arrival.ArrivalAtUtc });
            entity.HasIndex(arrival => new { arrival.Status, arrival.ArrivalAtUtc });
        });

        modelBuilder.Entity<BookingResourceAssignment>(entity =>
        {
            entity.ToTable("booking_resource_assignments");
            entity.Property(assignment => assignment.Status).HasMaxLength(20);
            entity.Property(assignment => assignment.Notes).HasMaxLength(1000);
            entity.HasIndex(assignment => new { assignment.BookingId, assignment.ServiceDate });
            entity.HasIndex(assignment => new { assignment.DriverId, assignment.ServiceDate });
            entity.HasIndex(assignment => new { assignment.GuideId, assignment.ServiceDate });
            entity.HasIndex(assignment => new { assignment.VehicleId, assignment.ServiceDate });
        });
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(entity => entity.CreatedAtUtc).CurrentValue = now;
                entry.Property(entity => entity.UpdatedAtUtc).CurrentValue = now;
                entry.Property(entity => entity.ConcurrencyToken).CurrentValue = Guid.NewGuid();
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.UpdatedAtUtc).CurrentValue = now;
                entry.Property(entity => entity.ConcurrencyToken).CurrentValue = Guid.NewGuid();
            }
        }

        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
}
