using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.OrganisationsAgents.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence;

internal sealed class OrganisationConfiguration : IEntityTypeConfiguration<Organisation>
{
    public void Configure(EntityTypeBuilder<Organisation> builder)
    {
        builder.ToTable("organisations");
        OrganisationAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(entity => entity.Slug).HasColumnName("slug").HasMaxLength(160).IsRequired();
        builder.Property(entity => entity.IsActive).HasColumnName("is_active");
        builder.HasIndex(entity => entity.Slug).IsUnique().HasDatabaseName("ux_organisations_slug");
        builder.HasIndex(entity => entity.IsActive).HasDatabaseName("ix_organisations_is_active");
    }
}

internal sealed class OrganisationUserConfiguration : IEntityTypeConfiguration<OrganisationUser>
{
    public void Configure(EntityTypeBuilder<OrganisationUser> builder)
    {
        builder.ToTable("organisation_users");
        OrganisationAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.OrganisationId).HasColumnName("organisation_id");
        builder.Property(entity => entity.UserId).HasColumnName("user_id");
        builder.Property(entity => entity.MembershipRole).HasColumnName("membership_role").HasMaxLength(100).IsRequired();
        builder.Property(entity => entity.IsActive).HasColumnName("is_active");
        builder.HasOne(entity => entity.Organisation).WithMany(entity => entity.Users)
            .HasForeignKey(entity => entity.OrganisationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(entity => new { entity.OrganisationId, entity.UserId })
            .IsUnique().HasDatabaseName("ux_organisation_users_organisation_user");
        builder.HasIndex(entity => entity.UserId).HasDatabaseName("ix_organisation_users_user_id");
        builder.HasIndex(entity => new { entity.OrganisationId, entity.IsActive })
            .HasDatabaseName("ix_organisation_users_organisation_active");
    }
}

internal sealed class AgentAccountConfiguration : IEntityTypeConfiguration<AgentAccount>
{
    public void Configure(EntityTypeBuilder<AgentAccount> builder)
    {
        builder.ToTable("agents");
        OrganisationAuditConfiguration.Configure(builder);
        builder.Property(entity => entity.OrganisationId).HasColumnName("organisation_id");
        builder.Property(entity => entity.UserId).HasColumnName("user_id");
        builder.Property(entity => entity.IsActive).HasColumnName("is_active");
        builder.HasOne(entity => entity.Organisation).WithMany()
            .HasForeignKey(entity => entity.OrganisationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(entity => entity.UserId).IsUnique().HasDatabaseName("ux_agents_user_id");
        builder.HasIndex(entity => new { entity.OrganisationId, entity.IsActive })
            .HasDatabaseName("ix_agents_organisation_active");
    }
}

internal static class OrganisationAuditConfiguration
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
