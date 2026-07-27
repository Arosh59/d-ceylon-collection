using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Api.Infrastructure;

internal sealed partial class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetailsService)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);

        var isConcurrencyConflict = exception is DbUpdateConcurrencyException;
        var statusCode = isConcurrencyConflict
            ? StatusCodes.Status409Conflict
            : StatusCodes.Status500InternalServerError;

        if (isConcurrencyConflict)
        {
            LogConcurrencyConflict(logger, exception, httpContext.Request.Path);
        }
        else
        {
            LogUnhandledException(logger, exception, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = isConcurrencyConflict
                ? "The record was changed by another request"
                : "An unexpected error occurred",
            Detail = isConcurrencyConflict
                ? "Reload the latest record and retry the operation."
                : "The request could not be completed.",
            Type = isConcurrencyConflict
                ? "https://www.rfc-editor.org/rfc/rfc9110#name-409-conflict"
                : "https://www.rfc-editor.org/rfc/rfc9110#name-500-internal-server-error",
        };

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problem,
            });
    }

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Warning,
        Message = "A database concurrency conflict occurred for {RequestPath}")]
    private static partial void LogConcurrencyConflict(
        ILogger logger,
        Exception exception,
        string requestPath);

    [LoggerMessage(
        EventId = 1002,
        Level = LogLevel.Error,
        Message = "An unhandled exception occurred for {RequestPath}")]
    private static partial void LogUnhandledException(
        ILogger logger,
        Exception exception,
        string requestPath);
}
