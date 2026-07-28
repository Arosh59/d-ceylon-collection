using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.OrganisationsAgents.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence;

public sealed class OrganisationsAgentsDbContext(
    DbContextOptions<OrganisationsAgentsDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<Organisation> Organisations => Set<Organisation>();

    public DbSet<OrganisationUser> OrganisationUsers => Set<OrganisationUser>();

    public DbSet<AgentAccount> Agents => Set<AgentAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(OrganisationsAgentsSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OrganisationsAgentsDbContext).Assembly);
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

public static class OrganisationsAgentsSchema
{
    public const string Name = "organisations_agents";
}
