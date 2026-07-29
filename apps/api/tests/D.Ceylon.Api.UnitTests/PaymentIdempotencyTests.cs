using D.Ceylon.Modules.Payments.Contracts;
using D.Ceylon.Modules.Payments.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class PaymentIdempotencyTests
{
    private static Payment CreatePayment(
        string? idempotencyKey = null,
        decimal amount = 500m,
        string gateway = "manual") =>
        new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            idempotencyKey ?? $"idem-{Guid.NewGuid():N}",
            PaymentKinds.Deposit,
            gateway,
            "USD",
            amount);

    [Fact]
    public void NewPaymentHasPendingStatusAndUnreconciledReconciliation()
    {
        var payment = CreatePayment();
        Assert.Equal(PaymentStatuses.Pending, payment.Status);
        Assert.Equal(ReconciliationStatuses.Unreconciled, payment.ReconciliationStatus);
        Assert.Empty(payment.Transactions);
        Assert.Empty(payment.Refunds);
    }

    [Fact]
    public void IdempotencyKeyIsRequiredAndMaxSixtyFourChars()
    {
        var longKey = new string('a', 65);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new Payment(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                longKey,
                PaymentKinds.Deposit,
                PaymentGateways.Manual,
                "USD",
                100m));
    }

    [Fact]
    public void AmountMustBePositive()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new Payment(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                "valid-key-001",
                PaymentKinds.Deposit,
                PaymentGateways.Manual,
                "USD",
                0m));
    }

    [Fact]
    public void AuthoriseTransitionCreatesTransactionRecord()
    {
        var payment = CreatePayment();
        var transaction = payment.Authorise(
            "gw-ref-001",
            "payment_intent.created",
            DateTimeOffset.UtcNow,
            signatureVerified: true);

        Assert.Equal(PaymentStatuses.Authorised, payment.Status);
        Assert.Single(payment.Transactions);
        Assert.Equal("gw-ref-001", transaction.GatewayReference);
        Assert.True(transaction.WebhookSignatureVerified);
    }

    [Fact]
    public void CaptureTransitionFromAuthorisedCreatesTransaction()
    {
        var payment = CreatePayment();
        payment.Authorise("gw-ref-001", "created", DateTimeOffset.UtcNow, false);
        var captured = payment.Capture(
            "gw-ref-002",
            "payment_intent.succeeded",
            DateTimeOffset.UtcNow,
            signatureVerified: true);

        Assert.Equal(PaymentStatuses.Captured, payment.Status);
        Assert.Equal(2, payment.Transactions.Count);
        Assert.NotNull(payment.CapturedAtUtc);
        Assert.True(captured.WebhookSignatureVerified);
    }

    [Fact]
    public void CaptureDirectlyFromPendingIsValid()
    {
        var payment = CreatePayment();
        payment.Capture("gw-direct", "captured", DateTimeOffset.UtcNow, true);
        Assert.Equal(PaymentStatuses.Captured, payment.Status);
    }

    [Fact]
    public void CannotCaptureCancelledPayment()
    {
        var payment = CreatePayment();
        payment.Cancel();
        Assert.Throws<PaymentTransitionException>(
            () => payment.Capture("ref", "captured", DateTimeOffset.UtcNow, false));
    }

    [Fact]
    public void CannotCancelCapturedPayment()
    {
        var payment = CreatePayment();
        payment.Capture("ref", "captured", DateTimeOffset.UtcNow, false);
        Assert.Throws<PaymentTransitionException>(() => payment.Cancel());
    }

    [Fact]
    public void RecordFailureTransitionsToFailed()
    {
        var payment = CreatePayment();
        payment.RecordFailure("gw-ref-fail", "Insufficient funds", DateTimeOffset.UtcNow, false);
        Assert.Equal(PaymentStatuses.Failed, payment.Status);
        Assert.Equal("Insufficient funds", payment.FailedReason);
        Assert.Single(payment.Transactions);
    }

    [Fact]
    public void ReconcileChangesReconciliationStatus()
    {
        var payment = CreatePayment();
        payment.Capture("ref", "captured", DateTimeOffset.UtcNow, true);
        payment.Reconcile();
        Assert.Equal(ReconciliationStatuses.Reconciled, payment.ReconciliationStatus);
    }

    [Fact]
    public void MarkDisputedChangesReconciliationStatus()
    {
        var payment = CreatePayment();
        payment.MarkDisputed();
        Assert.Equal(ReconciliationStatuses.Disputed, payment.ReconciliationStatus);
    }

    [Fact]
    public void RefundIdempotencyKeyIsEnforced()
    {
        var payment = CreatePayment(amount: 500m);
        payment.Capture("ref", "captured", DateTimeOffset.UtcNow, true);

        var longKey = new string('b', 65);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            payment.Refunds.Add(
                new Refund(
                    Guid.NewGuid(),
                    payment.Id,
                    longKey,
                    100m,
                    "USD",
                    "Refund reason",
                    "user@test.invalid")));
    }

    [Fact]
    public void RefundMarkSucceededRequiresPendingStatus()
    {
        var refund = new Refund(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "refund-idem-001",
            200m,
            "USD",
            "Cancellation",
            "user@test.invalid");

        refund.MarkSucceeded("gw-refund-ref", "approver@test.invalid");
        Assert.Equal(RefundStatuses.Succeeded, refund.Status);

        Assert.Throws<PaymentTransitionException>(
            () => refund.MarkSucceeded("another-ref", "approver@test.invalid"));
    }

    [Fact]
    public void RefundMarkFailedSetsFailedStatus()
    {
        var refund = new Refund(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "refund-fail-001",
            50m,
            "USD",
            null,
            "user@test.invalid");

        refund.MarkFailed();
        Assert.Equal(RefundStatuses.Failed, refund.Status);
    }

    [Fact]
    public void PaymentLinkUrlIsAttachedAndExpiry()
    {
        var payment = CreatePayment();
        var expiry = DateTimeOffset.UtcNow.AddHours(24);
        payment.AttachPaymentLink("https://pay.example.com/link", expiry);
        Assert.NotNull(payment.PaymentLinkUrl);
        Assert.Equal(expiry, payment.PaymentLinkExpiresAtUtc);
    }
}
