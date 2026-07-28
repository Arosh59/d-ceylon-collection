using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace D.Ceylon.Modules.IdentityAccess.Security;

public static class AccessClaimTypes
{
    public const string CustomerId = "customer_id";
    public const string OrganisationId = "organisation_id";
    public const string Permission = "permission";
    public const string Subject = "sub";
}

public static class AccessRoles
{
    public const string Administrator = "administrator";
    public const string Agent = "agent";
    public const string Customer = "customer";
    public const string Staff = "staff";
}

public static class AccessPolicies
{
    public const string Administrator = "access:administrator";
    public const string Agent = "access:agent";
    public const string Customer = "access:customer";
    public const string Staff = "access:staff";
    public const string CustomerOwner = "ownership:customer";
    public const string OrganisationOwner = "ownership:organisation";
}

public sealed record CustomerResource(Guid CustomerId);

public sealed record OrganisationResource(Guid OrganisationId);

public sealed class CustomerOwnerRequirement : IAuthorizationRequirement;

public sealed class OrganisationOwnerRequirement : IAuthorizationRequirement;

public sealed class CustomerOwnerAuthorizationHandler
    : AuthorizationHandler<CustomerOwnerRequirement, CustomerResource>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CustomerOwnerRequirement requirement,
        CustomerResource resource)
    {
        if (context.User.IsInRole(AccessRoles.Administrator)
            || MatchesIdentifier(
                context.User.FindFirstValue(AccessClaimTypes.CustomerId),
                resource.CustomerId))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }

    private static bool MatchesIdentifier(string? claimValue, Guid expected) =>
        Guid.TryParse(claimValue, out var actual) && actual == expected;
}

public sealed class OrganisationOwnerAuthorizationHandler
    : AuthorizationHandler<OrganisationOwnerRequirement, OrganisationResource>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OrganisationOwnerRequirement requirement,
        OrganisationResource resource)
    {
        if (context.User.IsInRole(AccessRoles.Administrator)
            || (context.User.IsInRole(AccessRoles.Agent)
                && MatchesIdentifier(
                    context.User.FindFirstValue(AccessClaimTypes.OrganisationId),
                    resource.OrganisationId)))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }

    private static bool MatchesIdentifier(string? claimValue, Guid expected) =>
        Guid.TryParse(claimValue, out var actual) && actual == expected;
}
