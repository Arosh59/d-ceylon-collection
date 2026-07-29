using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using D.Ceylon.Modules.OrganisationsAgents.Contracts;
using D.Ceylon.Modules.Pricing;
using D.Ceylon.Modules.Quotes.Contracts;
using D.Ceylon.Modules.Quotes.Domain;
using D.Ceylon.Modules.Quotes.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Quotes.Application;

internal sealed class QuoteRecords(
    QuotesDbContext database,
    ITravelPlanRecords travelPlans,
    IOrganisationRecords organisations,
    IPriceCalculator calculator,
    TimeProvider timeProvider)
    : IQuoteRecords, IQuoteBookingSources
{
    public async Task<AcceptedQuoteBookingSource?> GetAcceptedQuoteAsync(
        Guid customerId,
        Guid quoteId,
        Guid quoteVersionId,
        CancellationToken cancellationToken)
    {
        var quote = await database.Quotes.AsNoTracking()
            .Where(candidate => candidate.CustomerId == customerId
                && candidate.Id == quoteId
                && candidate.Status == QuoteStatuses.Accepted
                && candidate.CurrentVersionId == quoteVersionId)
            .Include(candidate => candidate.Request)
            .Include(candidate => candidate.Versions)
                .ThenInclude(version => version.Lines)
            .AsSplitQuery()
            .SingleOrDefaultAsync(cancellationToken);
        var version = quote?.Versions.SingleOrDefault(candidate => candidate.Id == quoteVersionId);
        return quote is null || version is null
            ? null
            : new AcceptedQuoteBookingSource(
                quote.Id,
                version.Id,
                quote.CustomerId,
                quote.OrganisationId,
                version.Currency,
                version.Subtotal,
                version.TaxTotal,
                version.AdjustmentTotal,
                version.GrandTotal,
                quote.Request.ItineraryTitle,
                quote.Request.TravelStartDate,
                quote.Request.TravelEndDate,
                version.Lines.OrderBy(line => line.Position)
                    .Select(line => new QuoteBookingLine(
                        line.Position,
                        line.Title,
                        line.Description,
                        line.Quantity,
                        line.UnitAmount,
                        line.LineTotal))
                    .ToArray());
    }

    public async Task<PagedResponse<CustomerQuoteSummaryResponse>> GetCustomerQuotesAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await ExpireAsync(
            quote => quote.CustomerId == customerId,
            cancellationToken);
        var query = database.Quotes.AsNoTracking()
            .Where(quote => quote.CustomerId == customerId)
            .Include(quote => quote.Request)
            .Include(quote => quote.Versions);
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(quote => quote.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
        return PagedResponse.Create(
            entities.Select(ToCustomerSummary).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<CustomerQuoteResponse?> GetCustomerQuoteAsync(
        Guid customerId,
        Guid quoteId,
        CancellationToken cancellationToken)
    {
        var quote = await CustomerQuote(customerId, quoteId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (quote is null) return null;
        if (quote.ExpireIfNeeded(timeProvider.GetUtcNow()))
            await database.SaveChangesAsync(cancellationToken);
        return ToCustomerResponse(quote);
    }

    public async Task<CustomerQuoteResponse> RequestQuoteAsync(
        Guid customerId,
        CreateQuoteRequest request,
        CancellationToken cancellationToken)
    {
        if (request.TravelPlanId == Guid.Empty || request.ItineraryRevisionId == Guid.Empty)
            throw new QuoteReferenceException("A reviewed itinerary revision is required.");
        var source = await travelPlans.GetQuoteSourceAsync(
            customerId,
            request.TravelPlanId,
            request.ItineraryRevisionId,
            cancellationToken);
        if (source is null)
            throw new QuoteReferenceException("The reviewed current itinerary draft was not found.");
        if (await database.QuoteRequests.AnyAsync(
                candidate =>
                    candidate.CustomerId == customerId
                    && candidate.ItineraryRevisionId == source.ItineraryRevisionId,
                cancellationToken))
        {
            throw new QuoteConflictException(
                "A quote has already been requested for this itinerary revision.");
        }

        var quoteRequest = new QuoteRequest(
            Guid.NewGuid(),
            customerId,
            source.TravelPlanId,
            source.ItineraryRevisionId,
            source.RevisionNumber,
            source.Title,
            source.TravelStartDate,
            source.TravelEndDate,
            source.RuleVersion,
            source.InputFingerprint,
            request.CustomerNotes);
        var quote = new Quote(Guid.NewGuid(), quoteRequest);
        database.QuoteRequests.Add(quoteRequest);
        database.Quotes.Add(quote);
        await database.SaveChangesAsync(cancellationToken);
        return ToCustomerResponse(quote);
    }

    public Task<CustomerQuoteResponse?> AcceptAsync(
        Guid customerId,
        Guid quoteId,
        QuoteTransitionRequest request,
        CancellationToken cancellationToken) =>
        CustomerTransitionAsync(
            customerId,
            quoteId,
            request.ConcurrencyToken,
            quote => quote.Accept(request.VersionId, timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<CustomerQuoteResponse?> DeclineAsync(
        Guid customerId,
        Guid quoteId,
        QuoteTransitionRequest request,
        CancellationToken cancellationToken) =>
        CustomerTransitionAsync(
            customerId,
            quoteId,
            request.ConcurrencyToken,
            quote => quote.Decline(request.VersionId, timeProvider.GetUtcNow()),
            cancellationToken);

    public Task<CustomerQuoteResponse?> WithdrawCustomerAsync(
        Guid customerId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken) =>
        CustomerTransitionAsync(
            customerId,
            quoteId,
            concurrencyToken,
            quote => quote.Withdraw(),
            cancellationToken);

    public async Task<PagedResponse<AgentQuoteQueueResponse>> GetAgentQueueAsync(
        Guid organisationId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await RequireActiveOrganisation(organisationId, cancellationToken);
        await ExpireAsync(
            quote => quote.OrganisationId == organisationId,
            cancellationToken);
        var query = database.Quotes.AsNoTracking()
            .Where(quote =>
                quote.OrganisationId == null || quote.OrganisationId == organisationId)
            .Include(quote => quote.Request)
            .Include(quote => quote.Versions);
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderBy(quote => quote.OrganisationId == null ? 0 : 1)
            .ThenByDescending(quote => quote.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
        return PagedResponse.Create(
            entities.Select(ToAgentQueue).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<AgentQuoteResponse?> GetAgentQuoteAsync(
        Guid organisationId,
        Guid quoteId,
        CancellationToken cancellationToken)
    {
        await RequireActiveOrganisation(organisationId, cancellationToken);
        var quote = await AgentQuote(organisationId, quoteId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (quote is null) return null;
        if (quote.ExpireIfNeeded(timeProvider.GetUtcNow()))
            await database.SaveChangesAsync(cancellationToken);
        return ToAgentResponse(quote);
    }

    public async Task<AgentQuoteResponse?> PrepareAsync(
        Guid organisationId,
        Guid quoteId,
        PrepareAgentQuoteRequest request,
        CancellationToken cancellationToken)
    {
        await RequireActiveOrganisation(organisationId, cancellationToken);
        var quote = await FullQuote(tracking: true)
            .Where(candidate =>
                candidate.Id == quoteId
                && (candidate.OrganisationId == null
                    || candidate.OrganisationId == organisationId))
            .SingleOrDefaultAsync(cancellationToken);
        if (quote is null) return null;
        RequireVersion(quote, request.ConcurrencyToken);
        quote.Prepare(organisationId, request.Currency);
        await database.SaveChangesAsync(cancellationToken);
        return ToAgentResponse(quote);
    }

    public async Task<AgentQuoteResponse?> UpdateDraftAsync(
        Guid organisationId,
        Guid quoteId,
        UpdateAgentQuoteDraftRequest request,
        CancellationToken cancellationToken)
    {
        var quote = await OwnedAgentQuote(
            organisationId, quoteId, request.ConcurrencyToken, cancellationToken);
        if (quote is null) return null;
        _ = calculator.Calculate(
            request.Lines.Select(line =>
                new PriceLineInput(line.Quantity, line.UnitAmount)).ToArray(),
            request.Components.Select(component =>
                new PriceComponentInput(component.Kind, component.Amount)).ToArray());
        quote.ReplaceDraft(request);
        await database.SaveChangesAsync(cancellationToken);
        return ToAgentResponse(quote);
    }

    public async Task<AgentQuoteResponse?> SendAsync(
        Guid organisationId,
        Guid quoteId,
        SendQuoteRequest request,
        string subject,
        CancellationToken cancellationToken)
    {
        var quote = await OwnedAgentQuote(
            organisationId, quoteId, request.ConcurrencyToken, cancellationToken);
        if (quote is null) return null;
        var now = timeProvider.GetUtcNow();
        if (request.ExpiresAtUtc <= now || request.ExpiresAtUtc > now.AddDays(180))
        {
            throw new QuoteTransitionException(
                "Quote expiry must be in the future and no more than 180 days away.");
        }

        var totals = DraftTotals(quote);
        quote.Send(now, request.ExpiresAtUtc, subject, totals);
        await database.SaveChangesAsync(cancellationToken);
        return ToAgentResponse(quote);
    }

    public Task<AgentQuoteResponse?> ReviseAsync(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken) =>
        AgentTransitionAsync(
            organisationId,
            quoteId,
            concurrencyToken,
            quote => quote.Revise(),
            cancellationToken);

    public Task<AgentQuoteResponse?> WithdrawAgentAsync(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken) =>
        AgentTransitionAsync(
            organisationId,
            quoteId,
            concurrencyToken,
            quote => quote.Withdraw(),
            cancellationToken);

    private async Task<CustomerQuoteResponse?> CustomerTransitionAsync(
        Guid customerId,
        Guid quoteId,
        Guid concurrencyToken,
        Action<Quote> transition,
        CancellationToken cancellationToken)
    {
        var quote = await CustomerQuote(customerId, quoteId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (quote is null) return null;
        RequireVersion(quote, concurrencyToken);
        transition(quote);
        await database.SaveChangesAsync(cancellationToken);
        return ToCustomerResponse(quote);
    }

    private async Task<AgentQuoteResponse?> AgentTransitionAsync(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        Action<Quote> transition,
        CancellationToken cancellationToken)
    {
        var quote = await OwnedAgentQuote(
            organisationId, quoteId, concurrencyToken, cancellationToken);
        if (quote is null) return null;
        transition(quote);
        await database.SaveChangesAsync(cancellationToken);
        return ToAgentResponse(quote);
    }

    private async Task<Quote?> OwnedAgentQuote(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        await RequireActiveOrganisation(organisationId, cancellationToken);
        var quote = await AgentQuote(organisationId, quoteId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (quote is not null) RequireVersion(quote, concurrencyToken);
        return quote;
    }

    private async Task RequireActiveOrganisation(
        Guid organisationId,
        CancellationToken cancellationToken)
    {
        if (organisationId == Guid.Empty
            || !await organisations.IsActiveAsync(organisationId, cancellationToken))
        {
            throw new QuoteReferenceException("The active agent organisation was not found.");
        }
    }

    private async Task ExpireAsync(
        System.Linq.Expressions.Expression<Func<Quote, bool>> scope,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var expired = await database.Quotes
            .Where(scope)
            .Where(quote =>
                quote.Status == QuoteStatuses.Sent
                && quote.CurrentExpiresAtUtc <= now)
            .ToListAsync(cancellationToken);
        foreach (var quote in expired) quote.ExpireIfNeeded(now);
        if (expired.Count > 0) await database.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Quote> CustomerQuote(Guid customerId, Guid quoteId, bool tracking)
    {
        var query = FullQuote(tracking)
            .Where(quote => quote.CustomerId == customerId && quote.Id == quoteId);
        return query;
    }

    private IQueryable<Quote> AgentQuote(Guid organisationId, Guid quoteId, bool tracking) =>
        FullQuote(tracking)
            .Where(quote => quote.OrganisationId == organisationId && quote.Id == quoteId);

    private IQueryable<Quote> FullQuote(bool tracking)
    {
        var query = database.Quotes
            .Include(quote => quote.Request)
            .Include(quote => quote.DraftLines)
            .Include(quote => quote.DraftComponents)
            .Include(quote => quote.Versions)
                .ThenInclude(version => version.Lines)
            .Include(quote => quote.Versions)
                .ThenInclude(version => version.Components)
            .AsSplitQuery();
        return tracking ? query : query.AsNoTracking();
    }

    private PriceTotals DraftTotals(Quote quote) =>
        calculator.Calculate(
            quote.DraftLines.OrderBy(line => line.Position)
                .Select(line => new PriceLineInput(line.Quantity, line.UnitAmount))
                .ToArray(),
            quote.DraftComponents.OrderBy(component => component.Position)
                .Select(component => new PriceComponentInput(component.Kind, component.Amount))
                .ToArray());

    private static void RequireVersion(AuditableEntity entity, Guid supplied)
    {
        if (supplied == Guid.Empty || entity.ConcurrencyToken != supplied)
            throw new QuoteConflictException("The quote changed. Reload and retry.");
    }

    private static CustomerQuoteSummaryResponse ToCustomerSummary(Quote quote)
    {
        var current = CurrentVersion(quote);
        return new(
            quote.Id,
            quote.Request.ItineraryTitle,
            quote.Request.TravelStartDate,
            quote.Request.TravelEndDate,
            quote.Status,
            quote.CurrentVersionNumber,
            current?.Currency,
            current?.GrandTotal,
            current?.ExpiresAtUtc,
            quote.ConcurrencyToken,
            quote.UpdatedAtUtc);
    }

    private AgentQuoteQueueResponse ToAgentQueue(Quote quote)
    {
        var current = CurrentVersion(quote);
        return new(
            quote.Id,
            quote.Request.ItineraryTitle,
            quote.Request.TravelStartDate,
            quote.Request.TravelEndDate,
            quote.Status,
            quote.OrganisationId is null,
            quote.CurrentVersionNumber,
            current?.Currency,
            current?.GrandTotal,
            quote.ConcurrencyToken,
            quote.UpdatedAtUtc);
    }

    private static CustomerQuoteResponse ToCustomerResponse(Quote quote) =>
        new(
            quote.Id,
            quote.Status,
            ToRequest(quote.Request),
            quote.OrganisationId,
            quote.CurrentVersionId,
            quote.Versions.OrderBy(version => version.VersionNumber)
                .Select(ToVersion)
                .ToArray(),
            quote.ConcurrencyToken,
            quote.CreatedAtUtc,
            quote.UpdatedAtUtc);

    private AgentQuoteResponse ToAgentResponse(Quote quote)
    {
        var totals = quote.DraftLines.Count == 0 ? null : DraftTotals(quote);
        var currency = quote.Currency;
        MoneyResponse? Money(decimal? value) =>
            value is null || currency is null ? null : new(value.Value, currency);
        return new(
            quote.Id,
            quote.Status,
            ToRequest(quote.Request),
            quote.OrganisationId
                ?? throw new InvalidOperationException("The quote is not assigned."),
            new AgentQuoteDraftResponse(
                currency,
                quote.DraftAssumptions,
                quote.DraftInclusions,
                quote.DraftExclusions,
                quote.DraftTerms,
                quote.InternalNotes,
                quote.DraftLines.OrderBy(line => line.Position)
                    .Select(line => ToLine(
                        line.Id,
                        line.Position,
                        line.Title,
                        line.Description,
                        line.Quantity,
                        line.UnitAmount,
                        PriceCalculator.Round(line.Quantity * line.UnitAmount),
                        currency ?? "USD"))
                    .ToArray(),
                quote.DraftComponents.OrderBy(component => component.Position)
                    .Select(component => ToComponent(
                        component.Id,
                        component.Position,
                        component.Kind,
                        component.Label,
                        component.Amount,
                        currency ?? "USD"))
                    .ToArray(),
                Money(totals?.Subtotal),
                Money(totals?.TaxTotal),
                Money(totals?.AdjustmentTotal),
                Money(totals?.GrandTotal)),
            quote.CurrentVersionId,
            quote.Versions.OrderBy(version => version.VersionNumber)
                .Select(ToVersion)
                .ToArray(),
            quote.ConcurrencyToken,
            quote.CreatedAtUtc,
            quote.UpdatedAtUtc);
    }

    private static QuoteRequestResponse ToRequest(QuoteRequest request) =>
        new(
            request.Id,
            request.TravelPlanId,
            request.ItineraryRevisionId,
            request.ItineraryRevisionNumber,
            request.ItineraryTitle,
            request.TravelStartDate,
            request.TravelEndDate,
            request.RuleVersion,
            request.ItineraryFingerprint,
            request.CustomerNotes,
            request.CreatedAtUtc);

    private static QuoteVersionResponse ToVersion(QuoteVersion version) =>
        new(
            version.Id,
            version.VersionNumber,
            version.SentAtUtc,
            version.ExpiresAtUtc,
            version.Currency,
            new(version.Subtotal, version.Currency),
            new(version.TaxTotal, version.Currency),
            new(version.AdjustmentTotal, version.Currency),
            new(version.GrandTotal, version.Currency),
            version.Assumptions,
            version.Inclusions,
            version.Exclusions,
            version.Terms,
            version.Lines.OrderBy(line => line.Position)
                .Select(line => ToLine(
                    line.Id,
                    line.Position,
                    line.Title,
                    line.Description,
                    line.Quantity,
                    line.UnitAmount,
                    line.LineTotal,
                    version.Currency))
                .ToArray(),
            version.Components.OrderBy(component => component.Position)
                .Select(component => ToComponent(
                    component.Id,
                    component.Position,
                    component.Kind,
                    component.Label,
                    component.Amount,
                    version.Currency))
                .ToArray());

    private static QuoteLineResponse ToLine(
        Guid id,
        int position,
        string title,
        string? description,
        decimal quantity,
        decimal unitAmount,
        decimal lineTotal,
        string currency) =>
        new(
            id,
            position,
            title,
            description,
            quantity,
            new(unitAmount, currency),
            new(lineTotal, currency));

    private static QuotePriceComponentResponse ToComponent(
        Guid id,
        int position,
        string kind,
        string label,
        decimal amount,
        string currency) =>
        new(id, position, kind, label, new(amount, currency));

    private static QuoteVersion? CurrentVersion(Quote quote) =>
        quote.CurrentVersionId is { } id
            ? quote.Versions.SingleOrDefault(version => version.Id == id)
            : null;
}
