using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.IdentityAccess.Security;
using D.Ceylon.Modules.Payments.Contracts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder versionGroup)
    {
        var customer = versionGroup.MapGroup("/customer")
            .WithTags("Customer payments")
            .RequireAuthorization(AccessPolicies.Customer);

        customer.MapGet("/bookings/{bookingId:guid}/payments", GetPaymentsAsync)
            .WithName("GetCustomerPaymentsV1")
            .Produces<PagedResponse<PaymentSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        customer.MapPost("/bookings/{bookingId:guid}/payments", CreatePaymentAsync)
            .WithName("CreateCustomerPaymentV1")
            .Produces<PaymentResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreatePaymentRequest>>();
        customer.MapGet("/payments/{paymentId:guid}", GetPaymentAsync)
            .WithName("GetCustomerPaymentV1")
            .Produces<PaymentResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        return versionGroup;
    }

    private static async Task<IResult> GetPaymentsAsync(
        Guid bookingId,
        [AsParameters] CustomerPaginationRequest pagination,
        ClaimsPrincipal user,
        IPaymentRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetCustomerPaymentsAsync(
                CustomerId(user),
                bookingId,
                pagination.PageNumber ?? 1,
                pagination.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> CreatePaymentAsync(
        Guid bookingId,
        CreatePaymentRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IPaymentRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var payment = await records.CreatePaymentAsync(
            CustomerId(user), bookingId, request, cancellationToken);
        await audit.RecordAsync(
            "payment-created",
            "succeeded",
            user.FindFirstValue(AccessClaimTypes.Subject),
            context.GetCorrelationId(),
            cancellationToken);
        return TypedResults.Created($"/api/v1/customer/payments/{payment.Id}", payment);
    }

    private static async Task<IResult> GetPaymentAsync(
        Guid paymentId,
        ClaimsPrincipal user,
        IPaymentRecords records,
        CancellationToken cancellationToken)
    {
        var payment = await records.GetCustomerPaymentAsync(
            CustomerId(user), paymentId, cancellationToken);
        return payment is null ? NotFound() : TypedResults.Ok(payment);
    }

    private static Guid CustomerId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(AccessClaimTypes.CustomerId), out var id)
            ? id
            : throw new InvalidOperationException("The customer claim is invalid.");

    private static ProblemHttpResult NotFound() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not found",
            detail: "The owner-scoped payment was not found.",
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");
}
