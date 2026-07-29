using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class BookingEndpoints
{
    public static RouteGroupBuilder MapBookingEndpoints(this RouteGroupBuilder versionGroup)
    {
        var customer = versionGroup.MapGroup("/customer/bookings")
            .WithTags("Customer bookings")
            .RequireAuthorization(AccessPolicies.Customer);

        customer.MapGet("/", GetCustomerBookingsAsync)
            .WithName("GetCustomerBookingsV1")
            .Produces<PagedResponse<BookingSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();

        customer.MapGet("/{bookingId:guid}", GetCustomerBookingAsync)
            .WithName("GetCustomerBookingV1")
            .Produces<BookingResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        customer.MapGet("/{bookingId:guid}/vouchers/{voucherId:guid}", GetCustomerVoucherAsync)
            .WithName("GetCustomerVoucherV1")
            .Produces<VoucherResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        customer.MapPost("/", CreateBookingAsync)
            .WithName("CreateCustomerBookingV1")
            .Produces<BookingResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateBookingRequest>>();

        customer.MapPost("/{bookingId:guid}/request-cancellation", RequestCancellationAsync)
            .WithName("RequestBookingCancellationV1")
            .Produces<BookingResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CancelBookingRequest>>();

        var agent = versionGroup.MapGroup("/agent/bookings")
            .WithTags("Agent bookings")
            .RequireAuthorization(AccessPolicies.Agent);

        agent.MapGet("/", GetAgentBookingsAsync)
            .WithName("GetAgentBookingsV1")
            .Produces<PagedResponse<BookingSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();

        agent.MapGet("/{bookingId:guid}", GetAgentBookingAsync)
            .WithName("GetAgentBookingV1")
            .Produces<BookingResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        return versionGroup;
    }

    // ─── Customer handlers ────────────────────────────────────────────────────

    private static async Task<IResult> GetCustomerBookingsAsync(
        [AsParameters] CustomerPaginationRequest pagination,
        ClaimsPrincipal user,
        IBookingRecords records,
        CancellationToken cancellationToken)
    {
        var page = await records.GetCustomerBookingsAsync(
            CustomerId(user),
            pagination.PageNumber ?? 1,
            pagination.PageSize ?? 20,
            cancellationToken);

        return TypedResults.Ok(page);
    }

    private static async Task<IResult> GetCustomerBookingAsync(
        Guid bookingId,
        ClaimsPrincipal user,
        IBookingRecords records,
        CancellationToken cancellationToken)
    {
        var booking = await records.GetCustomerBookingAsync(
            CustomerId(user),
            bookingId,
            cancellationToken);

        return booking is null ? NotFound() : TypedResults.Ok(booking);
    }

    private static async Task<IResult> GetCustomerVoucherAsync(
        Guid bookingId,
        Guid voucherId,
        ClaimsPrincipal user,
        IBookingRecords records,
        CancellationToken cancellationToken)
    {
        var voucher = await records.GetCustomerVoucherAsync(
            CustomerId(user),
            bookingId,
            voucherId,
            cancellationToken);

        return voucher is null ? NotFound() : TypedResults.Ok(voucher);
    }

    private static async Task<IResult> CreateBookingAsync(
        CreateBookingRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IBookingRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var booking = await records.CreateFromAcceptedQuoteAsync(
            CustomerId(user),
            request,
            cancellationToken);

        await Audit(audit, user, context, "booking-created", cancellationToken);
        return TypedResults.Created($"/api/v1/customer/bookings/{booking.Id}", booking);
    }

    private static async Task<IResult> RequestCancellationAsync(
        Guid bookingId,
        CancelBookingRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IBookingRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var booking = await records.RequestCancellationAsync(
            CustomerId(user),
            bookingId,
            request,
            cancellationToken);

        if (booking is null) return NotFound();
        await Audit(audit, user, context, "booking-cancellation-requested", cancellationToken);
        return TypedResults.Ok(booking);
    }

    // ─── Agent handlers ───────────────────────────────────────────────────────

    private static async Task<IResult> GetAgentBookingsAsync(
        [AsParameters] CustomerPaginationRequest pagination,
        ClaimsPrincipal user,
        IBookingRecords records,
        CancellationToken cancellationToken)
    {
        var page = await records.GetAgentBookingsAsync(
            OrganisationId(user),
            pagination.PageNumber ?? 1,
            pagination.PageSize ?? 20,
            cancellationToken);

        return TypedResults.Ok(page);
    }

    private static async Task<IResult> GetAgentBookingAsync(
        Guid bookingId,
        ClaimsPrincipal user,
        IBookingRecords records,
        CancellationToken cancellationToken)
    {
        var booking = await records.GetAgentBookingAsync(
            OrganisationId(user),
            bookingId,
            cancellationToken);

        return booking is null ? NotFound() : TypedResults.Ok(booking);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static Guid CustomerId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(AccessClaimTypes.CustomerId), out var id)
            ? id
            : throw new InvalidOperationException("The customer claim is invalid.");

    private static Guid OrganisationId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(AccessClaimTypes.OrganisationId), out var id)
            ? id
            : throw new InvalidOperationException("The organisation claim is invalid.");

    private static Task Audit(
        ISecurityAuditWriter audit,
        ClaimsPrincipal user,
        HttpContext context,
        string eventType,
        CancellationToken cancellationToken) =>
        audit.RecordAsync(
            eventType,
            "succeeded",
            user.FindFirstValue(AccessClaimTypes.Subject),
            context.GetCorrelationId(),
            cancellationToken);

    private static ProblemHttpResult NotFound() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not found",
            detail: "The owner-scoped booking was not found.",
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");
}
