using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Bookings.Contracts;

namespace D.Ceylon.Modules.Bookings.Domain;

public static class BookingStatuses
{
    public const string PendingConfirmation = "pending-confirmation";
    public const string Confirmed = "confirmed";
    public const string PartiallyPaid = "partially-paid";
    public const string Paid = "paid";
    public const string InProgress = "in-progress";
    public const string Completed = "completed";
    public const string CancellationRequested = "cancellation-requested";
    public const string Cancelled = "cancelled";
    public const string Refunded = "refunded";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(
        [
            PendingConfirmation,
            Confirmed,
            PartiallyPaid,
            Paid,
            InProgress,
            Completed,
            CancellationRequested,
            Cancelled,
            Refunded,
        ],
        StringComparer.Ordinal);
}

public static class InvoiceStatuses
{
    public const string Draft = "draft";
    public const string Issued = "issued";
    public const string Paid = "paid";
    public const string Void = "void";
}

public static class VoucherStatuses
{
    public const string Issued = "issued";
    public const string Redeemed = "redeemed";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
}

public sealed class Booking : AuditableEntity
{
    private Booking()
    {
    }

    public Booking(
        Guid id,
        string bookingReference,
        Guid quoteId,
        Guid quoteVersionId,
        Guid customerId,
        Guid? organisationId,
        string currency,
        decimal totalAmount,
        DateOnly travelStartDate,
        DateOnly travelEndDate,
        string itineraryTitle,
        string? customerNotes)
        : base(id)
    {
        BookingReference = BookingGuard.Reference(bookingReference);
        QuoteId = BookingGuard.Id(quoteId, nameof(quoteId));
        QuoteVersionId = BookingGuard.Id(quoteVersionId, nameof(quoteVersionId));
        CustomerId = BookingGuard.Id(customerId, nameof(customerId));
        OrganisationId = organisationId == Guid.Empty ? null : organisationId;
        Currency = BookingGuard.Required(currency, 3, nameof(currency));
        TotalAmount = totalAmount >= 0
            ? totalAmount
            : throw new ArgumentOutOfRangeException(nameof(totalAmount));
        PaidAmount = 0;
        TravelStartDate = travelStartDate;
        TravelEndDate = travelEndDate;
        ItineraryTitle = BookingGuard.Required(itineraryTitle, 200, nameof(itineraryTitle));
        CustomerNotes = BookingGuard.Optional(customerNotes, 2_000, nameof(customerNotes));
        Status = BookingStatuses.PendingConfirmation;
    }

    public string BookingReference { get; private set; } = string.Empty;
    public Guid QuoteId { get; private set; }
    public Guid QuoteVersionId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid? OrganisationId { get; private set; }
    public string Status { get; private set; } = string.Empty;
    public string Currency { get; private set; } = string.Empty;
    public decimal TotalAmount { get; private set; }
    public decimal PaidAmount { get; private set; }
    public DateOnly TravelStartDate { get; private set; }
    public DateOnly TravelEndDate { get; private set; }
    public string ItineraryTitle { get; private set; } = string.Empty;
    public string? CustomerNotes { get; private set; }
    public string? InternalNotes { get; private set; }
    public DateTimeOffset? ConfirmedAtUtc { get; private set; }
    public DateTimeOffset? CancelledAtUtc { get; private set; }
    public string? CancellationReason { get; private set; }
    public ICollection<BookingItem> Items { get; } = [];
    public ICollection<Invoice> Invoices { get; } = [];
    public ICollection<Voucher> Vouchers { get; } = [];

    public void Confirm(DateTimeOffset confirmedAtUtc)
    {
        if (Status is not BookingStatuses.PendingConfirmation)
        {
            throw new BookingTransitionException(
                $"Cannot confirm a booking that is {Status}.");
        }

        Status = BookingStatuses.Confirmed;
        ConfirmedAtUtc = confirmedAtUtc;
    }

