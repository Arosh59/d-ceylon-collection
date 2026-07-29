using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Payments.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Payments.Infrastructure.Persistence;

public sealed class PaymentsDbContext(
    DbContextOptions<PaymentsDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Refund> Refunds => Set<Refund>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(PaymentsSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PaymentsDbContext).Assembly);
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

public static class PaymentsSchema
{
    public const string Name = "payments";
}
