using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace D.Ceylon.Modules.IdentityAccess.Security;

public sealed record ExternalIdentityOptions(
    string Authority,
    string Issuer,
    string Audience,
    string RoleClaim,
    string PermissionClaim,
    string OrganisationClaim,
    string CustomerClaim,
    IReadOnlyList<string> RequiredClaims,
    TimeSpan ClockSkew)
{
    public const string SectionName = "Authentication:External";

    public static ExternalIdentityOptions Read(
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var section = configuration.GetSection(SectionName);
        var authority = Required(section, "Authority");
        var issuer = Required(section, "Issuer");
        var audience = Required(section, "Audience");
        var authorityUri = ReadIssuerUri("Authority", authority, environment);
        _ = ReadIssuerUri("Issuer", issuer, environment);
        var clockSkewSeconds = section.GetValue("ClockSkewSeconds", 60);
        if (clockSkewSeconds is < 0 or > 300)
        {
            throw new InvalidOperationException(
                $"{SectionName}:ClockSkewSeconds must be between 0 and 300.");
        }

        var requiredClaims = section.GetSection("RequiredClaims").Get<string[]>()
            ?? ["sub", "jti", "iat"];
        if (requiredClaims.Length is 0
            || requiredClaims.Any(value => string.IsNullOrWhiteSpace(value)))
        {
            throw new InvalidOperationException(
                $"{SectionName}:RequiredClaims must contain non-empty claim names.");
        }

        return new ExternalIdentityOptions(
            authorityUri.ToString().TrimEnd('/'),
            issuer.TrimEnd('/'),
            audience,
            ClaimName(section, "RoleClaim", "roles"),
            ClaimName(section, "PermissionClaim", "permissions"),
            ClaimName(section, "OrganisationClaim", AccessClaimTypes.OrganisationId),
            ClaimName(section, "CustomerClaim", AccessClaimTypes.CustomerId),
            requiredClaims.Distinct(StringComparer.Ordinal).ToArray(),
            TimeSpan.FromSeconds(clockSkewSeconds));
    }

    private static string Required(IConfigurationSection section, string name)
    {
        var value = section[name]?.Trim();
        return string.IsNullOrEmpty(value)
            ? throw new InvalidOperationException($"{SectionName}:{name} is required.")
            : value;
    }

    private static string ClaimName(
        IConfigurationSection section,
        string name,
        string fallback)
    {
        var configured = section[name];
        if (configured is null)
        {
            return fallback;
        }

        var value = configured.Trim();
        return value.Length is > 0 and <= 200
            ? value
            : throw new InvalidOperationException(
                $"{SectionName}:{name} must be a non-empty claim name.");
    }

    private static Uri ReadIssuerUri(
        string name,
        string value,
        IHostEnvironment environment)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps
                && !(environment.IsDevelopment()
                    && uri.Scheme == Uri.UriSchemeHttp
                    && uri.IsLoopback))
            || !string.IsNullOrEmpty(uri.Query)
            || !string.IsNullOrEmpty(uri.Fragment)
            || !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new InvalidOperationException(
                $"{SectionName}:{name} must be an HTTPS origin "
                + "(loopback HTTP is permitted only in Development).");
        }

        return uri;
    }
}

public sealed record TestingAuthenticationOptions(
    string Issuer,
    string Audience,
    string SigningKey,
    string EndpointKey)
{
    public const string SectionName = "Authentication:Testing";

    public static TestingAuthenticationOptions Read(
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        if (!environment.IsEnvironment("Testing"))
        {
            throw new InvalidOperationException(
                "Testing authentication can only be configured in the Testing environment.");
        }

        var section = configuration.GetSection(SectionName);
        var options = new TestingAuthenticationOptions(
            section["Issuer"]?.Trim() ?? string.Empty,
            section["Audience"]?.Trim() ?? string.Empty,
            section["SigningKey"] ?? string.Empty,
            section["EndpointKey"] ?? string.Empty);

        if (options.Issuer != "https://identity.test.dceylon.invalid"
            || options.Audience != "dceylon-api"
            || options.SigningKey.Length < 32
            || options.EndpointKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Testing authentication requires the fixed test issuer/audience "
                + "and signing/endpoint keys of at least 32 characters.");
        }

        return options;
    }
}
