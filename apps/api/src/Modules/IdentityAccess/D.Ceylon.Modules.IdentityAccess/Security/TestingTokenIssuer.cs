using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace D.Ceylon.Modules.IdentityAccess.Security;

public sealed record TestingIdentity(
    string Subject,
    string DisplayName,
    string Email,
    IReadOnlyList<string> Roles,
    Guid? CustomerId,
    Guid? OrganisationId);

public sealed record TestingToken(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc,
    TestingIdentity Identity);

public interface ITestingTokenIssuer
{
    TestingToken Issue(string persona, TimeSpan? lifetime = null);
}

internal sealed class TestingTokenIssuer(
    TestingAuthenticationOptions options,
    TimeProvider timeProvider)
    : ITestingTokenIssuer
{
    public TestingToken Issue(string persona, TimeSpan? lifetime = null)
    {
        var identity = GetIdentity(persona);
        var now = timeProvider.GetUtcNow();
        var tokenLifetime = lifetime ?? TimeSpan.FromMinutes(10);
        var issuedAt = tokenLifetime <= TimeSpan.Zero
            ? now.Add(tokenLifetime).AddMinutes(-1)
            : now;
        var expires = issuedAt.Add(tokenLifetime <= TimeSpan.Zero
            ? TimeSpan.FromMinutes(1)
            : tokenLifetime);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, identity.Subject),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(
                JwtRegisteredClaimNames.Iat,
                issuedAt.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture),
                ClaimValueTypes.Integer64),
            new("name", identity.DisplayName),
            new("email", identity.Email),
        };
        claims.AddRange(identity.Roles.Select(role => new Claim("roles", role)));
        if (identity.CustomerId is { } customerId)
        {
            claims.Add(new Claim(AccessClaimTypes.CustomerId, customerId.ToString()));
        }

        if (identity.OrganisationId is { } organisationId)
        {
            claims.Add(new Claim(AccessClaimTypes.OrganisationId, organisationId.ToString()));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            options.Issuer,
            options.Audience,
            claims,
            issuedAt.UtcDateTime,
            expires.UtcDateTime,
            credentials);

        return new TestingToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            identity);
    }

    private static TestingIdentity GetIdentity(string persona) =>
        persona.Trim().ToLowerInvariant() switch
        {
            "customer" => new TestingIdentity(
                "test-customer",
                "Test Customer",
                "customer@example.test",
                [AccessRoles.Customer],
                Guid.Parse("10000000-0000-0000-0000-000000000001"),
                null),
            "customer-other" => new TestingIdentity(
                "test-customer-other",
                "Other Test Customer",
                "other-customer@example.test",
                [AccessRoles.Customer],
                Guid.Parse("10000000-0000-0000-0000-000000000002"),
                null),
            "agent" => new TestingIdentity(
                "test-agent",
                "Test Agent",
                "agent@example.test",
                [AccessRoles.Agent],
                null,
                Guid.Parse("20000000-0000-0000-0000-000000000001")),
            "agent-other" => new TestingIdentity(
                "test-agent-other",
                "Other Test Agent",
                "other-agent@example.test",
                [AccessRoles.Agent],
                null,
                Guid.Parse("20000000-0000-0000-0000-000000000002")),
            "staff" => new TestingIdentity(
                "test-staff",
                "Test Staff",
                "staff@example.test",
                [AccessRoles.Staff],
                null,
                null),
            "administrator" => new TestingIdentity(
                "test-administrator",
                "Test Administrator",
                "administrator@example.test",
                [AccessRoles.Administrator],
                null,
                null),
            _ => throw new ArgumentOutOfRangeException(
                nameof(persona),
                "Supported testing personas are customer, customer-other, agent, agent-other, staff, and administrator."),
        };
}
