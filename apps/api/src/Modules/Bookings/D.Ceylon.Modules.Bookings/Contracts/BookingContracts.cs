using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.Bookings.Contracts;

// ─── Exceptions ──────────────────────────────────────────────────────────────

public sealed class BookingTransitionException(string message) : Exception(message);

public sealed class BookingNotFoundException(string message) : Exception(message);

public sealed class BookingConflictException(string message) : Exception(message);

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed record BookingItemResponse(
    Guid Id,
    int Position,
    string Title,
    string? Description,
    decimal Quantity,
    decimal UnitAmount,
    decimal LineTotal,
    string Currency);

public sealed record InvoiceResponse(
    Guid Id,
    string InvoiceNumber,
    string Status,
    string Currency,
    decimal Subtotal,
    decimal TaxTotal,
    decimal AdjustmentTotal,
    decimal GrandTotal,
    DateTimeOffset? IssuedAtUtc,
    DateTimeOffset? DueAtUtc,
    DateTimeOffset? PaidAtUtc,
    bool HasDocument,
    DateTimeOffset CreatedAtUtc);

public sealed record VoucherResponse(
    Guid Id,
    string VoucherCode,
    string Title,
    string? Description,
    DateOnly ValidFrom,
    DateOnly ValidUntil,
    string Status,
    DateTimeOffset? RedeemedAtUtc,
    DateTimeOffset IssuedAtUtc,
    bool HasDocument,
    Guid ConcurrencyToken);

public sealed record BookingSummaryResponse(
    Guid Id,
    string BookingReference,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Status,
    string Currency,
    decimal TotalAmount,
    decimal PaidAmount,
    DateTimeOffset? ConfirmedAtUtc,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record BookingResponse(
    Guid Id,
    string BookingReference,
    Guid QuoteId,
    Guid QuoteVersionId,
    Guid CustomerId,
    Guid? OrganisationId,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Status,
    string Currency,
    decimal TotalAmount,
    decimal PaidAmount,
    string? CustomerNotes,
    DateTimeOffset? ConfirmedAtUtc,
    DateTimeOffset? CancelledAtUtc,
    string? CancellationReason,
    IReadOnlyList<BookingItemResponse> Items,
    IReadOnlyList<InvoiceResponse> Invoices,
    IReadOnlyList<VoucherResponse> Vouchers,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

/// <summary>
/// Stable, payment-safe booking information. This is deliberately a contract rather than a
/// cross-module persistence-entity dependency.
/// </summary>
public sealed record BookingPaymentSource(
    Guid BookingId,
    Guid CustomerId,
    string BookingReference,
    string Currency,
    decimal TotalAmount,
    decimal PaidAmount,
    string Status);

public sealed record BookingOperationsSource(Guid BookingId, string Status);

// ─── Requests ────────────────────────────────────────────────────────────────

public sealed record CreateBookingRequest : IValidatableObject
{
    public Guid QuoteId { get; init; }

    public Guid QuoteVersionId { get; init; }

    [StringLength(2000)]
    public string? CustomerNotes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (QuoteId == Guid.Empty)
            yield return new ValidationResult("An accepted quote is required.", [nameof(QuoteId)]);
        if (QuoteVersionId == Guid.Empty)
            yield return new ValidationResult("An accepted quote version is required.", [nameof(QuoteVersionId)]);
    }
}

public sealed record BookingConcurrencyRequest : IValidatableObject
{
    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
            yield return new ValidationResult("A concurrency token is required.", [nameof(ConcurrencyToken)]);
    }
}

public sealed record CancelBookingRequest : IValidatableObject
{
    [StringLength(500)]
    public string? Reason { get; init; }

    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
            yield return new ValidationResult("A concurrency token is required.", [nameof(ConcurrencyToken)]);
    }
}

// ─── Service contract ─────────────────────────────────────────────────────────

public interface IBookingRecords
{
    Task<PagedResponse<BookingSummaryResponse>> GetCustomerBookingsAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<BookingResponse?> GetCustomerBookingAsync(
        Guid customerId,
        Guid bookingId,
        CancellationToken cancellationToken);

    Task<BookingResponse> CreateFromAcceptedQuoteAsync(
        Guid customerId,
        CreateBookingRequest request,
        CancellationToken cancellationToken);

    Task<BookingResponse?> RequestCancellationAsync(
        Guid customerId,
        Guid bookingId,
        CancelBookingRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<BookingSummaryResponse>> GetAgentBookingsAsync(
        Guid organisationId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<BookingResponse?> GetAgentBookingAsync(
        Guid organisationId,
        Guid bookingId,
        CancellationToken cancellationToken);

    Task<VoucherResponse?> GetCustomerVoucherAsync(
        Guid customerId,
        Guid bookingId,
        Guid voucherId,
        CancellationToken cancellationToken);
}

public interface IBookingPaymentSources
{
    Task<BookingPaymentSource?> GetCustomerPaymentSourceAsync(
        Guid customerId,
        Guid bookingId,
        CancellationToken cancellationToken);
}

public interface IBookingOperationsSources
{
    Task<BookingOperationsSource?> GetOperationsSourceAsync(Guid bookingId, CancellationToken cancellationToken);
}

// ─── PDF abstraction ──────────────────────────────────────────────────────────

public interface IPdfGenerator
{
    /// <summary>
    /// Generates an invoice PDF. Returns a storage key for the generated document.
    /// The key is an opaque reference for private object storage; never a public URL.
    /// </summary>
    Task<string> GenerateInvoicePdfAsync(
        InvoiceResponse invoice,
        BookingResponse booking,
        CancellationToken cancellationToken);

    /// <summary>
    /// Generates a voucher PDF. Returns a storage key.
    /// </summary>
    Task<string> GenerateVoucherPdfAsync(
        VoucherResponse voucher,
        BookingResponse booking,
        CancellationToken cancellationToken);
}

/// <summary>
/// Placeholder PDF generator. Replace with a real implementation in a later phase.
/// </summary>
public sealed class PlaceholderPdfGenerator : IPdfGenerator
{
    public Task<string> GenerateInvoicePdfAsync(
        InvoiceResponse invoice,
        BookingResponse booking,
        CancellationToken cancellationToken) =>
        Task.FromResult($"invoices/placeholder/{invoice.Id}.pdf");

    public Task<string> GenerateVoucherPdfAsync(
        VoucherResponse voucher,
        BookingResponse booking,
        CancellationToken cancellationToken) =>
        Task.FromResult($"vouchers/placeholder/{voucher.Id}.pdf");
}
