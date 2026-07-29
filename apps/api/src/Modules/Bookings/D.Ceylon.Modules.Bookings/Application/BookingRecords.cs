using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.Bookings.Domain;
using D.Ceylon.Modules.Bookings.Infrastructure.Persistence;
using D.Ceylon.Modules.Quotes.Contracts;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Bookings.Application;

internal sealed class BookingRecords(
    BookingsDbContext database,
    IQuoteBookingSources quoteSources)
    : IBookingRecords, IBookingPaymentSources
{
    public async Task<PagedResponse<BookingSummaryResponse>> GetCustomerBookingsAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Bookings.AsNoTracking()
            .Where(booking => booking.CustomerId == customerId);

        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(booking => booking.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            entities.Select(ToSummary).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<BookingResponse?> GetCustomerBookingAsync(
        Guid customerId,
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var booking = await CustomerBookingQuery(customerId, bookingId)
            .SingleOrDefaultAsync(cancellationToken);

        return booking is null ? null : ToResponse(booking);
    }

    public async Task<BookingResponse> CreateFromAcceptedQuoteAsync(
        Guid customerId,
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var quote = await quoteSources.GetAcceptedQuoteAsync(
            customerId,
            request.QuoteId,
            request.QuoteVersionId,
            cancellationToken);
        if (quote is null)
            throw new BookingNotFoundException(
                "The accepted current quote version was not found.");

        if (await database.Bookings.AnyAsync(
                b => b.QuoteId == request.QuoteId,
                cancellationToken))
        {
            throw new BookingConflictException(
                "A booking already exists for this quote.");
        }

        var bookingId = Guid.NewGuid();
        var reference = GenerateReference(bookingId);

        var booking = new Booking(
            bookingId,
            reference,
            quote.QuoteId,
            quote.QuoteVersionId,
            customerId,
            quote.OrganisationId,
            quote.Currency,
            quote.GrandTotal,
            quote.TravelStartDate,
            quote.TravelEndDate,
            quote.ItineraryTitle,
            request.CustomerNotes);

        var position = 0;
        foreach (var line in quote.Lines.OrderBy(line => line.Position))
        {
            booking.Items.Add(new BookingItem(
                Guid.NewGuid(),
                bookingId,
                ++position,
                line.Title,
                line.Description,
                line.Quantity,
                line.UnitAmount,
                line.LineTotal));
        }

        var invoice = new Invoice(
            Guid.NewGuid(),
            bookingId,
            GenerateInvoiceNumber(bookingId),
            quote.Currency,
            quote.Subtotal,
            quote.TaxTotal,
            quote.AdjustmentTotal,
            quote.GrandTotal);

        booking.Invoices.Add(invoice);
        database.Bookings.Add(booking);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(booking);
    }

    public async Task<BookingResponse?> RequestCancellationAsync(
        Guid customerId,
        Guid bookingId,
        CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        var booking = await CustomerBookingQuery(customerId, bookingId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);

        if (booking is null) return null;

        if (booking.ConcurrencyToken != request.ConcurrencyToken)
            throw new BookingConflictException("The booking was modified by another request. Reload and retry.");

        booking.RequestCancellation(request.Reason ?? string.Empty);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(booking);
    }

    public async Task<PagedResponse<BookingSummaryResponse>> GetAgentBookingsAsync(
        Guid organisationId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Bookings.AsNoTracking()
            .Where(booking => booking.OrganisationId == organisationId);

        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(booking => booking.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            entities.Select(ToSummary).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<BookingResponse?> GetAgentBookingAsync(
        Guid organisationId,
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var booking = await database.Bookings.AsNoTracking()
            .Where(b => b.OrganisationId == organisationId && b.Id == bookingId)
            .Include(b => b.Items)
            .Include(b => b.Invoices)
            .Include(b => b.Vouchers)
            .SingleOrDefaultAsync(cancellationToken);

        return booking is null ? null : ToResponse(booking);
    }

    public async Task<VoucherResponse?> GetCustomerVoucherAsync(
        Guid customerId,
        Guid bookingId,
        Guid voucherId,
        CancellationToken cancellationToken)
    {
        var booking = await database.Bookings.AsNoTracking()
            .Where(b => b.CustomerId == customerId && b.Id == bookingId)
            .Include(b => b.Vouchers)
            .SingleOrDefaultAsync(cancellationToken);

        if (booking is null) return null;
        var voucher = booking.Vouchers.SingleOrDefault(v => v.Id == voucherId);
        return voucher is null ? null : ToVoucherResponse(voucher, booking.Currency);
    }

    public async Task<BookingPaymentSource?> GetCustomerPaymentSourceAsync(
        Guid customerId,
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        var booking = await database.Bookings.AsNoTracking()
            .Where(item => item.CustomerId == customerId && item.Id == bookingId)
            .Select(item => new BookingPaymentSource(
                item.Id,
                item.CustomerId,
                item.BookingReference,
                item.Currency,
                item.TotalAmount,
                item.PaidAmount,
                item.Status))
            .SingleOrDefaultAsync(cancellationToken);
        return booking;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private IQueryable<Booking> CustomerBookingQuery(
        Guid customerId,
        Guid bookingId,
        bool tracking = false)
    {
        var query = tracking
            ? database.Bookings
            : database.Bookings.AsNoTracking();

        return query
            .Where(b => b.CustomerId == customerId && b.Id == bookingId)
            .Include(b => b.Items)
            .Include(b => b.Invoices)
            .Include(b => b.Vouchers);
    }

    private static BookingSummaryResponse ToSummary(Booking booking) =>
        new(
            booking.Id,
            booking.BookingReference,
            booking.ItineraryTitle,
            booking.TravelStartDate,
            booking.TravelEndDate,
            booking.Status,
            booking.Currency,
            booking.TotalAmount,
            booking.PaidAmount,
            booking.ConfirmedAtUtc,
            booking.ConcurrencyToken,
            booking.UpdatedAtUtc);

    private static BookingResponse ToResponse(Booking booking) =>
        new(
            booking.Id,
            booking.BookingReference,
            booking.QuoteId,
            booking.QuoteVersionId,
            booking.CustomerId,
            booking.OrganisationId,
            booking.ItineraryTitle,
            booking.TravelStartDate,
            booking.TravelEndDate,
            booking.Status,
            booking.Currency,
            booking.TotalAmount,
            booking.PaidAmount,
            booking.CustomerNotes,
            booking.ConfirmedAtUtc,
            booking.CancelledAtUtc,
            booking.CancellationReason,
            booking.Items.OrderBy(i => i.Position)
                .Select(i => new BookingItemResponse(
                    i.Id,
                    i.Position,
                    i.Title,
                    i.Description,
                    i.Quantity,
                    i.UnitAmount,
                    i.LineTotal,
                    booking.Currency))
                .ToArray(),
            booking.Invoices
                .OrderByDescending(i => i.CreatedAtUtc)
                .Select(i => new InvoiceResponse(
                    i.Id,
                    i.InvoiceNumber,
                    i.Status,
                    i.Currency,
                    i.Subtotal,
                    i.TaxTotal,
                    i.AdjustmentTotal,
                    i.GrandTotal,
                    i.IssuedAtUtc,
                    i.DueAtUtc,
                    i.PaidAtUtc,
                    i.DocumentKey is not null,
                    i.CreatedAtUtc))
                .ToArray(),
            booking.Vouchers
                .OrderBy(v => v.IssuedAtUtc)
                .Select(v => ToVoucherResponse(v, booking.Currency))
                .ToArray(),
            booking.ConcurrencyToken,
            booking.CreatedAtUtc,
            booking.UpdatedAtUtc);

    private static VoucherResponse ToVoucherResponse(Voucher voucher, string currency) =>
        new(
            voucher.Id,
            voucher.VoucherCode,
            voucher.Title,
            voucher.Description,
            voucher.ValidFrom,
            voucher.ValidUntil,
            voucher.Status,
            voucher.RedeemedAtUtc,
            voucher.IssuedAtUtc,
            voucher.DocumentKey is not null,
            voucher.ConcurrencyToken);

    private static string GenerateReference(Guid id) =>
        $"BK-{id:N}"[..14].ToUpperInvariant();

    private static string GenerateInvoiceNumber(Guid id) =>
        $"INV-{id:N}"[..15].ToUpperInvariant();
}
