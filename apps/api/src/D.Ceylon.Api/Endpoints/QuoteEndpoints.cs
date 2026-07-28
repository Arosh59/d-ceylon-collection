using System.Security.Claims;
using D.Ceylon.Api.Infrastructure;
using D.Ceylon.Api.Middleware;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.IdentityAccess.Security;
using D.Ceylon.Modules.Quotes.Contracts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace D.Ceylon.Api.Endpoints;

internal static class QuoteEndpoints
{
    public static RouteGroupBuilder MapQuoteEndpoints(this RouteGroupBuilder versionGroup)
    {
        var customer = versionGroup.MapGroup("/customer/quotes")
            .WithTags("Customer quotes")
            .RequireAuthorization(AccessPolicies.Customer);
        customer.MapGet("/", GetCustomerQuotesAsync)
            .WithName("GetCustomerQuotesV1")
            .Produces<PagedResponse<CustomerQuoteSummaryResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        customer.MapGet("/{quoteId:guid}", GetCustomerQuoteAsync)
            .WithName("GetCustomerQuoteV1")
            .Produces<CustomerQuoteResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        customer.MapPost("/", RequestQuoteAsync)
            .WithName("RequestCustomerQuoteV1")
            .Produces<CustomerQuoteResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<CreateQuoteRequest>>();
        customer.MapPost("/{quoteId:guid}/accept", AcceptQuoteAsync)
            .WithName("AcceptCustomerQuoteV1")
            .Produces<CustomerQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<QuoteTransitionRequest>>();
        customer.MapPost("/{quoteId:guid}/decline", DeclineQuoteAsync)
            .WithName("DeclineCustomerQuoteV1")
            .Produces<CustomerQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<QuoteTransitionRequest>>();
        customer.MapPost("/{quoteId:guid}/withdraw", WithdrawCustomerQuoteAsync)
            .WithName("WithdrawCustomerQuoteV1")
            .Produces<CustomerQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<QuoteConcurrencyRequest>>();

        var agent = versionGroup.MapGroup("/agent/quotes")
            .WithTags("Agent quotes")
            .RequireAuthorization(AccessPolicies.Agent);
        agent.MapGet("/", GetAgentQueueAsync)
            .WithName("GetAgentQuoteQueueV1")
            .Produces<PagedResponse<AgentQuoteQueueResponse>>()
            .ProducesValidationProblem()
            .AddEndpointFilter<ValidationEndpointFilter<CustomerPaginationRequest>>();
        agent.MapGet("/{quoteId:guid}", GetAgentQuoteAsync)
            .WithName("GetAgentQuoteV1")
            .Produces<AgentQuoteResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        agent.MapPost("/{quoteId:guid}/prepare", PrepareAgentQuoteAsync)
            .WithName("PrepareAgentQuoteV1")
            .Produces<AgentQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<PrepareAgentQuoteRequest>>();
        agent.MapPut("/{quoteId:guid}/draft", UpdateAgentQuoteDraftAsync)
            .WithName("UpdateAgentQuoteDraftV1")
            .Produces<AgentQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<UpdateAgentQuoteDraftRequest>>();
        agent.MapPost("/{quoteId:guid}/send", SendAgentQuoteAsync)
            .WithName("SendAgentQuoteV1")
            .Produces<AgentQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<SendQuoteRequest>>();
        agent.MapPost("/{quoteId:guid}/revise", ReviseAgentQuoteAsync)
            .WithName("ReviseAgentQuoteV1")
            .Produces<AgentQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<QuoteConcurrencyRequest>>();
        agent.MapPost("/{quoteId:guid}/withdraw", WithdrawAgentQuoteAsync)
            .WithName("WithdrawAgentQuoteV1")
            .Produces<AgentQuoteResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationEndpointFilter<QuoteConcurrencyRequest>>();
        return versionGroup;
    }

