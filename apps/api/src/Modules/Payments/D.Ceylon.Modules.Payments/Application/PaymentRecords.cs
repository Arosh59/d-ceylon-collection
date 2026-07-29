using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.Payments.Contracts;
using D.Ceylon.Modules.Payments.Domain;
using D.Ceylon.Modules.Payments.Infrastructure.Persistence;
using D.Ceylon.Modules.Pricing;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Payments.Application;

internal sealed class PaymentRecords(
    PaymentsDbContext database,
    IBookingPaymentSources bookingSources)
    : IPaymentRecords
{
    public async Task<PagedResponse<PaymentSummaryResponse>> GetCustomerPaymentsAsync(
        Guid customerId,
        Guid bookingId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Payments.AsNoTracking()
            .Where(p => p.CustomerId == customerId && p.BookingId == bookingId);

        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            entities.Select(ToSummary).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<PaymentResponse?> GetCustomerPaymentAsync(
        Guid customerId,
        Guid paymentId,
        CancellationToken cancellationToken)
    {
        var payment = await database.Payments.AsNoTracking()
            .Where(p => p.CustomerId == customerId && p.Id == paymentId)
            .Include(p => p.Transactions)
            .Include(p => p.Refunds)
            .SingleOrDefaultAsync(cancellationToken);

        return payment is null ? null : ToResponse(payment);
    }

    public async Task<PaymentResponse> CreatePaymentAsync(
        Guid customerId,
        Guid bookingId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingSources.GetCustomerPaymentSourceAsync(
            customerId,
            bookingId,
            cancellationToken);
        if (booking is null)
            throw new PaymentNotFoundException("The owner-scoped booking was not found.");

        if (booking.Status is "cancelled" or "refunded" or "completed")
            throw new PaymentTransitionException("This booking cannot accept a payment.");

        var amount = PriceCalculator.Round(booking.TotalAmount - booking.PaidAmount);
        if (amount <= 0)
            throw new PaymentConflictException("The booking has no outstanding amount.");

        var kind = request.Kind.Trim().ToLowerInvariant();
        var gateway = request.Gateway.Trim().ToLowerInvariant();
        if (kind is not (PaymentKinds.Deposit or PaymentKinds.Balance or PaymentKinds.ManualTransfer
            or PaymentKinds.PaymentLink)
            || gateway is not (PaymentGateways.Stripe or PaymentGateways.Local or PaymentGateways.Manual))
        {
            throw new PaymentTransitionException("The payment kind or gateway is not supported.");
        }

        if (await database.Payments.AnyAsync(
                p => p.IdempotencyKey == request.IdempotencyKey,
                cancellationToken))
        {
            throw new PaymentConflictException(
                "A payment with this idempotency key already exists. Do not retry with the same key.");
        }

        var payment = new Payment(
            Guid.NewGuid(),
            booking.BookingId,
            customerId,
            request.IdempotencyKey,
            kind,
            gateway,
            CurrencyRules.RequireSupported(booking.Currency),
            amount);

        database.Payments.Add(payment);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(payment);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static PaymentSummaryResponse ToSummary(Payment payment) =>
        new(
            payment.Id,
            payment.BookingId,
            payment.Kind,
            payment.Gateway,
            payment.Status,
            payment.Currency,
            payment.Amount,
            payment.ReconciliationStatus,
            payment.CapturedAtUtc,
            payment.ConcurrencyToken,
            payment.UpdatedAtUtc);

    private static PaymentResponse ToResponse(Payment payment) =>
        new(
            payment.Id,
            payment.BookingId,
            payment.CustomerId,
            payment.Kind,
            payment.Gateway,
            payment.Status,
            payment.Currency,
            payment.Amount,
            payment.ReconciliationStatus,
            payment.PaymentLinkUrl is not null,
            payment.PaymentLinkExpiresAtUtc,
            payment.CapturedAtUtc,
            payment.FailedReason,
            payment.Transactions
                .OrderBy(t => t.OccurredAtUtc)
                .Select(t => new PaymentTransactionResponse(
                    t.Id,
                    t.Gateway,
                    t.GatewayReference,
                    t.EventType,
                    t.Amount,
                    t.Currency,
                    t.OccurredAtUtc,
                    t.WebhookSignatureVerified))
                .ToArray(),
            payment.Refunds
                .OrderBy(r => r.CreatedAtUtc)
                .Select(r => new RefundResponse(
                    r.Id,
                    r.Amount,
                    r.Currency,
                    r.Reason,
                    r.Status,
                    r.CreatedAtUtc))
                .ToArray(),
            payment.ConcurrencyToken,
            payment.CreatedAtUtc,
            payment.UpdatedAtUtc);
}
