using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Catalogue.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Persistence;

public sealed class CatalogueDbContext(
    DbContextOptions<CatalogueDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<ProductType> ProductTypes => Set<ProductType>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<TravelCollectionEntry> Collections => Set<TravelCollectionEntry>();

    public DbSet<Destination> Destinations => Set<Destination>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.HasDefaultSchema(CatalogueSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogueDbContext).Assembly);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAuditValues();
        return base.SaveChanges(acceptAllChangesOnSuccess);
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

public static class CatalogueSchema
{
    public const string Name = "catalogue";
}
