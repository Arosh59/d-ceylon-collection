using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.IdentityAccess.Security;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class CustomerEndpoints
{
    public static RouteGroupBuilder MapCustomerEndpoints(this RouteGroupBuilder versionGroup)
    {
        ArgumentNullException.ThrowIfNull(versionGroup);

        var customer = versionGroup
            .MapGroup("/customer")
            .WithTags("Customer records")
            .RequireAuthorization(AccessPolicies.Customer);

        customer.MapGet("/profile", GetProfileAsync)
            .WithName("GetCustomerProfileV1")
            .Produces<CustomerProfileResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        customer.MapPost("/profile", CreateProfileAsync)
            .WithName("CreateCustomerProfileV1")
            .Produces<CustomerProfileResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateCustomerProfileRequest>>();
        customer.MapPut("/profile", UpdateProfileAsync)
            .WithName("UpdateCustomerProfileV1")
            .Produces<CustomerProfileResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateCustomerProfileRequest>>();
        customer.MapDelete("/profile", DeleteProfileAsync)
            .WithName("DeleteCustomerProfileV1")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<ConcurrencyRequest>>();

        customer.MapGet("/travellers", GetTravellersAsync)
            .WithName("GetCustomerTravellersV1")
            .Produces<PagedResponse<TravellerResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        customer.MapGet("/travellers/{travellerId:guid}", GetTravellerAsync)
            .WithName("GetCustomerTravellerV1")
            .Produces<TravellerResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        customer.MapPost("/travellers", CreateTravellerAsync)
            .WithName("CreateCustomerTravellerV1")
            .Produces<TravellerResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CreateTravellerRequest>>();
        customer.MapPut("/travellers/{travellerId:guid}", UpdateTravellerAsync)
            .WithName("UpdateCustomerTravellerV1")
            .Produces<TravellerResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateTravellerRequest>>();
        customer.MapDelete("/travellers/{travellerId:guid}", DeleteTravellerAsync)
            .WithName("DeleteCustomerTravellerV1")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<ConcurrencyRequest>>();

        customer.MapGet("/wishlist", GetWishlistAsync)
            .WithName("GetCustomerWishlistV1")
            .Produces<PagedResponse<WishlistEntryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        customer.MapPost("/wishlist", CreateWishlistEntryAsync)
            .WithName("CreateCustomerWishlistEntryV1")
            .Produces<WishlistEntryResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateWishlistEntryRequest>>();
        customer.MapPut("/wishlist/{entryId:guid}", UpdateWishlistEntryAsync)
            .WithName("UpdateCustomerWishlistEntryV1")
            .Produces<WishlistEntryResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateWishlistEntryRequest>>();
        customer.MapDelete("/wishlist/{entryId:guid}", DeleteWishlistEntryAsync)
            .WithName("DeleteCustomerWishlistEntryV1")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<ConcurrencyRequest>>();

        customer.MapGet("/saved-itineraries", GetSavedItinerariesAsync)
            .WithName("GetCustomerSavedItinerariesV1")
            .Produces<PagedResponse<SavedItineraryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        customer.MapGet("/saved-itineraries/{itineraryId:guid}", GetSavedItineraryAsync)
            .WithName("GetCustomerSavedItineraryV1")
            .Produces<SavedItineraryResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        customer.MapPost("/saved-itineraries", CreateSavedItineraryAsync)
            .WithName("CreateCustomerSavedItineraryV1")
            .Produces<SavedItineraryResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AddEndpointFilter<ValidationEndpointFilter<CreateSavedItineraryRequest>>();
        customer.MapPut("/saved-itineraries/{itineraryId:guid}", UpdateSavedItineraryAsync)
            .WithName("UpdateCustomerSavedItineraryV1")
            .Produces<SavedItineraryResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateSavedItineraryRequest>>();
        customer.MapDelete("/saved-itineraries/{itineraryId:guid}", DeleteSavedItineraryAsync)
            .WithName("DeleteCustomerSavedItineraryV1")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<ConcurrencyRequest>>();

        return versionGroup;
    }

    private static async Task<IResult> GetProfileAsync(
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken)
    {
        var response = await records.GetProfileAsync(CustomerId(user), cancellationToken);
        return response is null ? NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> CreateProfileAsync(
        CreateCustomerProfileRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.CreateProfileAsync(
            CustomerId(user),
            request,
            cancellationToken);
        await AuditAsync(
            audit,
            user,
            context,
            "customer-profile-created",
            cancellationToken);
        return TypedResults.Created("/api/v1/customer/profile", response);
    }

    private static async Task<IResult> UpdateProfileAsync(
        UpdateCustomerProfileRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateProfileAsync(
            CustomerId(user),
            request,
            cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "customer-profile-updated",
            cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> GetTravellersAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetTravellersAsync(
                CustomerId(user),
                request.PageNumber ?? 1,
                request.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> DeleteProfileAsync(
        [AsParameters] ConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var deleted = await records.DeleteProfileAsync(
            CustomerId(user),
            request.ConcurrencyToken,
            cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "customer-profile-deleted",
            cancellationToken);
        return TypedResults.NoContent();
    }

    private static async Task<IResult> GetTravellerAsync(
        Guid travellerId,
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken)
    {
        var response = await records.GetTravellerAsync(
            CustomerId(user),
            travellerId,
            cancellationToken);
        return response is null ? NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> CreateTravellerAsync(
        CreateTravellerRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.CreateTravellerAsync(
            CustomerId(user),
            request,
            cancellationToken);
        await AuditAsync(audit, user, context, "traveller-created", cancellationToken);
        return TypedResults.Created(
            $"/api/v1/customer/travellers/{response.Id}",
            response);
    }

    private static async Task<IResult> UpdateTravellerAsync(
        Guid travellerId,
        UpdateTravellerRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateTravellerAsync(
            CustomerId(user),
            travellerId,
            request,
            cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        await AuditAsync(audit, user, context, "traveller-updated", cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> DeleteTravellerAsync(
        Guid travellerId,
        [AsParameters] ConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var deleted = await records.DeleteTravellerAsync(
            CustomerId(user),
            travellerId,
            request.ConcurrencyToken,
            cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        await AuditAsync(audit, user, context, "traveller-deleted", cancellationToken);
        return TypedResults.NoContent();
    }

    private static async Task<IResult> GetWishlistAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetWishlistAsync(
                CustomerId(user),
                request.PageNumber ?? 1,
                request.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> CreateWishlistEntryAsync(
        CreateWishlistEntryRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ICatalogueQueries catalogue,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        if (await catalogue.GetPublishedProductAsync(
                request.ProductSlug,
                cancellationToken) is null)
        {
            return NotFound("The published product was not found.");
        }

        var response = await records.CreateWishlistEntryAsync(
            CustomerId(user),
            request,
            cancellationToken);
        await AuditAsync(
            audit,
            user,
            context,
            "wishlist-entry-created",
            cancellationToken);
        return TypedResults.Created(
            $"/api/v1/customer/wishlist/{response.Id}",
            response);
    }

    private static async Task<IResult> UpdateWishlistEntryAsync(
        Guid entryId,
        UpdateWishlistEntryRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.UpdateWishlistEntryAsync(
            CustomerId(user),
            entryId,
            request,
            cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "wishlist-entry-updated",
            cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> DeleteWishlistEntryAsync(
        Guid entryId,
        [AsParameters] ConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var deleted = await records.DeleteWishlistEntryAsync(
            CustomerId(user),
            entryId,
            request.ConcurrencyToken,
            cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "wishlist-entry-deleted",
            cancellationToken);
        return TypedResults.NoContent();
    }

    private static async Task<IResult> GetSavedItinerariesAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetSavedItinerariesAsync(
                CustomerId(user),
                request.PageNumber ?? 1,
                request.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> GetSavedItineraryAsync(
        Guid itineraryId,
        ClaimsPrincipal user,
        ICustomerRecords records,
        CancellationToken cancellationToken)
    {
        var response = await records.GetSavedItineraryAsync(
            CustomerId(user),
            itineraryId,
            cancellationToken);
        return response is null ? NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> CreateSavedItineraryAsync(
        CreateSavedItineraryRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ICatalogueQueries catalogue,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        if (!await DestinationExistsAsync(
                request.PrimaryDestinationSlug,
                catalogue,
                cancellationToken))
        {
            return NotFound("The published destination was not found.");
        }

        var response = await records.CreateSavedItineraryAsync(
            CustomerId(user),
            request,
            cancellationToken);
        await AuditAsync(
            audit,
            user,
            context,
            "saved-itinerary-created",
            cancellationToken);
        return TypedResults.Created(
            $"/api/v1/customer/saved-itineraries/{response.Id}",
            response);
    }

    private static async Task<IResult> UpdateSavedItineraryAsync(
        Guid itineraryId,
        UpdateSavedItineraryRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ICatalogueQueries catalogue,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        if (!await DestinationExistsAsync(
                request.PrimaryDestinationSlug,
                catalogue,
                cancellationToken))
        {
            return NotFound("The published destination was not found.");
        }

        var response = await records.UpdateSavedItineraryAsync(
            CustomerId(user),
            itineraryId,
            request,
            cancellationToken);
        if (response is null)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "saved-itinerary-updated",
            cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> DeleteSavedItineraryAsync(
        Guid itineraryId,
        [AsParameters] ConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ICustomerRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var deleted = await records.DeleteSavedItineraryAsync(
            CustomerId(user),
            itineraryId,
            request.ConcurrencyToken,
            cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        await AuditAsync(
            audit,
            user,
            context,
            "saved-itinerary-deleted",
            cancellationToken);
        return TypedResults.NoContent();
    }

    private static Guid CustomerId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(AccessClaimTypes.CustomerId), out var customerId)
            ? customerId
            : throw new InvalidOperationException(
                "The validated customer identity omitted a usable customer identifier.");

    private static Task AuditAsync(
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

    private static async Task<bool> DestinationExistsAsync(
        string? destinationSlug,
        ICatalogueQueries catalogue,
        CancellationToken cancellationToken) =>
        string.IsNullOrWhiteSpace(destinationSlug)
        || await catalogue.GetDestinationAsync(destinationSlug, cancellationToken) is not null;

    private static ProblemHttpResult NotFound(
        string detail = "The customer-owned record was not found.") =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not found",
            detail: detail,
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");
}

internal sealed class CustomerPaginationRequest
{
    [Range(1, 10_000)]
    public int? PageNumber { get; init; }

    [Range(1, 100)]
    public int? PageSize { get; init; }
}

internal sealed class ConcurrencyRequest
{
    [Required]
    public Guid ConcurrencyToken { get; init; }
}
