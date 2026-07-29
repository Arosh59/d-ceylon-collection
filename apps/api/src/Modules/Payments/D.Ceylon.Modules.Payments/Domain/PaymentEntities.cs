using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Payments.Contracts;

namespace D.Ceylon.Modules.Payments.Domain;

public static class PaymentStatuses
{
    public const string Pending = "pending";
    public const string Authorised = "authorised";
    public const string Captured = "captured";
    public const string Failed = "failed";
    public const string Refunded = "refunded";
    public const string Cancelled = "cancelled";
}

public static class PaymentKinds
{
    public const string Deposit = "deposit";
    public const string Balance = "balance";
    public const string ManualTransfer = "manual-transfer";
    public const string PaymentLink = "payment-link";
}

public static class PaymentGateways
{
    public const string Stripe = "stripe";
    public const string Local = "local";
    public const string Manual = "manual";
}

public static class ReconciliationStatuses
{
    public const string Unreconciled = "unreconciled";
    public const string Reconciled = "reconciled";
    public const string Disputed = "disputed";
}

public static class RefundStatuses
{
    public const string Pending = "pending";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
}

/// <summary>
/// Records a payment intent or captured transaction.
/// Card numbers, CVV values, and raw credentials are never stored here.
/// </summary>
public sealed class Payment : AuditableEntity
{
    private Payment()
    {
    }

    public Payment(
        Guid id,
        Guid bookingId,
        Guid customerId,
        string idempotencyKey,
        string kind,
        string gateway,
        string currency,
        decimal amount)
        : base(id)
    {
        BookingId = PaymentGuard.Id(bookingId, nameof(bookingId));
        CustomerId = PaymentGuard.Id(customerId, nameof(customerId));
        IdempotencyKey = PaymentGuard.Required(idempotencyKey, 64, nameof(idempotencyKey));
        Kind = PaymentGuard.Required(kind, 30, nameof(kind));
        Gateway = PaymentGuard.Required(gateway, 30, nameof(gateway));
        Currency = PaymentGuard.Required(currency, 3, nameof(currency));
        Amount = amount > 0
            ? amount
            : throw new ArgumentOutOfRangeException(nameof(amount), "Payment amount must be positive.");
        Status = PaymentStatuses.Pending;
        ReconciliationStatus = ReconciliationStatuses.Unreconciled;
    }

    public Guid BookingId { get; private set; }
    public Guid CustomerId { get; private set; }

    /// <summary>Idempotency key prevents duplicate charge on retry. Never expose externally.</summary>
    public string IdempotencyKey { get; private set; } = string.Empty;

