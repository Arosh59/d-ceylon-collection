using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace D.Ceylon.Modules.IdentityAccess.Security;

public sealed class AccessClaimsTransformation(ExternalIdentityOptions options)
    : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
        {
            return Task.FromResult(principal);
        }

        CopyClaims(identity, options.RoleClaim, ClaimTypes.Role);
        CopyClaims(identity, options.PermissionClaim, AccessClaimTypes.Permission);
        CopyClaims(identity, options.OrganisationClaim, AccessClaimTypes.OrganisationId);
        CopyClaims(identity, options.CustomerClaim, AccessClaimTypes.CustomerId);
        return Task.FromResult(principal);
    }

    private static void CopyClaims(
        ClaimsIdentity identity,
        string sourceType,
        string destinationType)
    {
        if (string.Equals(sourceType, destinationType, StringComparison.Ordinal))
        {
            return;
        }

        var existing = identity.FindAll(destinationType)
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.Ordinal);
        foreach (var claim in identity.FindAll(sourceType).ToArray())
        {
            if (existing.Add(claim.Value))
            {
                identity.AddClaim(new Claim(destinationType, claim.Value, claim.ValueType, claim.Issuer));
            }
        }
    }
}
