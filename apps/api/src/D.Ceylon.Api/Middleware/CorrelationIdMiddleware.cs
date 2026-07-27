using System.Diagnostics;
using Microsoft.Extensions.Primitives;

namespace D.Ceylon.Api.Middleware;

internal sealed class CorrelationIdMiddleware(
    RequestDelegate next,
    ILogger<CorrelationIdMiddleware> logger)
{
    public const string HeaderName = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var correlationId = ResolveCorrelationId(context.Request.Headers);
        context.Items[HeaderName] = correlationId;
        context.Response.OnStarting(
            static state =>
            {
                var values = (CorrelationResponseState)state;
                values.Context.Response.Headers[HeaderName] = values.CorrelationId;
                return Task.CompletedTask;
            },
            new CorrelationResponseState(context, correlationId));

        using var scope = logger.BeginScope(
            new Dictionary<string, object>
            {
                ["CorrelationId"] = correlationId,
            });

        await next(context);
    }

    private static string ResolveCorrelationId(IHeaderDictionary headers)
    {
        if (headers.TryGetValue(HeaderName, out StringValues values)
            && values.Count == 1
            && IsValid(values[0]))
        {
            return values[0]!;
        }

        return Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");
    }

    private static bool IsValid(string? value) =>
        value is { Length: > 0 and <= 64 }
        && value.All(character =>
            char.IsAsciiLetterOrDigit(character)
            || character is '-' or '_' or '.');

    private sealed record CorrelationResponseState(
        HttpContext Context,
        string CorrelationId);
}

internal static class CorrelationIdHttpContextExtensions
{
    public static string GetCorrelationId(this HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        return context.Items.TryGetValue(CorrelationIdMiddleware.HeaderName, out var value)
            ? value?.ToString() ?? context.TraceIdentifier
            : context.TraceIdentifier;
    }
}
