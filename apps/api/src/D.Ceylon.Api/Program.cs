using System.Globalization;
using System.Net;
using System.Threading.RateLimiting;
using D.Ceylon.Api.Endpoints;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.Modules.Catalogue;
using D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Seeding;
using D.Ceylon.Modules.IdentityAccess;
using D.Ceylon.Modules.OrganisationsAgents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
    options.JsonWriterOptions = new System.Text.Json.JsonWriterOptions
    {
        Indented = false,
    };
});

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance = context.HttpContext.Request.Path;
        context.ProblemDetails.Extensions["correlationId"] =
            context.HttpContext.GetCorrelationId();
    };
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi("v1");
builder.Services.AddCatalogueModule(builder.Configuration);
builder.Services.AddIdentityAccessModule(builder.Configuration, builder.Environment);
builder.Services.AddOrganisationsAgentsModule(builder.Configuration);
builder.Services.AddSingleton<
    IAuthorizationMiddlewareResultHandler,
    AuthorizationProblemDetailsHandler>();
builder.Services
    .AddHealthChecks()
    .AddCheck(
        "self",
        () => HealthCheckResult.Healthy(),
        tags: ["live"]);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(
        RateLimitPolicyNames.Authentication,
        httpContext =>
        {
            var partitionKey =
                httpContext.Connection.RemoteIpAddress?.ToString()
                ?? IPAddress.None.ToString();

            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = 10,
                    QueueLimit = 0,
                    Window = TimeSpan.FromMinutes(1),
                });
        });
    options.AddPolicy(
        RateLimitPolicyNames.Public,
        httpContext =>
        {
            var partitionKey =
                httpContext.Connection.RemoteIpAddress?.ToString()
                ?? IPAddress.None.ToString();

            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = 120,
                    QueueLimit = 0,
                    Window = TimeSpan.FromMinutes(1),
                });
        });
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(
                MetadataName.RetryAfter,
                out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Ceiling(retryAfter.TotalSeconds)
                    .ToString(CultureInfo.InvariantCulture);
        }

        var problemDetailsService =
            context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>();
        await problemDetailsService.WriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = context.HttpContext,
                ProblemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too many requests",
                    Detail = "The request rate limit was exceeded. Try again later.",
                    Type = "https://www.rfc-editor.org/rfc/rfc9110#name-429-too-many-requests",
                },
            });
    };
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

if (args.Contains("--seed-catalogue", StringComparer.Ordinal))
{
    if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
    {
        throw new InvalidOperationException(
            "Catalogue development seed data may only be applied in Development or Testing.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var seeder = scope.ServiceProvider.GetRequiredService<CatalogueDevelopmentSeeder>();
    var result = await seeder.SeedAsync(CancellationToken.None);
    CatalogueSeedLogging.Completed(
        app.Logger,
        result.Changed,
        result.CollectionCount,
        result.DestinationCount,
        result.ProductCount);
    return;
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseExceptionHandler();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi("/openapi/{documentName}.json").AllowAnonymous();
app.MapGet(
        "/",
        () => TypedResults.Ok(
            new
            {
                service = "D Ceylon Collection API",
                version = "v1",
            }))
    .ExcludeFromDescription()
    .AllowAnonymous();

app.MapHealthChecks(
    "/health/live",
    new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = registration => registration.Tags.Contains("live"),
        ResponseWriter = HealthResponseWriter.WriteAsync,
    })
    .AllowAnonymous();
app.MapHealthChecks(
    "/health/ready",
    new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = registration => registration.Tags.Contains("ready"),
        ResponseWriter = HealthResponseWriter.WriteAsync,
    })
    .AllowAnonymous();

var versionOne = app.MapGroup("/api/v1");
versionOne.MapCatalogueEndpoints();
versionOne.MapAccessEndpoints(app.Environment);

app.Run();

public partial class Program;