    public string Kind { get; private set; } = string.Empty;
    public string Gateway { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public string Currency { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string ReconciliationStatus { get; private set; } = string.Empty;

    /// <summary>Payment link URL. Never log this value.</summary>
    public string? PaymentLinkUrl { get; private set; }

    public DateTimeOffset? PaymentLinkExpiresAtUtc { get; private set; }
    public DateTimeOffset? CapturedAtUtc { get; private set; }
    public string? FailedReason { get; private set; }
    public ICollection<PaymentTransaction> Transactions { get; } = [];
    public ICollection<Refund> Refunds { get; } = [];

    public void AttachPaymentLink(string url, DateTimeOffset expiresAtUtc)
    {
        PaymentLinkUrl = PaymentGuard.Required(url, 500, nameof(url));
        PaymentLinkExpiresAtUtc = expiresAtUtc;
    }

    public PaymentTransaction Authorise(
        string gatewayReference,
        string eventType,
        DateTimeOffset occurredAtUtc,
        bool signatureVerified)
    {
        if (Status is PaymentStatuses.Cancelled or PaymentStatuses.Refunded)
            throw new PaymentTransitionException($"Cannot authorise a {Status} payment.");

        Status = PaymentStatuses.Authorised;
        return AddTransaction(gatewayReference, eventType, Amount, Currency, occurredAtUtc, signatureVerified);
    }

    public PaymentTransaction Capture(
        string gatewayReference,
        string eventType,
        DateTimeOffset occurredAtUtc,
        bool signatureVerified)
    {
        if (Status is not (PaymentStatuses.Pending or PaymentStatuses.Authorised))
            throw new PaymentTransitionException($"Cannot capture a {Status} payment.");

        Status = PaymentStatuses.Captured;
        CapturedAtUtc = occurredAtUtc;
        return AddTransaction(gatewayReference, eventType, Amount, Currency, occurredAtUtc, signatureVerified);
    }

    public PaymentTransaction RecordFailure(
        string gatewayReference,
        string reason,
        DateTimeOffset occurredAtUtc,
        bool signatureVerified)
    {
        Status = PaymentStatuses.Failed;
        FailedReason = PaymentGuard.Optional(reason, 500, nameof(reason));
        return AddTransaction(gatewayReference, "failed", Amount, Currency, occurredAtUtc, signatureVerified);
    }

    public void Cancel()
    {
        if (Status is PaymentStatuses.Captured or PaymentStatuses.Refunded)
            throw new PaymentTransitionException($"A {Status} payment cannot be cancelled.");
        Status = PaymentStatuses.Cancelled;
    }

    public void Reconcile()
    {
        ReconciliationStatus = ReconciliationStatuses.Reconciled;
    }

    public void MarkDisputed()
    {
        ReconciliationStatus = ReconciliationStatuses.Disputed;
    }

    private PaymentTransaction AddTransaction(
        string gatewayReference,
        string eventType,
        decimal amount,
        string currency,
        DateTimeOffset occurredAtUtc,
        bool signatureVerified)
    {
        var transaction = new PaymentTransaction(
            Guid.NewGuid(),
            Id,
            Gateway,
            gatewayReference,
            eventType,
            amount,
            currency,
            occurredAtUtc,
            signatureVerified);

        Transactions.Add(transaction);
        return transaction;
    }
}

/// <summary>
/// Immutable audit record of a gateway event. Never stores card data or credentials.
/// </summary>
public sealed class PaymentTransaction : AuditableEntity
{
    private PaymentTransaction()
    {
    }

    public PaymentTransaction(
        Guid id,
        Guid paymentId,
        string gateway,
        string gatewayReference,
        string eventType,
        decimal amount,
        string currency,
        DateTimeOffset occurredAtUtc,
        bool webhookSignatureVerified)
        : base(id)
    {
        PaymentId = PaymentGuard.Id(paymentId, nameof(paymentId));
        Gateway = PaymentGuard.Required(gateway, 30, nameof(gateway));
        GatewayReference = PaymentGuard.Required(gatewayReference, 200, nameof(gatewayReference));
        EventType = PaymentGuard.Required(eventType, 50, nameof(eventType));
        Amount = amount;
        Currency = PaymentGuard.Required(currency, 3, nameof(currency));
        OccurredAtUtc = occurredAtUtc;
        WebhookSignatureVerified = webhookSignatureVerified;
    }

    public Guid PaymentId { get; private set; }
    public string Gateway { get; private set; } = string.Empty;

    /// <summary>
    /// Gateway-specific reference (e.g. Stripe PaymentIntent ID).
    /// Never a card number, CVV, or raw credential.
    /// </summary>
    public string GatewayReference { get; private set; } = string.Empty;

    public string EventType { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; private set; }
    public bool WebhookSignatureVerified { get; private set; }
}

/// <summary>Refund record. Never stores card data or raw payment credentials.</summary>
public sealed class Refund : AuditableEntity
{
    private Refund()
    {
    }

    public Refund(
        Guid id,
        Guid paymentId,
        string idempotencyKey,
        decimal amount,
        string currency,
        string? reason,
        string initiatedBySubject)
        : base(id)
    {
        PaymentId = PaymentGuard.Id(paymentId, nameof(paymentId));
        IdempotencyKey = PaymentGuard.Required(idempotencyKey, 64, nameof(idempotencyKey));
        Amount = amount > 0
            ? amount
            : throw new ArgumentOutOfRangeException(nameof(amount));
        Currency = PaymentGuard.Required(currency, 3, nameof(currency));
        Reason = PaymentGuard.Optional(reason, 500, nameof(reason));
        InitiatedBySubject = PaymentGuard.Required(initiatedBySubject, 200, nameof(initiatedBySubject));
        Status = RefundStatuses.Pending;
    }

    public Guid PaymentId { get; private set; }
    public string IdempotencyKey { get; private set; } = string.Empty;
    public string? GatewayReference { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public string? Reason { get; private set; }
    public string Status { get; private set; } = string.Empty;
    public string InitiatedBySubject { get; private set; } = string.Empty;
    public string? ApprovedBySubject { get; private set; }

    public void MarkSucceeded(string gatewayReference, string approvedBySubject)
    {
        if (Status != RefundStatuses.Pending)
            throw new PaymentTransitionException($"Cannot complete a {Status} refund.");
        GatewayReference = PaymentGuard.Required(gatewayReference, 200, nameof(gatewayReference));
        ApprovedBySubject = PaymentGuard.Required(approvedBySubject, 200, nameof(approvedBySubject));
        Status = RefundStatuses.Succeeded;
    }

    public void MarkFailed()
    {
        if (Status != RefundStatuses.Pending)
            throw new PaymentTransitionException($"Cannot fail a {Status} refund.");
        Status = RefundStatuses.Failed;
    }
}

internal static class PaymentGuard
{
    public static Guid Id(Guid value, string name) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifier is required.", name)
            : value;

    public static string Required(string value, int maximum, string name)
    {
        var clean = value.Trim();
        return clean.Length is > 0 && clean.Length <= maximum
            ? clean
            : throw new ArgumentOutOfRangeException(name);
    }

    public static string? Optional(string? value, int maximum, string name)
    {
        var clean = value?.Trim();
        return string.IsNullOrEmpty(clean)
            ? null
            : clean.Length <= maximum
                ? clean
                : throw new ArgumentOutOfRangeException(name);
    }
}