    public void RecordPayment(decimal amount)
    {
        if (Status is BookingStatuses.Cancelled
            or BookingStatuses.Refunded
            or BookingStatuses.Completed)
        {
            throw new BookingTransitionException(
                $"Cannot record payment on a {Status} booking.");
        }

        if (amount <= 0)
            throw new BookingTransitionException("Payment amount must be positive.");

        PaidAmount += amount;

        if (PaidAmount >= TotalAmount)
        {
            Status = Status is BookingStatuses.Confirmed or BookingStatuses.PartiallyPaid
                ? BookingStatuses.Paid
                : Status;
        }
        else if (Status == BookingStatuses.Confirmed)
        {
            Status = BookingStatuses.PartiallyPaid;
        }
    }

    public void StartTravel()
    {
        if (Status is not (BookingStatuses.Confirmed
            or BookingStatuses.PartiallyPaid
            or BookingStatuses.Paid))
        {
            throw new BookingTransitionException(
                $"Travel can only be started for a confirmed or paid booking, not {Status}.");
        }

        Status = BookingStatuses.InProgress;
    }

    public void Complete()
    {
        RequireStatus(BookingStatuses.InProgress);
        Status = BookingStatuses.Completed;
    }

    public void RequestCancellation(string reason)
    {
        if (Status is BookingStatuses.Cancelled
            or BookingStatuses.Refunded
            or BookingStatuses.Completed
            or BookingStatuses.CancellationRequested)
        {
            throw new BookingTransitionException(
                $"Cannot request cancellation of a {Status} booking.");
        }

        Status = BookingStatuses.CancellationRequested;
        CancellationReason = BookingGuard.Optional(reason, 500, nameof(reason));
    }

    public void Cancel(DateTimeOffset cancelledAtUtc)
    {
        if (Status is not (BookingStatuses.CancellationRequested
            or BookingStatuses.PendingConfirmation))
        {
            throw new BookingTransitionException(
                $"Cannot cancel a booking that is {Status}. Request cancellation first.");
        }

        Status = BookingStatuses.Cancelled;
        CancelledAtUtc = cancelledAtUtc;
    }

    public void MarkRefunded()
    {
        RequireStatus(BookingStatuses.Cancelled);
        Status = BookingStatuses.Refunded;
    }

    public void SetInternalNotes(string? notes)
    {
        InternalNotes = BookingGuard.Optional(notes, 2_000, nameof(notes));
    }

    private void RequireStatus(string status)
    {
        if (!string.Equals(Status, status, StringComparison.Ordinal))
        {
            throw new BookingTransitionException(
                $"Expected booking status {status} but was {Status}.");
        }
    }
}

public sealed class BookingItem : AuditableEntity
{
    private BookingItem()
    {
    }

    public BookingItem(
        Guid id,
        Guid bookingId,
        int position,
        string title,
        string? description,
        decimal quantity,
        decimal unitAmount,
        decimal lineTotal)
        : base(id)
    {
        BookingId = BookingGuard.Id(bookingId, nameof(bookingId));
        Position = position;
        Title = BookingGuard.Required(title, 200, nameof(title));
        Description = BookingGuard.Optional(description, 1_000, nameof(description));
        Quantity = quantity;
        UnitAmount = unitAmount;
        LineTotal = lineTotal;
    }

    public Guid BookingId { get; private set; }
    public int Position { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Quantity { get; private set; }
    public decimal UnitAmount { get; private set; }
    public decimal LineTotal { get; private set; }
}

public sealed class Invoice : AuditableEntity
{
    private Invoice()
    {
    }

    public Invoice(
        Guid id,
        Guid bookingId,
        string invoiceNumber,
        string currency,
        decimal subtotal,
        decimal taxTotal,
        decimal adjustmentTotal,
        decimal grandTotal)
        : base(id)
    {
        BookingId = BookingGuard.Id(bookingId, nameof(bookingId));
        InvoiceNumber = BookingGuard.Reference(invoiceNumber);
        Currency = BookingGuard.Required(currency, 3, nameof(currency));
        Subtotal = subtotal;
        TaxTotal = taxTotal;
        AdjustmentTotal = adjustmentTotal;
        GrandTotal = grandTotal;
        Status = InvoiceStatuses.Draft;
    }

