using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.Bookings.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class BookingStateTransitionTests
{
    private static Booking CreateBooking(
        string currency = "USD",
        decimal total = 1000m) =>
        new(
            Guid.NewGuid(),
            "BK-TESTREF0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            currency,
            total,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(37)),
            "Test Itinerary",
            null);

    [Fact]
    public void NewBookingStartsAsPendingConfirmation()
    {
        var booking = CreateBooking();
        Assert.Equal(BookingStatuses.PendingConfirmation, booking.Status);
        Assert.Equal(0, booking.PaidAmount);
    }

    [Fact]
    public void ConfirmTransitionsPendingToConfirmed()
    {
        var booking = CreateBooking();
        booking.Confirm(DateTimeOffset.UtcNow);
        Assert.Equal(BookingStatuses.Confirmed, booking.Status);
        Assert.NotNull(booking.ConfirmedAtUtc);
    }

    [Fact]
    public void RecordPartialPaymentTransitionsToPartiallyPaid()
    {
        var booking = CreateBooking(total: 2000m);
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RecordPayment(500m);
        Assert.Equal(BookingStatuses.PartiallyPaid, booking.Status);
        Assert.Equal(500m, booking.PaidAmount);
    }

    [Fact]
    public void RecordFullPaymentTransitionsToPaid()
    {
        var booking = CreateBooking(total: 1000m);
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RecordPayment(1000m);
        Assert.Equal(BookingStatuses.Paid, booking.Status);
        Assert.Equal(1000m, booking.PaidAmount);
    }

    [Fact]
    public void RecordMultiplePaymentsAccumulatesCorrectly()
    {
        var booking = CreateBooking(total: 1000m);
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RecordPayment(400m);
        booking.RecordPayment(600m);
        Assert.Equal(BookingStatuses.Paid, booking.Status);
        Assert.Equal(1000m, booking.PaidAmount);
    }

    [Fact]
    public void StartTravelRequiresConfirmedOrPaidStatus()
    {
        var booking = CreateBooking();
        Assert.Throws<BookingTransitionException>(() => booking.StartTravel());
    }

    [Fact]
    public void StartTravelAndCompleteSequenceIsValid()
    {
        var booking = CreateBooking(total: 500m);
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RecordPayment(500m);
        booking.StartTravel();
        Assert.Equal(BookingStatuses.InProgress, booking.Status);
        booking.Complete();
        Assert.Equal(BookingStatuses.Completed, booking.Status);
    }

    [Fact]
    public void RequestCancellationFromConfirmed()
    {
        var booking = CreateBooking();
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RequestCancellation("Customer changed plans");
        Assert.Equal(BookingStatuses.CancellationRequested, booking.Status);
        Assert.Equal("Customer changed plans", booking.CancellationReason);
    }

    [Fact]
    public void CancelAfterRequestCancellationIsValid()
    {
        var booking = CreateBooking();
        booking.Confirm(DateTimeOffset.UtcNow);
        booking.RequestCancellation("Duplicate booking");
        booking.Cancel(DateTimeOffset.UtcNow);
        Assert.Equal(BookingStatuses.Cancelled, booking.Status);
        Assert.NotNull(booking.CancelledAtUtc);
    }

    [Fact]
    public void MarkRefundedRequiresCancelledStatus()
    {
        var booking = CreateBooking();
        Assert.Throws<BookingTransitionException>(() => booking.MarkRefunded());
    }

    [Fact]
    public void RefundAfterCancelIsValid()
    {
        var booking = CreateBooking();
        booking.RequestCancellation("Cancellation");
        booking.Cancel(DateTimeOffset.UtcNow);
        booking.MarkRefunded();
        Assert.Equal(BookingStatuses.Refunded, booking.Status);
    }

    [Fact]
    public void CannotConfirmAlreadyConfirmedBooking()
    {
        var booking = CreateBooking();
        booking.Confirm(DateTimeOffset.UtcNow);
        Assert.Throws<BookingTransitionException>(
            () => booking.Confirm(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void CannotRequestCancellationOfCancelledBooking()
    {
        var booking = CreateBooking();
        booking.RequestCancellation("First cancellation");
        booking.Cancel(DateTimeOffset.UtcNow);
        Assert.Throws<BookingTransitionException>(
            () => booking.RequestCancellation("Second cancellation"));
    }

    [Fact]
    public void CannotRecordPaymentOnCancelledBooking()
    {
        var booking = CreateBooking(total: 1000m);
        booking.RequestCancellation("Cancelled");
        booking.Cancel(DateTimeOffset.UtcNow);
        Assert.Throws<BookingTransitionException>(() => booking.RecordPayment(100m));
    }

    [Fact]
    public void AllStatusConstantsArePresentInSet()
    {
        Assert.Contains(BookingStatuses.PendingConfirmation, BookingStatuses.All);
        Assert.Contains(BookingStatuses.Confirmed, BookingStatuses.All);
        Assert.Contains(BookingStatuses.PartiallyPaid, BookingStatuses.All);
        Assert.Contains(BookingStatuses.Paid, BookingStatuses.All);
        Assert.Contains(BookingStatuses.InProgress, BookingStatuses.All);
        Assert.Contains(BookingStatuses.Completed, BookingStatuses.All);
        Assert.Contains(BookingStatuses.CancellationRequested, BookingStatuses.All);
        Assert.Contains(BookingStatuses.Cancelled, BookingStatuses.All);
        Assert.Contains(BookingStatuses.Refunded, BookingStatuses.All);
    }
}
