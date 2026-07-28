using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.OrganisationsAgents.Domain;

public sealed class Organisation : AuditableEntity
{
    private Organisation()
    {
    }

    public Organisation(Guid id, string name, string slug)
        : base(id)
    {
        Name = name.Trim();
        Slug = slug.Trim();
        IsActive = true;
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public ICollection<OrganisationUser> Users { get; } = [];
}

public sealed class OrganisationUser : AuditableEntity
{
    private OrganisationUser()
    {
    }

    public OrganisationUser(Guid id, Guid organisationId, Guid userId, string membershipRole)
        : base(id)
    {
        OrganisationId = organisationId;
        UserId = userId;
        MembershipRole = membershipRole.Trim();
        IsActive = true;
    }

    public Guid OrganisationId { get; private set; }

    public Guid UserId { get; private set; }

    public string MembershipRole { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public Organisation Organisation { get; private set; } = null!;
}

public sealed class AgentAccount : AuditableEntity
{
    private AgentAccount()
    {
    }

    public AgentAccount(Guid id, Guid organisationId, Guid userId)
        : base(id)
    {
        OrganisationId = organisationId;
        UserId = userId;
        IsActive = true;
    }

    public Guid OrganisationId { get; private set; }

    public Guid UserId { get; private set; }

    public bool IsActive { get; private set; }

    public Organisation Organisation { get; private set; } = null!;
}