    public Guid BookingId { get; private set; }
    public string InvoiceNumber { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public string Currency { get; private set; } = string.Empty;
    public decimal Subtotal { get; private set; }
    public decimal TaxTotal { get; private set; }
    public decimal AdjustmentTotal { get; private set; }
    public decimal GrandTotal { get; private set; }
    public DateTimeOffset? IssuedAtUtc { get; private set; }
    public DateTimeOffset? DueAtUtc { get; private set; }
    public DateTimeOffset? PaidAtUtc { get; private set; }
    public string? DocumentKey { get; private set; }

    public void Issue(DateTimeOffset issuedAtUtc, DateTimeOffset dueAtUtc)
    {
        if (Status != InvoiceStatuses.Draft)
            throw new BookingTransitionException("Only a draft invoice can be issued.");
        Status = InvoiceStatuses.Issued;
        IssuedAtUtc = issuedAtUtc;
        DueAtUtc = dueAtUtc;
    }

    public void MarkPaid(DateTimeOffset paidAtUtc)
    {
        if (Status != InvoiceStatuses.Issued)
            throw new BookingTransitionException("Only an issued invoice can be marked paid.");
        Status = InvoiceStatuses.Paid;
        PaidAtUtc = paidAtUtc;
    }

    public void Void()
    {
        if (Status == InvoiceStatuses.Paid)
            throw new BookingTransitionException("A paid invoice cannot be voided.");
        Status = InvoiceStatuses.Void;
    }

    public void AttachDocument(string documentKey)
    {
        DocumentKey = BookingGuard.Required(documentKey, 500, nameof(documentKey));
    }
}

public sealed class Voucher : AuditableEntity
{
    private Voucher()
    {
    }

    public Voucher(
        Guid id,
        Guid bookingId,
        string voucherCode,
        string title,
        string? description,
        DateOnly validFrom,
        DateOnly validUntil,
        DateTimeOffset issuedAtUtc)
        : base(id)
    {
        BookingId = BookingGuard.Id(bookingId, nameof(bookingId));
        VoucherCode = BookingGuard.Required(voucherCode, 50, nameof(voucherCode));
        Title = BookingGuard.Required(title, 200, nameof(title));
        Description = BookingGuard.Optional(description, 2_000, nameof(description));
        ValidFrom = validFrom;
        ValidUntil = validUntil;
        IssuedAtUtc = issuedAtUtc;
        Status = VoucherStatuses.Issued;
    }

    public Guid BookingId { get; private set; }
    public string VoucherCode { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateOnly ValidFrom { get; private set; }
    public DateOnly ValidUntil { get; private set; }
    public string Status { get; private set; } = string.Empty;
    public DateTimeOffset? RedeemedAtUtc { get; private set; }
    public DateTimeOffset IssuedAtUtc { get; private set; }
    public string? DocumentKey { get; private set; }

    public void Redeem(DateTimeOffset redeemedAtUtc)
    {
        if (Status != VoucherStatuses.Issued)
            throw new BookingTransitionException($"Cannot redeem a {Status} voucher.");
        Status = VoucherStatuses.Redeemed;
        RedeemedAtUtc = redeemedAtUtc;
    }

    public void Cancel()
    {
        if (Status == VoucherStatuses.Redeemed)
            throw new BookingTransitionException("A redeemed voucher cannot be cancelled.");
        Status = VoucherStatuses.Cancelled;
    }

    public void AttachDocument(string documentKey)
    {
        DocumentKey = BookingGuard.Required(documentKey, 500, nameof(documentKey));
    }
}

internal static class BookingGuard
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

    public static string Reference(string value)
    {
        var clean = value.Trim();
        return clean.Length is > 0 and <= 30
            ? clean
            : throw new ArgumentOutOfRangeException(nameof(value), "Reference must be 1–30 characters.");
    }
}
