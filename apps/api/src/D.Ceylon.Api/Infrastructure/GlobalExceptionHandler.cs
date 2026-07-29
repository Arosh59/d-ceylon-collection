using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.Editorial.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using D.Ceylon.Modules.Payments.Contracts;
using D.Ceylon.Modules.Pricing;
using D.Ceylon.Modules.Quotes.Contracts;
using D.Ceylon.Modules.SupplierOperations.Contracts;

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
        var isRecordConflict = exception is CustomerRecordConflictException
            or TravelPlanConflictException
            or QuoteConflictException
            or QuoteTransitionException
            or BookingConflictException
            or BookingTransitionException
            or PaymentConflictException
            or PaymentTransitionException
            or SupplierOperationsConflictException;
        var isMissingReference = exception is TravelPlanReferenceException
            or QuoteReferenceException
            or BookingNotFoundException
            or PaymentNotFoundException
            or SupplierOperationsNotFoundException;
        var isPricingValidation = exception is PricingValidationException;
        var isDependencyUnavailable = exception is EditorialUnavailableException;
        var statusCode = isConcurrencyConflict || isRecordConflict
            ? StatusCodes.Status409Conflict
            : isMissingReference
                ? StatusCodes.Status404NotFound
                : isPricingValidation
                    ? StatusCodes.Status400BadRequest
                    : isDependencyUnavailable
                        ? StatusCodes.Status503ServiceUnavailable
                        : StatusCodes.Status500InternalServerError;

        if (isConcurrencyConflict
            || isRecordConflict
            || isMissingReference
            || isPricingValidation
            || isDependencyUnavailable)
        {
            LogRecordConflict(logger, exception, httpContext.Request.Path);
        }
        else
        {
            LogUnhandledException(logger, exception, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = isConcurrencyConflict || isRecordConflict
                ? isConcurrencyConflict
                    ? "The record was changed by another request"
                    : "The request conflicts with an existing record"
                : isMissingReference
                    ? "Referenced record not found"
                    : isPricingValidation
                        ? "The pricing input is invalid"
                        : isDependencyUnavailable
                            ? "Editorial content is temporarily unavailable"
                            : "An unexpected error occurred",
            Detail = isConcurrencyConflict || isRecordConflict
                ? isConcurrencyConflict
                    ? "Reload the latest record and retry the operation."
                    : exception.Message
                : isMissingReference || isPricingValidation
                    ? exception.Message
                    : isDependencyUnavailable
                        ? exception.Message
                        : "The request could not be completed.",
            Type = isConcurrencyConflict || isRecordConflict
                ? "https://www.rfc-editor.org/rfc/rfc9110#name-409-conflict"
                : isMissingReference
                    ? "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found"
                : isPricingValidation
                    ? "https://www.rfc-editor.org/rfc/rfc9110#name-400-bad-request"
                    : isDependencyUnavailable
                        ? "https://www.rfc-editor.org/rfc/rfc9110#name-503-service-unavailable"
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
        Message = "A record conflict occurred for {RequestPath}")]
    private static partial void LogRecordConflict(
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
