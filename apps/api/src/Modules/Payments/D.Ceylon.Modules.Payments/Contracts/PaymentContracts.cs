using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;
using Microsoft.Extensions.Configuration;

namespace D.Ceylon.Modules.Payments.Contracts;

// ─── Exceptions ──────────────────────────────────────────────────────────────

public sealed class PaymentTransitionException(string message) : Exception(message);

public sealed class PaymentConflictException(string message) : Exception(message);

public sealed class PaymentNotFoundException(string message) : Exception(message);

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed record PaymentTransactionResponse(
    Guid Id,
    string Gateway,
    string GatewayReference,
    string EventType,
    decimal Amount,
    string Currency,
    DateTimeOffset OccurredAtUtc,
    bool WebhookSignatureVerified);

public sealed record RefundResponse(
    Guid Id,
    decimal Amount,
    string Currency,
    string? Reason,
    string Status,
    DateTimeOffset CreatedAtUtc);

public sealed record PaymentSummaryResponse(
    Guid Id,
    Guid BookingId,
    string Kind,
    string Gateway,
    string Status,
    string Currency,
    decimal Amount,
    string ReconciliationStatus,
    DateTimeOffset? CapturedAtUtc,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record PaymentResponse(
    Guid Id,
    Guid BookingId,
    Guid CustomerId,
    string Kind,
    string Gateway,
    string Status,
    string Currency,
    decimal Amount,
    string ReconciliationStatus,
    bool HasPaymentLink,
    DateTimeOffset? PaymentLinkExpiresAtUtc,
    DateTimeOffset? CapturedAtUtc,
    string? FailedReason,
    IReadOnlyList<PaymentTransactionResponse> Transactions,
    IReadOnlyList<RefundResponse> Refunds,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

// ─── Requests ────────────────────────────────────────────────────────────────

public sealed record CreatePaymentRequest : IValidatableObject
{
    [Required, StringLength(30)]
    public string Kind { get; init; } = string.Empty;

    [Required, StringLength(30)]
    public string Gateway { get; init; } = string.Empty;

    /// <summary>
    /// Client-provided idempotency key. Must be unique per payment attempt.
    /// Never include card details, tokens, or credentials.
    /// </summary>
    [Required, StringLength(64)]
    public string IdempotencyKey { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IdempotencyKey.Length is < 16 or > 64
            || IdempotencyKey.Any(char.IsWhiteSpace))
        {
            yield return new ValidationResult(
                "The idempotency key must be 16 to 64 non-whitespace characters.",
                [nameof(IdempotencyKey)]);
        }
    }
}

public sealed record WebhookPaymentEventRequest
{
    [Required, StringLength(30)]
    public string Gateway { get; init; } = string.Empty;

    [Required, StringLength(200)]
    public string GatewayReference { get; init; } = string.Empty;

    [Required, StringLength(50)]
    public string EventType { get; init; } = string.Empty;

    [Required]
    public Guid PaymentId { get; init; }

    public decimal Amount { get; init; }

    [Required, StringLength(3)]
    public string Currency { get; init; } = string.Empty;

    public DateTimeOffset OccurredAtUtc { get; init; }
}

// ─── Gateway abstraction ─────────────────────────────────────────────────────

/// <summary>
/// Payment gateway abstraction. Implementations must never store or log card
/// numbers, CVV values, or raw payment credentials.
/// </summary>
public interface IPaymentGateway
{
    string GatewayName { get; }

    /// <summary>Creates a payment link. Returns the expiring URL. Never store without encryption.</summary>
    Task<string> CreatePaymentLinkAsync(
        Guid paymentId,
        string idempotencyKey,
        decimal amount,
        string currency,
        string bookingReference,
        CancellationToken cancellationToken);

    /// <summary>Validates the HMAC signature of an inbound webhook payload.</summary>
    bool ValidateWebhookSignature(
        ReadOnlySpan<byte> payload,
        string signature,
        string webhookSecret);
}

/// <summary>
/// Stripe gateway placeholder. Replace with real Stripe SDK integration in Phase 15.
/// </summary>
public sealed class StripePaymentGateway : IPaymentGateway
{
    public string GatewayName => "stripe";

    public Task<string> CreatePaymentLinkAsync(
        Guid paymentId,
        string idempotencyKey,
        decimal amount,
        string currency,
        string bookingReference,
        CancellationToken cancellationToken)
    {
        // Placeholder: real implementation would call Stripe API using the official Stripe .NET SDK.
        // The idempotency key prevents duplicate charges on retry.
        // Payment links expire and must never be stored as permanent public URLs.
        return Task.FromResult($"https://checkout.stripe.com/pay/placeholder_{paymentId:N}");
    }

    public bool ValidateWebhookSignature(
        ReadOnlySpan<byte> payload,
        string signature,
        string webhookSecret)
    {
        // Placeholder: real implementation uses Stripe's Stripe-Signature HMAC-SHA256 verification.
        // Never bypass signature validation in production.
        return false;
    }
}

/// <summary>
/// Local payment provider placeholder. Implement using the provider's SDK in Phase 15.
/// </summary>
public sealed class LocalPaymentGateway : IPaymentGateway
{
    public string GatewayName => "local";

    public Task<string> CreatePaymentLinkAsync(
        Guid paymentId,
        string idempotencyKey,
        decimal amount,
        string currency,
        string bookingReference,
        CancellationToken cancellationToken)
    {
        // Placeholder for local Sri Lankan payment provider integration.
        return Task.FromResult($"https://pay.local.placeholder/checkout/{paymentId:N}");
    }

    public bool ValidateWebhookSignature(
        ReadOnlySpan<byte> payload,
        string signature,
        string webhookSecret)
    {
        // Placeholder: implement with provider-specific HMAC verification.
        return false;
    }
}

// ─── Service contract ─────────────────────────────────────────────────────────

public interface IPaymentRecords
{
    Task<PagedResponse<PaymentSummaryResponse>> GetCustomerPaymentsAsync(
        Guid customerId,
        Guid bookingId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<PaymentResponse?> GetCustomerPaymentAsync(
        Guid customerId,
        Guid paymentId,
        CancellationToken cancellationToken);

    Task<PaymentResponse> CreatePaymentAsync(
        Guid customerId,
        Guid bookingId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken);
}

// ─── Webhook signature service ────────────────────────────────────────────────

/// <summary>
/// Validates inbound payment webhook signatures using HMAC-SHA256.
/// Never log payload contents that may include card data from the gateway.
/// </summary>
public interface IWebhookSignatureValidator
{
    bool Validate(string gateway, ReadOnlySpan<byte> payload, string signature);
}

public sealed class WebhookSignatureValidator(
    IEnumerable<IPaymentGateway> gateways,
    IConfiguration configuration) : IWebhookSignatureValidator
{
    private readonly Dictionary<string, IPaymentGateway> _gateways =
        gateways.ToDictionary(g => g.GatewayName, StringComparer.OrdinalIgnoreCase);

    public bool Validate(string gateway, ReadOnlySpan<byte> payload, string signature)
    {
        if (!_gateways.TryGetValue(gateway, out var gw)) return false;
        var secret = configuration[$"Payments:Webhooks:{gateway}:Secret"];
        if (string.IsNullOrWhiteSpace(secret)) return false;
        return gw.ValidateWebhookSignature(payload, signature, secret);
    }
}
