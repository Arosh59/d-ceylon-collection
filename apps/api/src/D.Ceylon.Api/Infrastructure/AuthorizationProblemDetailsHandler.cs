using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;

namespace D.Ceylon.Api.Infrastructure;

internal sealed class AuthorizationProblemDetailsHandler(
    IProblemDetailsService problemDetailsService)
    : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _fallback = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Succeeded)
        {
            await next(context);
            return;
        }

        await _fallback.HandleAsync(next, context, policy, authorizeResult);
        if (context.Response.HasStarted)
        {
            return;
        }

        var forbidden = authorizeResult.Forbidden;
        var status = forbidden
            ? StatusCodes.Status403Forbidden
            : StatusCodes.Status401Unauthorized;
        context.Response.StatusCode = status;
        await problemDetailsService.WriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = new ProblemDetails
                {
                    Status = status,
                    Title = forbidden ? "Forbidden" : "Unauthorized",
                    Detail = forbidden
                        ? "The authenticated identity is not permitted to access this resource."
                        : "A valid bearer access token is required.",
                    Type = forbidden
                        ? "https://www.rfc-editor.org/rfc/rfc9110#name-403-forbidden"
                        : "https://www.rfc-editor.org/rfc/rfc9110#name-401-unauthorized",
                },
            });
    }
}
