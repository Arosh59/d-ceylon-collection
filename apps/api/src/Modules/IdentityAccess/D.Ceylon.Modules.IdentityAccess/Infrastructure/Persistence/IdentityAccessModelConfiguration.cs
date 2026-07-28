using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.IdentityAccess.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;

internal sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("users");
        AuditConfiguration.Configure(builder);
        builder.Property(entity => entity.Issuer).HasColumnName("issuer").HasMaxLength(500).IsRequired();
        builder.Property(entity => entity.Subject).HasColumnName("subject").HasMaxLength(200).IsRequired();
        builder.Property(entity => entity.Email).HasColumnName("email").HasMaxLength(320);
        builder.Property(entity => entity.DisplayName).HasColumnName("display_name").HasMaxLength(200).IsRequired();
        builder.Property(entity => entity.IsActive).HasColumnName("is_active");
        builder.Property(entity => entity.LastAuthenticatedAtUtc).HasColumnName("last_authenticated_at_utc");
        builder.HasIndex(entity => new { entity.Issuer, entity.Subject })
            .IsUnique()
            .HasDatabaseName("ux_users_issuer_subject");
        builder.HasIndex(entity => entity.Email).HasDatabaseName("ix_users_email");
        builder.HasIndex(entity => entity.IsActive).HasDatabaseName("ix_users_is_active");
    }
}

internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");
        AuditConfiguration.Configure(builder);
        builder.Property(entity => entity.Code).HasColumnName("code").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.Name).HasColumnName("name").HasMaxLength(160).IsRequired();
        builder.HasIndex(entity => entity.Code).IsUnique().HasDatabaseName("ux_roles_code");
    }
}

internal sealed class PermissionConfiguration : IEntityTypeConfiguration<PermissionGrant>
{
    public void Configure(EntityTypeBuilder<PermissionGrant> builder)
    {
        builder.ToTable("permissions");
        AuditConfiguration.Configure(builder);
        builder.Property(entity => entity.Code).HasColumnName("code").HasMaxLength(160).IsRequired();
        builder.Property(entity => entity.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.HasIndex(entity => entity.Code).IsUnique().HasDatabaseName("ux_permissions_code");
    }
}

internal sealed class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("user_roles");
        builder.HasKey(entity => new { entity.UserId, entity.RoleId });
        builder.Property(entity => entity.UserId).HasColumnName("user_id");
        builder.Property(entity => entity.RoleId).HasColumnName("role_id");
        builder.HasOne(entity => entity.User).WithMany(entity => entity.UserRoles)
            .HasForeignKey(entity => entity.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Role).WithMany(entity => entity.UserRoles)
            .HasForeignKey(entity => entity.RoleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.RoleId).HasDatabaseName("ix_user_roles_role_id");
    }
}

internal sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermissionGrant>
{
    public void Configure(EntityTypeBuilder<RolePermissionGrant> builder)
    {
        builder.ToTable("role_permissions");
        builder.HasKey(entity => new { entity.RoleId, entity.PermissionId });
        builder.Property(entity => entity.RoleId).HasColumnName("role_id");
        builder.Property(entity => entity.PermissionId).HasColumnName("permission_id");
        builder.HasOne(entity => entity.Role).WithMany(entity => entity.RolePermissions)
            .HasForeignKey(entity => entity.RoleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.Permission).WithMany(entity => entity.RolePermissions)
            .HasForeignKey(entity => entity.PermissionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => entity.PermissionId).HasDatabaseName("ix_role_permissions_permission_id");
    }
}

internal sealed class CustomerAccountConfiguration : IEntityTypeConfiguration<CustomerAccount>
{
    public void Configure(EntityTypeBuilder<CustomerAccount> builder)
    {
        builder.ToTable("customers");
        AuditConfiguration.Configure(builder);
        builder.Property(entity => entity.UserId).HasColumnName("user_id");
        builder.HasOne(entity => entity.User).WithOne()
            .HasForeignKey<CustomerAccount>(entity => entity.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(entity => entity.UserId).IsUnique().HasDatabaseName("ux_customers_user_id");
    }
}

internal sealed class SecurityAuditEventConfiguration : IEntityTypeConfiguration<SecurityAuditEvent>
{
    public void Configure(EntityTypeBuilder<SecurityAuditEvent> builder)
    {
        builder.ToTable("security_audit_events");
        AuditConfiguration.Configure(builder);
        builder.Property(entity => entity.EventType).HasColumnName("event_type").HasMaxLength(120).IsRequired();
        builder.Property(entity => entity.Outcome).HasColumnName("outcome").HasMaxLength(40).IsRequired();
        builder.Property(entity => entity.Subject).HasColumnName("subject").HasMaxLength(200);
        builder.Property(entity => entity.CorrelationId).HasColumnName("correlation_id").HasMaxLength(128).IsRequired();
        builder.Property(entity => entity.OccurredAtUtc).HasColumnName("occurred_at_utc");
        builder.HasIndex(entity => entity.OccurredAtUtc).HasDatabaseName("ix_security_audit_events_occurred_at");
        builder.HasIndex(entity => new { entity.Subject, entity.OccurredAtUtc })
            .HasDatabaseName("ix_security_audit_events_subject_occurred_at");
        builder.HasIndex(entity => entity.CorrelationId).HasDatabaseName("ix_security_audit_events_correlation_id");
    }
}

internal static class AuditConfiguration
{
    public static void Configure<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(entity => entity.CreatedAtUtc).HasColumnName("created_at_utc");
        builder.Property(entity => entity.UpdatedAtUtc).HasColumnName("updated_at_utc");
        builder.Property(entity => entity.ConcurrencyToken)
            .HasColumnName("concurrency_token")
            .IsConcurrencyToken();
    }
}
