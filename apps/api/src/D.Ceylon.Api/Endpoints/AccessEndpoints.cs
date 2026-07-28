using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class AccessEndpoints
{
    public static RouteGroupBuilder MapAccessEndpoints(
        this RouteGroupBuilder versionGroup,
        IWebHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(versionGroup);

        var access = versionGroup.MapGroup("/access").WithTags("Identity and Access");
        access.MapGet("/me", GetCurrentAccess)
            .WithName("GetCurrentAccessV1")
            .Produces<CurrentAccessResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);
        access.MapGet("/customer/{customerId:guid}", GetCustomerPortalAsync)
            .WithName("GetCustomerPortalV1")
            .RequireAuthorization(AccessPolicies.Customer)
            .Produces<PortalAccessResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
        access.MapGet("/agent/{organisationId:guid}", GetAgentPortalAsync)
            .WithName("GetAgentPortalV1")
            .RequireAuthorization(AccessPolicies.Agent)
            .Produces<PortalAccessResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
        access.MapGet("/staff", () => TypedResults.Ok(new PortalAccessResponse("staff", "authorised")))
            .WithName("GetStaffPortalV1")
            .RequireAuthorization(AccessPolicies.Staff)
            .Produces<PortalAccessResponse>();
        access.MapGet(
                "/administrator",
                () => TypedResults.Ok(new PortalAccessResponse("administrator", "authorised")))
            .WithName("GetAdministratorPortalV1")
            .RequireAuthorization(AccessPolicies.Administrator)
            .Produces<PortalAccessResponse>();

        if (environment.IsEnvironment("Testing"))
        {
            access.MapPost("/testing/token", IssueTestingTokenAsync)
                .WithName("IssueTestingTokenV1")
                .AllowAnonymous()
                .RequireRateLimiting(RateLimitPolicyNames.Authentication)
                .ExcludeFromDescription();
        }

        return versionGroup;
    }

    private static CurrentAccessResponse GetCurrentAccess(ClaimsPrincipal user) =>
        new(
            RequiredClaim(user, AccessClaimTypes.Subject),
            user.FindFirstValue("name") ?? "Authenticated user",
            user.FindFirstValue("email"),
            user.FindAll(ClaimTypes.Role).Select(claim => claim.Value).Distinct().Order().ToArray(),
            user.FindAll(AccessClaimTypes.Permission).Select(claim => claim.Value).Distinct().Order().ToArray(),
            ReadGuid(user, AccessClaimTypes.CustomerId),
            ReadGuid(user, AccessClaimTypes.OrganisationId));

    private static async Task<IResult> GetCustomerPortalAsync(
        Guid customerId,
        ClaimsPrincipal user,
        IAuthorizationService authorization)
    {
        var result = await authorization.AuthorizeAsync(
            user,
            new CustomerResource(customerId),
            AccessPolicies.CustomerOwner);
        return result.Succeeded
            ? TypedResults.Ok(new PortalAccessResponse("customer", "authorised"))
            : Forbidden();
    }

    private static async Task<IResult> GetAgentPortalAsync(
        Guid organisationId,
        ClaimsPrincipal user,
        IAuthorizationService authorization)
    {
        var result = await authorization.AuthorizeAsync(
            user,
            new OrganisationResource(organisationId),
            AccessPolicies.OrganisationOwner);
        return result.Succeeded
            ? TypedResults.Ok(new PortalAccessResponse("agent", "authorised"))
            : Forbidden();
    }

    private static async Task<IResult> IssueTestingTokenAsync(
        TestingTokenRequest request,
        HttpContext context,
        TestingAuthenticationOptions options,
        ITestingTokenIssuer issuer,
        ISecurityAuditWriter auditWriter,
        CancellationToken cancellationToken)
    {
        var suppliedKey = context.Request.Headers["X-Test-Authentication-Key"].ToString();
        if (!FixedTimeEquals(suppliedKey, options.EndpointKey))
        {
            await auditWriter.RecordAsync(
                "testing-token",
                "denied",
                null,
                context.GetCorrelationId(),
                cancellationToken);
            return TypedResults.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "A valid testing authentication key is required.",
                type: "https://www.rfc-editor.org/rfc/rfc9110#name-401-unauthorized");
        }

        TestingToken token;
        try
        {
            if (string.IsNullOrWhiteSpace(request.Persona))
            {
                throw new ArgumentOutOfRangeException(nameof(request));
            }

            token = issuer.Issue(request.Persona);
        }
        catch (ArgumentOutOfRangeException)
        {
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["persona"] = ["Use customer, agent, staff, or administrator."],
                });
        }

        await auditWriter.RecordAsync(
            "testing-token",
            "issued",
            token.Identity.Subject,
            context.GetCorrelationId(),
            cancellationToken);
        return TypedResults.Ok(token);
    }

    private static string RequiredClaim(ClaimsPrincipal user, string claimType) =>
        user.FindFirstValue(claimType)
        ?? throw new InvalidOperationException($"The validated identity omitted {claimType}.");

    private static Guid? ReadGuid(ClaimsPrincipal user, string claimType) =>
        Guid.TryParse(user.FindFirstValue(claimType), out var value) ? value : null;

    private static bool FixedTimeEquals(string supplied, string expected)
    {
        var suppliedBytes = Encoding.UTF8.GetBytes(supplied);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        return suppliedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(suppliedBytes, expectedBytes);
    }

    private static ProblemHttpResult Forbidden() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status403Forbidden,
            title: "Forbidden",
            detail: "The authenticated identity does not own this resource.",
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-403-forbidden");
}

internal sealed record TestingTokenRequest(string Persona);

public sealed record CurrentAccessResponse(
    string Subject,
    string DisplayName,
    string? Email,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    Guid? CustomerId,
    Guid? OrganisationId);

public sealed record PortalAccessResponse(string Portal, string Access);
