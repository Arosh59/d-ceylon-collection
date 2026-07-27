using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace D.Ceylon.Api.Infrastructure;

internal static class HealthResponseWriter
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web);

    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(report);

        context.Response.ContentType = "application/json";
        return JsonSerializer.SerializeAsync(
            context.Response.Body,
            new
            {
                status = report.Status.ToString().ToLowerInvariant(),
                durationMilliseconds = report.TotalDuration.TotalMilliseconds,
                checks = report.Entries
                    .OrderBy(entry => entry.Key, StringComparer.Ordinal)
                    .Select(entry => new
                    {
                        name = entry.Key,
                        status = entry.Value.Status.ToString().ToLowerInvariant(),
                        durationMilliseconds = entry.Value.Duration.TotalMilliseconds,
                    }),
            },
            SerializerOptions);
    }
}
