using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.IdentityAccess.Security;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class TravelPlanningEndpoints
{
    public static RouteGroupBuilder MapTravelPlanningEndpoints(this RouteGroupBuilder versionGroup)
    {
        var plans = versionGroup.MapGroup("/customer/travel-plans")
            .WithTags("Travel planning")
            .RequireAuthorization(AccessPolicies.Customer);

        plans.MapGet("/", GetPlansAsync)
            .WithName("GetCustomerTravelPlansV1")
            .Produces<PagedResponse<TravelPlanSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        plans.MapGet("/{planId:guid}", GetPlanAsync)
            .WithName("GetCustomerTravelPlanV1")
            .Produces<TravelPlanResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        plans.MapPost("/", CreatePlanAsync)
            .WithName("CreateCustomerTravelPlanV1")
            .Produces<TravelPlanResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AddEndpointFilter<ValidationEndpointFilter<CreateTravelPlanRequest>>();
        plans.MapPut("/{planId:guid}/input", UpdateInputAsync)
            .WithName("UpdateCustomerTravelPlanInputV1")
            .Produces<TravelPlanResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateTravelPlanInputRequest>>();
        plans.MapPost("/{planId:guid}/generate", GenerateAsync)
            .WithName("GenerateCustomerTravelPlanV1")
            .Produces<TravelPlanResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<GenerateTravelPlanRequest>>();
        plans.MapPut("/{planId:guid}/days/{dayId:guid}", UpdateDayAsync)
            .WithName("UpdateCustomerItineraryDayV1")
            .Produces<TravelPlanResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateItineraryDayRequest>>();
        plans.MapPost("/{planId:guid}/days/{dayId:guid}/items", CreateItemAsync)
            .WithName("CreateCustomerItineraryItemV1")
            .Produces<TravelPlanResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateItineraryItemRequest>>();
        plans.MapPut("/{planId:guid}/items/{itemId:guid}", UpdateItemAsync)
            .WithName("UpdateCustomerItineraryItemV1")
            .Produces<TravelPlanResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateItineraryItemRequest>>();
        plans.MapPost("/{planId:guid}/items/{itemId:guid}/reorder", ReorderItemAsync)
            .WithName("ReorderCustomerItineraryItemV1")
            .Produces<TravelPlanResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<ReorderItineraryItemRequest>>();
        return versionGroup;
    }

    private static async Task<Ok<PagedResponse<TravelPlanSummaryResponse>>> GetPlansAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        ITravelPlanRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await records.GetAsync(
            CustomerId(user), request.PageNumber ?? 1, request.PageSize ?? 20,
            cancellationToken));

    private static async Task<IResult> GetPlanAsync(
        Guid planId,
        ClaimsPrincipal user,
        ITravelPlanRecords records,
        CancellationToken cancellationToken) =>
        Result(await records.GetAsync(CustomerId(user), planId, cancellationToken));

    private static async Task<IResult> CreatePlanAsync(
        CreateTravelPlanRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.CreateAsync(CustomerId(user), request, cancellationToken);
        await Audit(audit, user, context, "travel-plan-generated", cancellationToken);
        return TypedResults.Created($"/api/v1/customer/travel-plans/{response.Id}", response);
    }

    private static async Task<IResult> UpdateInputAsync(
        Guid planId,
        UpdateTravelPlanInputRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateInputAsync(
            CustomerId(user), planId, request, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "travel-plan-input-updated", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> GenerateAsync(
        Guid planId,
        GenerateTravelPlanRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.GenerateAsync(
            CustomerId(user), planId, request.ConcurrencyToken, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "travel-plan-regenerated", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> UpdateDayAsync(
        Guid planId,
        Guid dayId,
        UpdateItineraryDayRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateDayAsync(
            CustomerId(user), planId, dayId, request, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "itinerary-day-updated", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> CreateItemAsync(
        Guid planId,
        Guid dayId,
        CreateItineraryItemRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.CreateItemAsync(
            CustomerId(user), planId, dayId, request, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "itinerary-item-created", cancellationToken);
        return TypedResults.Created(
            $"/api/v1/customer/travel-plans/{planId}", response);
    }

    private static async Task<IResult> UpdateItemAsync(
        Guid planId,
        Guid itemId,
        UpdateItineraryItemRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateItemAsync(
            CustomerId(user), planId, itemId, request, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "itinerary-item-updated", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> ReorderItemAsync(
        Guid planId,
        Guid itemId,
        ReorderItineraryItemRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ITravelPlanRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.ReorderItemAsync(
            CustomerId(user), planId, itemId, request, cancellationToken);
        if (response is null) return NotFound();
        await Audit(audit, user, context, "itinerary-item-reordered", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static Guid CustomerId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(AccessClaimTypes.CustomerId), out var id)
            ? id
            : throw new InvalidOperationException("The customer claim is invalid.");

    private static Task Audit(
        ISecurityAuditWriter audit,
        ClaimsPrincipal user,
        HttpContext context,
        string eventType,
        CancellationToken cancellationToken) =>
        audit.RecordAsync(
            eventType, "succeeded", user.FindFirstValue(AccessClaimTypes.Subject),
            context.GetCorrelationId(), cancellationToken);

    private static IResult Result(TravelPlanResponse? response) =>
        response is null ? NotFound() : TypedResults.Ok(response);

    private static ProblemHttpResult NotFound() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not found",
            detail: "The customer-owned travel plan or draft item was not found.",
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");
}
