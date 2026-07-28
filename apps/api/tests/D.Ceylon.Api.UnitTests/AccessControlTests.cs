using System.Security.Claims;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class AccessControlTests
{
    [Fact]
    public async Task ClaimsTransformationNormalisesProviderClaims()
    {
        var options = ValidOptions();
        var identity = new ClaimsIdentity(
            [
                new Claim("roles", AccessRoles.Agent),
                new Claim("permissions", "catalogue:read"),
                new Claim("org", "20000000-0000-0000-0000-000000000001"),
            ],
            "test");
        var principal = new ClaimsPrincipal(identity);

        await new AccessClaimsTransformation(options).TransformAsync(principal);

        Assert.True(principal.IsInRole(AccessRoles.Agent));
        Assert.True(principal.HasClaim(AccessClaimTypes.Permission, "catalogue:read"));
        Assert.True(
            principal.HasClaim(
                AccessClaimTypes.OrganisationId,
                "20000000-0000-0000-0000-000000000001"));
    }

    [Fact]
    public async Task CustomerOwnershipRejectsAnotherCustomer()
    {
        var customerId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Role, AccessRoles.Customer),
                new Claim(AccessClaimTypes.CustomerId, customerId.ToString()),
            ],
            "test");
        var requirement = new CustomerOwnerRequirement();
        var context = new AuthorizationHandlerContext(
            [requirement],
            new ClaimsPrincipal(identity),
            new CustomerResource(Guid.NewGuid()));

        await new CustomerOwnerAuthorizationHandler().HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task AgentOwnershipAllowsOnlyTheClaimedOrganisation()
    {
        var organisationId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Role, AccessRoles.Agent),
                new Claim(AccessClaimTypes.OrganisationId, organisationId.ToString()),
            ],
            "test");
        var requirement = new OrganisationOwnerRequirement();
        var context = new AuthorizationHandlerContext(
            [requirement],
            new ClaimsPrincipal(identity),
            new OrganisationResource(organisationId));

        await new OrganisationOwnerAuthorizationHandler().HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public void ExternalIdentityConfigurationRejectsInsecureProductionIssuer()
    {
        var configuration = Configuration(
            new Dictionary<string, string?>
            {
                ["Authentication:External:Authority"] = "http://identity.example.test",
                ["Authentication:External:Issuer"] = "http://identity.example.test",
                ["Authentication:External:Audience"] = "dceylon-api",
            });

        Assert.Throws<InvalidOperationException>(
            () => ExternalIdentityOptions.Read(
                configuration,
                new TestHostEnvironment(Environments.Production)));
    }

    [Fact]
    public void TestingAuthenticationCannotBeEnabledInProduction()
    {
        Assert.Throws<InvalidOperationException>(
            () => TestingAuthenticationOptions.Read(
                new ConfigurationBuilder().Build(),
                new TestHostEnvironment(Environments.Production)));
    }

    private static ExternalIdentityOptions ValidOptions() =>
        new(
            "https://identity.example.test",
            "https://identity.example.test",
            "dceylon-api",
            "roles",
            "permissions",
            "org",
            "customer",
            ["sub", "jti", "iat"],
            TimeSpan.FromMinutes(1));

    private static IConfiguration Configuration(
        IDictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "D.Ceylon.Tests";

        public string ContentRootPath { get; set; } = "/";

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
