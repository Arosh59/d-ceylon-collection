using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.IdentityAccess.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;

public sealed class IdentityAccessDbContext(
    DbContextOptions<IdentityAccessDbContext> options,
    TimeProvider timeProvider)
    : DbContext(options)
{
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<PermissionGrant> Permissions => Set<PermissionGrant>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<RolePermissionGrant> RolePermissions => Set<RolePermissionGrant>();

    public DbSet<CustomerAccount> Customers => Set<CustomerAccount>();

    public DbSet<SecurityAuditEvent> SecurityAuditEvents => Set<SecurityAuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(IdentityAccessSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IdentityAccessDbContext).Assembly);
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

public static class IdentityAccessSchema
{
    public const string Name = "identity_access";
}
