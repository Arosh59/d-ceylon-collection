using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.IdentityAccess.Domain;

public sealed class ApplicationUser : AuditableEntity
{
    private ApplicationUser()
    {
    }

    public ApplicationUser(
        Guid id,
        string issuer,
        string subject,
        string? email,
        string displayName)
        : base(id)
    {
        Issuer = Require(issuer, 500);
        Subject = Require(subject, 200);
        Email = Optional(email, 320);
        DisplayName = Require(displayName, 200);
        IsActive = true;
    }

    public string Issuer { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public string? Email { get; private set; }

    public string DisplayName { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public DateTimeOffset? LastAuthenticatedAtUtc { get; private set; }

    public ICollection<UserRole> UserRoles { get; } = [];

    public void RecordAuthentication(DateTimeOffset occurredAtUtc) =>
        LastAuthenticatedAtUtc = occurredAtUtc;

    private static string Require(string value, int maximumLength)
    {
        var result = value.Trim();
        if (result.Length is 0 || result.Length > maximumLength)
        {
            throw new ArgumentOutOfRangeException(nameof(value));
        }

        return result;
    }

    private static string? Optional(string? value, int maximumLength)
    {
        var result = value?.Trim();
        if (string.IsNullOrEmpty(result))
        {
            return null;
        }

        return result.Length <= maximumLength
            ? result
            : throw new ArgumentOutOfRangeException(nameof(value));
    }
}

public sealed class Role : AuditableEntity
{
    private Role()
    {
    }

    public Role(Guid id, string code, string name)
        : base(id)
    {
        Code = code;
        Name = name;
    }

    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public ICollection<UserRole> UserRoles { get; } = [];

    public ICollection<RolePermissionGrant> RolePermissions { get; } = [];
}

public sealed class PermissionGrant : AuditableEntity
{
    private PermissionGrant()
    {
    }

    public PermissionGrant(Guid id, string code, string name)
        : base(id)
    {
        Code = code;
        Name = name;
    }

    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public ICollection<RolePermissionGrant> RolePermissions { get; } = [];
}

public sealed class UserRole
{
    private UserRole()
    {
    }

    public UserRole(Guid userId, Guid roleId)
    {
        UserId = userId;
        RoleId = roleId;
    }

    public Guid UserId { get; private set; }

    public Guid RoleId { get; private set; }

    public ApplicationUser User { get; private set; } = null!;

    public Role Role { get; private set; } = null!;
}

public sealed class RolePermissionGrant
{
    private RolePermissionGrant()
    {
    }

    public RolePermissionGrant(Guid roleId, Guid permissionId)
    {
        RoleId = roleId;
        PermissionId = permissionId;
    }

    public Guid RoleId { get; private set; }

    public Guid PermissionId { get; private set; }

    public Role Role { get; private set; } = null!;

    public PermissionGrant Permission { get; private set; } = null!;
}

public sealed class CustomerAccount : AuditableEntity
{
    private CustomerAccount()
    {
    }

    public CustomerAccount(Guid id, Guid userId)
        : base(id)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("A customer owner is required.", nameof(userId));
        }

        UserId = userId;
    }

    public Guid UserId { get; private set; }

    public ApplicationUser User { get; private set; } = null!;
}

public sealed class SecurityAuditEvent : AuditableEntity
{
    private SecurityAuditEvent()
    {
    }

    public SecurityAuditEvent(
        Guid id,
        string eventType,
        string outcome,
        string? subject,
        string correlationId,
        DateTimeOffset occurredAtUtc)
        : base(id)
    {
        EventType = eventType;
        Outcome = outcome;
        Subject = subject;
        CorrelationId = correlationId;
        OccurredAtUtc = occurredAtUtc;
    }

    public string EventType { get; private set; } = string.Empty;

    public string Outcome { get; private set; } = string.Empty;

    public string? Subject { get; private set; }

    public string CorrelationId { get; private set; } = string.Empty;

    public DateTimeOffset OccurredAtUtc { get; private set; }
}
