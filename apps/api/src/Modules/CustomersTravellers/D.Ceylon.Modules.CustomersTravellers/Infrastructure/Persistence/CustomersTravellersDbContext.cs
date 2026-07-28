using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.CustomersTravellers.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;

public sealed class CustomersTravellersDbContext(
    DbContextOptions<CustomersTravellersDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();

    public DbSet<Traveller> Travellers => Set<Traveller>();

    public DbSet<WishlistEntry> WishlistEntries => Set<WishlistEntry>();

    public DbSet<SavedItinerary> SavedItineraries => Set<SavedItinerary>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(CustomersTravellersSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CustomersTravellersDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditValues();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyAuditValues()
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
    }
}

public static class CustomersTravellersSchema
{
    public const string Name = "customers_travellers";
}
