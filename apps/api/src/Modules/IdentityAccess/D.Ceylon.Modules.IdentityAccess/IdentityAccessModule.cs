using System.Security.Claims;
using System.Text;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace D.Ceylon.Modules.IdentityAccess;

public static class IdentityAccessModule
{
    public static IServiceCollection AddIdentityAccessModule(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Postgres must be configured.");
        }

        var externalOptions = ExternalIdentityOptions.Read(configuration, environment);
        var testingOptions = environment.IsEnvironment("Testing")
            ? TestingAuthenticationOptions.Read(configuration, environment)
            : null;

        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton(externalOptions);
        if (testingOptions is not null)
        {
            services.AddSingleton(testingOptions);
            services.AddSingleton<ITestingTokenIssuer, TestingTokenIssuer>();
        }

        services.AddDbContext<IdentityAccessDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                postgres =>
                {
                    postgres.MigrationsAssembly(typeof(IdentityAccessDbContext).Assembly.FullName);
                    postgres.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                    postgres.CommandTimeout(30);
                }));
        services.AddScoped<ISecurityAuditWriter, SecurityAuditWriter>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.SaveToken = false;
                options.IncludeErrorDetails = environment.IsDevelopment()
                    || environment.IsEnvironment("Testing");
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = testingOptions?.Issuer ?? externalOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = testingOptions?.Audience ?? externalOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    ClockSkew = externalOptions.ClockSkew,
                    NameClaimType = "name",
                    RoleClaimType = ClaimTypes.Role,
                };

                if (testingOptions is null)
                {
                    options.Authority = externalOptions.Authority;
                    options.RequireHttpsMetadata = !environment.IsDevelopment();
                }
                else
                {
                    options.TokenValidationParameters.IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(testingOptions.SigningKey));
                }

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        var missing = externalOptions.RequiredClaims
                            .Where(claim => !context.Principal!.HasClaim(item => item.Type == claim))
                            .ToArray();
                        if (missing.Length > 0)
                        {
                            context.Fail($"Required token claims are missing: {string.Join(", ", missing)}.");
                        }

                        return Task.CompletedTask;
                    },
                };
            });

        services.AddTransient<IClaimsTransformation, AccessClaimsTransformation>();
        services.AddSingleton<IAuthorizationHandler, CustomerOwnerAuthorizationHandler>();
        services.AddSingleton<IAuthorizationHandler, OrganisationOwnerAuthorizationHandler>();
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(
                new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build())
            .AddPolicy(
                AccessPolicies.Customer,
                policy => policy
                    .RequireRole(AccessRoles.Customer)
                    .RequireClaim(AccessClaimTypes.CustomerId))
            .AddPolicy(
                AccessPolicies.Agent,
                policy => policy
                    .RequireRole(AccessRoles.Agent)
                    .RequireClaim(AccessClaimTypes.OrganisationId))
            .AddPolicy(
                AccessPolicies.Staff,
                policy => policy.RequireRole(AccessRoles.Staff, AccessRoles.Administrator))
            .AddPolicy(
                AccessPolicies.Administrator,
                policy => policy.RequireRole(AccessRoles.Administrator))
            .AddPolicy(
                AccessPolicies.CustomerOwner,
                policy => policy.AddRequirements(new CustomerOwnerRequirement()))
            .AddPolicy(
                AccessPolicies.OrganisationOwner,
                policy => policy.AddRequirements(new OrganisationOwnerRequirement()));

        services
            .AddHealthChecks()
            .AddDbContextCheck<IdentityAccessDbContext>(
                "identity-access-database",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        return services;
    }
}
