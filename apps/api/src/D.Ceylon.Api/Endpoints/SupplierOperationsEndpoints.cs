using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.IdentityAccess.Security;
using D.Ceylon.Modules.SupplierOperations.Contracts;

namespace D.Ceylon.Api.Endpoints;

internal static class SupplierOperationsEndpoints
{
    public static RouteGroupBuilder MapSupplierOperationsEndpoints(
        this RouteGroupBuilder versionGroup)
    {
        var operations = versionGroup.MapGroup("/operations")
            .WithTags("Supplier operations")
            .RequireAuthorization(AccessPolicies.Staff);

        operations.MapGet("/suppliers", GetSuppliersAsync)
            .WithName("GetOperationSuppliersV1")
            .Produces<PagedResponse<SupplierResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();

        operations.MapPost("/suppliers", CreateSupplierAsync)
            .WithName("CreateOperationSupplierV1")
            .Produces<SupplierResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CreateSupplierRequest>>();

        operations.MapGet("/tasks", GetTasksAsync)
            .WithName("GetBookingOperationTasksV1")
            .Produces<PagedResponse<OperationTaskResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();

        operations.MapPost("/tasks", CreateTaskAsync)
            .WithName("CreateBookingOperationTaskV1")
            .Produces<OperationTaskResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateOperationTaskRequest>>();

        MapResourceEndpoints<VehicleResponse, CreateVehicleRequest>(
            operations,
            "/vehicles",
            "Vehicle",
            (records, page, size, token) => records.GetVehiclesAsync(page, size, token),
            (records, request, token) => records.CreateVehicleAsync(request, token));
        MapResourceEndpoints<DriverResponse, CreateDriverRequest>(
            operations,
            "/drivers",
            "Driver",
            (records, page, size, token) => records.GetDriversAsync(page, size, token),
            (records, request, token) => records.CreateDriverAsync(request, token));
        MapResourceEndpoints<GuideResponse, CreateGuideRequest>(
            operations,
            "/guides",
            "Guide",
            (records, page, size, token) => records.GetGuidesAsync(page, size, token),
            (records, request, token) => records.CreateGuideAsync(request, token));
        MapResourceEndpoints<ArrivalResponse, CreateArrivalRequest>(
            operations,
            "/arrivals",
            "Arrival",
            (records, page, size, token) => records.GetArrivalsAsync(page, size, token),
            (records, request, token) => records.CreateArrivalAsync(request, token));
        MapResourceEndpoints<BookingResourceAssignmentResponse, CreateBookingResourceAssignmentRequest>(
            operations,
            "/assignments",
            "BookingResourceAssignment",
            (records, page, size, token) => records.GetAssignmentsAsync(page, size, token),
            (records, request, token) => records.CreateAssignmentAsync(request, token));

        return versionGroup;
    }

    private static async Task<IResult> GetSuppliersAsync(
        [AsParameters] CustomerPaginationRequest pagination,
        ISupplierOperationsRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await records.GetSuppliersAsync(
            pagination.PageNumber ?? 1,
            pagination.PageSize ?? 20,
            cancellationToken));

    private static async Task<IResult> CreateSupplierAsync(
        CreateSupplierRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ISupplierOperationsRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var supplier = await records.CreateSupplierAsync(request, cancellationToken);
        await AuditAsync(audit, user, context, "supplier-created", cancellationToken);
        return TypedResults.Created($"/api/v1/operations/suppliers/{supplier.Id}", supplier);
    }

    private static async Task<IResult> GetTasksAsync(
        [AsParameters] CustomerPaginationRequest pagination,
        ISupplierOperationsRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await records.GetTasksAsync(
            pagination.PageNumber ?? 1,
            pagination.PageSize ?? 20,
            cancellationToken));

    private static async Task<IResult> CreateTaskAsync(
        CreateOperationTaskRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        ISupplierOperationsRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var task = await records.CreateTaskAsync(request, cancellationToken);
        await AuditAsync(audit, user, context, "booking-operation-task-created", cancellationToken);
        return TypedResults.Created($"/api/v1/operations/tasks/{task.Id}", task);
    }

    private static void MapResourceEndpoints<TResponse, TRequest>(
        RouteGroupBuilder operations,
        string path,
        string resourceName,
        Func<ISupplierOperationsRecords, int, int, CancellationToken, Task<PagedResponse<TResponse>>> get,
        Func<ISupplierOperationsRecords, TRequest, CancellationToken, Task<TResponse>> create)
        where TRequest : class
    {
        operations.MapGet(path, async (
                [AsParameters] CustomerPaginationRequest pagination,
                ISupplierOperationsRecords records,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await get(
                    records,
                    pagination.PageNumber ?? 1,
                    pagination.PageSize ?? 20,
                    cancellationToken)))
            .WithName($"GetOperation{resourceName}sV1")
            .Produces<PagedResponse<TResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();

        operations.MapPost(path, async (
                TRequest request,
                ClaimsPrincipal user,
                HttpContext context,
                ISupplierOperationsRecords records,
                ISecurityAuditWriter audit,
                CancellationToken cancellationToken) =>
            {
                var response = await create(records, request, cancellationToken);
                await AuditAsync(
                    audit,
                    user,
                    context,
                    $"{ToKebabCase(resourceName)}-created",
                    cancellationToken);
                return TypedResults.Created(path, response);
            })
            .WithName($"CreateOperation{resourceName}V1")
            .Produces<TResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<TRequest>>();
    }

    private static string ToKebabCase(string value) =>
        string.Concat(value.Select((character, index) =>
            index > 0 && char.IsUpper(character)
                ? $"-{char.ToLowerInvariant(character)}"
                : char.ToLowerInvariant(character).ToString()));

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
}
