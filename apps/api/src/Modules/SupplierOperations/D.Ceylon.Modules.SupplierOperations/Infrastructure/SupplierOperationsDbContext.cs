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
