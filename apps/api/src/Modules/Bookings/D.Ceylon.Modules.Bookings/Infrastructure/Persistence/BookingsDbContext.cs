using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Bookings.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Bookings.Infrastructure.Persistence;

public sealed class BookingsDbContext(
    DbContextOptions<BookingsDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(BookingsSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingsDbContext).Assembly);
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
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.CreatedAtUtc).IsModified = false;
                entry.Property(entity => entity.UpdatedAtUtc).CurrentValue = now;
                entry.Property(entity => entity.ConcurrencyToken).CurrentValue = Guid.NewGuid();
            }
        }

        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
}

public static class BookingsSchema
{
    public const string Name = "bookings";
}