    private static async Task<IResult> GetCustomerQuotesAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        IQuoteRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetCustomerQuotesAsync(
                CustomerId(user),
                request.PageNumber ?? 1,
                request.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> GetCustomerQuoteAsync(
        Guid quoteId,
        ClaimsPrincipal user,
        IQuoteRecords records,
        CancellationToken cancellationToken) =>
        CustomerResult(
            await records.GetCustomerQuoteAsync(
                CustomerId(user), quoteId, cancellationToken));

    private static async Task<IResult> RequestQuoteAsync(
        CreateQuoteRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await records.RequestQuoteAsync(
            CustomerId(user), request, cancellationToken);
        await Audit(
            audit, user, context, "quote-request-created", cancellationToken);
        return TypedResults.Created($"/api/v1/customer/quotes/{response.Id}", response);
    }

    private static Task<IResult> AcceptQuoteAsync(
        Guid quoteId,
        QuoteTransitionRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        CustomerMutation(
            records.AcceptAsync(
                CustomerId(user), quoteId, request, cancellationToken),
            "quote-accepted",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> DeclineQuoteAsync(
        Guid quoteId,
        QuoteTransitionRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        CustomerMutation(
            records.DeclineAsync(
                CustomerId(user), quoteId, request, cancellationToken),
            "quote-declined",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> WithdrawCustomerQuoteAsync(
        Guid quoteId,
        QuoteConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        CustomerMutation(
            records.WithdrawCustomerAsync(
                CustomerId(user),
                quoteId,
                request.ConcurrencyToken,
                cancellationToken),
            "quote-withdrawn-by-customer",
            user,
            context,
            audit,
            cancellationToken);

    private static async Task<IResult> GetAgentQueueAsync(
        [AsParameters] CustomerPaginationRequest request,
        ClaimsPrincipal user,
        IQuoteRecords records,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(
            await records.GetAgentQueueAsync(
                OrganisationId(user),
                request.PageNumber ?? 1,
                request.PageSize ?? 20,
                cancellationToken));

    private static async Task<IResult> GetAgentQuoteAsync(
        Guid quoteId,
        ClaimsPrincipal user,
        IQuoteRecords records,
        CancellationToken cancellationToken) =>
        AgentResult(
            await records.GetAgentQuoteAsync(
                OrganisationId(user), quoteId, cancellationToken));

    private static Task<IResult> PrepareAgentQuoteAsync(
        Guid quoteId,
        PrepareAgentQuoteRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        AgentMutation(
            records.PrepareAsync(
                OrganisationId(user), quoteId, request, cancellationToken),
            "quote-preparation-started",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> UpdateAgentQuoteDraftAsync(
        Guid quoteId,
        UpdateAgentQuoteDraftRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        AgentMutation(
            records.UpdateDraftAsync(
                OrganisationId(user), quoteId, request, cancellationToken),
            "quote-draft-updated",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> SendAgentQuoteAsync(
        Guid quoteId,
        SendQuoteRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        AgentMutation(
            records.SendAsync(
                OrganisationId(user),
                quoteId,
                request,
                Subject(user),
                cancellationToken),
            "quote-version-sent",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> ReviseAgentQuoteAsync(
        Guid quoteId,
        QuoteConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        AgentMutation(
            records.ReviseAsync(
                OrganisationId(user),
                quoteId,
                request.ConcurrencyToken,
                cancellationToken),
            "quote-revision-started",
            user,
            context,
            audit,
            cancellationToken);

    private static Task<IResult> WithdrawAgentQuoteAsync(
        Guid quoteId,
        QuoteConcurrencyRequest request,
        ClaimsPrincipal user,
        HttpContext context,
        IQuoteRecords records,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken) =>
        AgentMutation(
            records.WithdrawAgentAsync(
                OrganisationId(user),
                quoteId,
                request.ConcurrencyToken,
                cancellationToken),
            "quote-withdrawn-by-agent",
            user,
            context,
            audit,
            cancellationToken);

    private static async Task<IResult> CustomerMutation(
        Task<CustomerQuoteResponse?> operation,
        string eventType,
        ClaimsPrincipal user,
        HttpContext context,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await operation;
        if (response is null) return NotFound();
        await Audit(audit, user, context, eventType, cancellationToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> AgentMutation(
        Task<AgentQuoteResponse?> operation,
        string eventType,
        ClaimsPrincipal user,
        HttpContext context,
        ISecurityAuditWriter audit,
        CancellationToken cancellationToken)
    {
        var response = await operation;
        if (response is null) return NotFound();
        await Audit(audit, user, context, eventType, cancellationToken);
        return TypedResults.Ok(response);
    }

    private static Guid CustomerId(ClaimsPrincipal user) =>
        ParseClaim(user, AccessClaimTypes.CustomerId, "customer");

    private static Guid OrganisationId(ClaimsPrincipal user) =>
        ParseClaim(user, AccessClaimTypes.OrganisationId, "organisation");

    private static string Subject(ClaimsPrincipal user) =>
        user.FindFirstValue(AccessClaimTypes.Subject)
        ?? throw new InvalidOperationException("The subject claim is missing.");

    private static Guid ParseClaim(
        ClaimsPrincipal user,
        string claimType,
        string label) =>
        Guid.TryParse(user.FindFirstValue(claimType), out var id)
            ? id
            : throw new InvalidOperationException($"The {label} claim is invalid.");

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

    private static IResult CustomerResult(CustomerQuoteResponse? response) =>
        response is null ? NotFound() : TypedResults.Ok(response);

    private static IResult AgentResult(AgentQuoteResponse? response) =>
        response is null ? NotFound() : TypedResults.Ok(response);

    private static ProblemHttpResult NotFound() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not found",
            detail: "The owner-scoped quote was not found.",
            type: "https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found");
}
