using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence;

public sealed class ItinerariesTravelPlanningDbContext(
    DbContextOptions<ItinerariesTravelPlanningDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<TravelPlan> TravelPlans => Set<TravelPlan>();
    public DbSet<ItineraryRevision> ItineraryRevisions => Set<ItineraryRevision>();
    public DbSet<ItineraryDay> ItineraryDays => Set<ItineraryDay>();
    public DbSet<ItineraryItem> ItineraryItems => Set<ItineraryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(ItinerariesTravelPlanningSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ItinerariesTravelPlanningDbContext).Assembly);
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

public static class ItinerariesTravelPlanningSchema
{
    public const string Name = "itineraries_travel_planning";
}
