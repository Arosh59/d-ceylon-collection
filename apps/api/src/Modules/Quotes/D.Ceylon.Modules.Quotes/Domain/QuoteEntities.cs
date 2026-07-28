using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Pricing;
using D.Ceylon.Modules.Quotes.Contracts;

namespace D.Ceylon.Modules.Quotes.Domain;

public static class QuoteStatuses
{
    public const string Accepted = "accepted";
    public const string Declined = "declined";
    public const string Draft = "draft";
    public const string Expired = "expired";
    public const string Sent = "sent";
    public const string Withdrawn = "withdrawn";
}

public sealed class QuoteRequest : AuditableEntity
{
    private QuoteRequest()
    {
    }

    public QuoteRequest(
        Guid id,
        Guid customerId,
        Guid travelPlanId,
        Guid itineraryRevisionId,
        int itineraryRevisionNumber,
        string itineraryTitle,
        DateOnly travelStartDate,
        DateOnly travelEndDate,
        string ruleVersion,
        string itineraryFingerprint,
        string? customerNotes)
        : base(id)
    {
        CustomerId = Guard.Id(customerId, nameof(customerId));
        TravelPlanId = Guard.Id(travelPlanId, nameof(travelPlanId));
        ItineraryRevisionId = Guard.Id(itineraryRevisionId, nameof(itineraryRevisionId));
        ItineraryRevisionNumber = itineraryRevisionNumber;
        ItineraryTitle = Guard.Required(itineraryTitle, 200, nameof(itineraryTitle));
        TravelStartDate = travelStartDate;
        TravelEndDate = travelEndDate;
        RuleVersion = Guard.Required(ruleVersion, 100, nameof(ruleVersion));
        ItineraryFingerprint = Guard.Required(
            itineraryFingerprint, 64, nameof(itineraryFingerprint));
        CustomerNotes = Guard.Optional(customerNotes, 2_000, nameof(customerNotes));
    }

    public Guid CustomerId { get; private set; }
    public Guid TravelPlanId { get; private set; }
    public Guid ItineraryRevisionId { get; private set; }
    public int ItineraryRevisionNumber { get; private set; }
    public string ItineraryTitle { get; private set; } = string.Empty;
    public DateOnly TravelStartDate { get; private set; }
    public DateOnly TravelEndDate { get; private set; }
    public string RuleVersion { get; private set; } = string.Empty;
    public string ItineraryFingerprint { get; private set; } = string.Empty;
    public string? CustomerNotes { get; private set; }
    public Quote Quote { get; private set; } = null!;
}

public sealed class Quote : AuditableEntity
{
    private Quote()
    {
    }

    public Quote(Guid id, QuoteRequest request)
        : base(id)
    {
        ArgumentNullException.ThrowIfNull(request);
        RequestId = Guard.Id(request.Id, nameof(request));
        CustomerId = Guard.Id(request.CustomerId, nameof(request));
        Request = request;
        Status = QuoteStatuses.Draft;
    }

    public Guid RequestId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid? OrganisationId { get; private set; }
    public string Status { get; private set; } = string.Empty;
    public string? Currency { get; private set; }
    public string[] DraftAssumptions { get; private set; } = [];
    public string[] DraftInclusions { get; private set; } = [];
    public string[] DraftExclusions { get; private set; } = [];
    public string? DraftTerms { get; private set; }
    public string? InternalNotes { get; private set; }
    public int CurrentVersionNumber { get; private set; }
    public Guid? CurrentVersionId { get; private set; }
    public DateTimeOffset? CurrentExpiresAtUtc { get; private set; }
    public QuoteRequest Request { get; private set; } = null!;
    public ICollection<QuoteDraftLine> DraftLines { get; } = [];
    public ICollection<QuoteDraftPriceComponent> DraftComponents { get; } = [];
    public ICollection<QuoteVersion> Versions { get; } = [];

    public void Prepare(Guid organisationId, string currency)
    {
        if (OrganisationId is not null)
            throw new QuoteConflictException("The quote request is already assigned.");
        RequireStatus(QuoteStatuses.Draft);
        OrganisationId = Guard.Id(organisationId, nameof(organisationId));
        Currency = CurrencyRules.RequireSupported(currency);
    }

    public void ReplaceDraft(UpdateAgentQuoteDraftRequest request)
    {
        RequireAssignedDraft();
        Currency = CurrencyRules.RequireSupported(request.Currency);
        DraftAssumptions = NormalizeList(request.Assumptions);
        DraftInclusions = NormalizeList(request.Inclusions);
        DraftExclusions = NormalizeList(request.Exclusions);
        DraftTerms = Guard.Required(request.Terms, 5_000, nameof(request.Terms));
        InternalNotes = Guard.Optional(
            request.InternalNotes, 2_000, nameof(request.InternalNotes));
        DraftLines.Clear();
        for (var index = 0; index < request.Lines.Count; index++)
        {
            var line = request.Lines[index];
            DraftLines.Add(
                new QuoteDraftLine(
                    Guid.NewGuid(),
                    Id,
                    index + 1,
                    line.Title,
                    line.Description,
                    line.Quantity,
                    line.UnitAmount));
        }

        DraftComponents.Clear();
        for (var index = 0; index < request.Components.Count; index++)
        {
            var component = request.Components[index];
            DraftComponents.Add(
                new QuoteDraftPriceComponent(
                    Guid.NewGuid(),
                    Id,
                    index + 1,
                    component.Kind,
                    component.Label,
                    component.Amount));
        }
    }

    public QuoteVersion Send(
        DateTimeOffset sentAtUtc,
        DateTimeOffset expiresAtUtc,
        string createdBySubject,
        PriceTotals totals)
    {
        RequireAssignedDraft();
        if (DraftLines.Count == 0
            || string.IsNullOrWhiteSpace(Currency)
            || string.IsNullOrWhiteSpace(DraftTerms))
        {
            throw new QuoteTransitionException(
                "Complete the currency, line items, and terms before sending.");
        }

        CurrentVersionNumber++;
        var version = new QuoteVersion(
            Guid.NewGuid(),
            Id,
            CurrentVersionNumber,
            Currency,
            sentAtUtc,
            expiresAtUtc,
            createdBySubject,
            totals,
            DraftAssumptions,
            DraftInclusions,
            DraftExclusions,
            DraftTerms);
        foreach (var line in DraftLines.OrderBy(item => item.Position))
            version.AddLine(line);
        foreach (var component in DraftComponents.OrderBy(item => item.Position))
            version.AddComponent(component);
        Versions.Add(version);
        CurrentVersionId = version.Id;
        CurrentExpiresAtUtc = expiresAtUtc;
        Status = QuoteStatuses.Sent;
        return version;
    }

    public void Revise()
    {
        if (Status is not (QuoteStatuses.Sent or QuoteStatuses.Declined or QuoteStatuses.Expired))
            throw new QuoteTransitionException("Only a sent, declined, or expired quote can be revised.");
        Status = QuoteStatuses.Draft;
        CurrentExpiresAtUtc = null;
    }

    public void Accept(Guid versionId, DateTimeOffset now)
    {
        ExpireIfNeeded(now);
        RequireCurrentSentVersion(versionId);
        Status = QuoteStatuses.Accepted;
    }

    public void Decline(Guid versionId, DateTimeOffset now)
    {
        ExpireIfNeeded(now);
        RequireCurrentSentVersion(versionId);
        Status = QuoteStatuses.Declined;
    }

    public void Withdraw()
    {
        if (Status == QuoteStatuses.Accepted)
            throw new QuoteTransitionException("An accepted quote cannot be withdrawn.");
        if (Status == QuoteStatuses.Withdrawn)
            throw new QuoteTransitionException("The quote is already withdrawn.");
        Status = QuoteStatuses.Withdrawn;
    }

    public bool ExpireIfNeeded(DateTimeOffset now)
    {
        if (Status == QuoteStatuses.Sent && CurrentExpiresAtUtc <= now)
        {
            Status = QuoteStatuses.Expired;
            return true;
        }

        return false;
    }

    private void RequireAssignedDraft()
    {
        RequireStatus(QuoteStatuses.Draft);
        if (OrganisationId is null)
            throw new QuoteTransitionException("An agent organisation must prepare the quote first.");
    }

    private void RequireCurrentSentVersion(Guid versionId)
    {
        RequireStatus(QuoteStatuses.Sent);
        if (versionId == Guid.Empty || CurrentVersionId != versionId)
            throw new QuoteConflictException("The quote version is no longer current.");
    }

    private void RequireStatus(string status)
    {
        if (!string.Equals(Status, status, StringComparison.Ordinal))
        {
            throw new QuoteTransitionException(
                $"The quote cannot be changed while it is {Status}.");
        }
    }

    private static string[] NormalizeList(IReadOnlyList<string> values) =>
        values.Select(value => value.Trim()).ToArray();
}

public sealed class QuoteDraftLine : AuditableEntity
{
    private QuoteDraftLine()
    {
    }

    public QuoteDraftLine(
        Guid id,
        Guid quoteId,
        int position,
        string title,
        string? description,
        decimal quantity,
        decimal unitAmount)
        : base(id)
    {
        QuoteId = Guard.Id(quoteId, nameof(quoteId));
        Position = position;
        Title = Guard.Required(title, 200, nameof(title));
        Description = Guard.Optional(description, 1_000, nameof(description));
        Quantity = quantity;
        UnitAmount = unitAmount;
    }

    public Guid QuoteId { get; private set; }
    public int Position { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Quantity { get; private set; }
    public decimal UnitAmount { get; private set; }
}

public sealed class QuoteDraftPriceComponent : AuditableEntity
{
    private QuoteDraftPriceComponent()
    {
    }

    public QuoteDraftPriceComponent(
        Guid id,
        Guid quoteId,
        int position,
        string kind,
        string label,
        decimal amount)
        : base(id)
    {
        QuoteId = Guard.Id(quoteId, nameof(quoteId));
        Position = position;
        Kind = Guard.Required(kind, 20, nameof(kind)).ToLowerInvariant();
        Label = Guard.Required(label, 200, nameof(label));
        Amount = amount;
    }

    public Guid QuoteId { get; private set; }
    public int Position { get; private set; }
    public string Kind { get; private set; } = string.Empty;
    public string Label { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
}

public sealed class QuoteVersion : AuditableEntity
{
    private QuoteVersion()
    {
    }

    public QuoteVersion(
        Guid id,
        Guid quoteId,
        int versionNumber,
        string currency,
        DateTimeOffset sentAtUtc,
        DateTimeOffset expiresAtUtc,
        string createdBySubject,
        PriceTotals totals,
        IReadOnlyList<string> assumptions,
        IReadOnlyList<string> inclusions,
        IReadOnlyList<string> exclusions,
        string terms)
        : base(id)
    {
        QuoteId = Guard.Id(quoteId, nameof(quoteId));
        VersionNumber = versionNumber;
        Currency = CurrencyRules.RequireSupported(currency);
        SentAtUtc = sentAtUtc;
        ExpiresAtUtc = expiresAtUtc;
        CreatedBySubject = Guard.Required(createdBySubject, 200, nameof(createdBySubject));
        Subtotal = totals.Subtotal;
        TaxTotal = totals.TaxTotal;
        AdjustmentTotal = totals.AdjustmentTotal;
        GrandTotal = totals.GrandTotal;
        Assumptions = assumptions.ToArray();
        Inclusions = inclusions.ToArray();
        Exclusions = exclusions.ToArray();
        Terms = Guard.Required(terms, 5_000, nameof(terms));
    }

    public Guid QuoteId { get; private set; }
    public int VersionNumber { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public DateTimeOffset SentAtUtc { get; private set; }
    public DateTimeOffset ExpiresAtUtc { get; private set; }
    public string CreatedBySubject { get; private set; } = string.Empty;
    public decimal Subtotal { get; private set; }
    public decimal TaxTotal { get; private set; }
    public decimal AdjustmentTotal { get; private set; }
    public decimal GrandTotal { get; private set; }
    public string[] Assumptions { get; private set; } = [];
    public string[] Inclusions { get; private set; } = [];
    public string[] Exclusions { get; private set; } = [];
    public string Terms { get; private set; } = string.Empty;
    public ICollection<QuoteVersionLine> Lines { get; } = [];
    public ICollection<QuoteVersionPriceComponent> Components { get; } = [];

    public void AddLine(QuoteDraftLine source) =>
        Lines.Add(
            new QuoteVersionLine(
                Guid.NewGuid(),
                Id,
                source.Position,
                source.Title,
                source.Description,
                source.Quantity,
                source.UnitAmount,
                PriceCalculator.Round(source.Quantity * source.UnitAmount)));

    public void AddComponent(QuoteDraftPriceComponent source) =>
        Components.Add(
            new QuoteVersionPriceComponent(
                Guid.NewGuid(),
                Id,
                source.Position,
                source.Kind,
                source.Label,
                source.Amount));
}

public sealed class QuoteVersionLine
{
    private QuoteVersionLine()
    {
    }

    public QuoteVersionLine(
        Guid id,
        Guid quoteVersionId,
        int position,
        string title,
        string? description,
        decimal quantity,
        decimal unitAmount,
        decimal lineTotal)
    {
        Id = Guard.Id(id, nameof(id));
        QuoteVersionId = Guard.Id(quoteVersionId, nameof(quoteVersionId));
        Position = position;
        Title = Guard.Required(title, 200, nameof(title));
        Description = Guard.Optional(description, 1_000, nameof(description));
        Quantity = quantity;
        UnitAmount = unitAmount;
        LineTotal = lineTotal;
    }

    public Guid Id { get; private set; }
    public Guid QuoteVersionId { get; private set; }
    public int Position { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Quantity { get; private set; }
    public decimal UnitAmount { get; private set; }
    public decimal LineTotal { get; private set; }
}

public sealed class QuoteVersionPriceComponent
{
    private QuoteVersionPriceComponent()
    {
    }

    public QuoteVersionPriceComponent(
        Guid id,
        Guid quoteVersionId,
        int position,
        string kind,
        string label,
        decimal amount)
    {
        Id = Guard.Id(id, nameof(id));
        QuoteVersionId = Guard.Id(quoteVersionId, nameof(quoteVersionId));
        Position = position;
        Kind = Guard.Required(kind, 20, nameof(kind));
        Label = Guard.Required(label, 200, nameof(label));
        Amount = amount;
    }

    public Guid Id { get; private set; }
    public Guid QuoteVersionId { get; private set; }
    public int Position { get; private set; }
    public string Kind { get; private set; } = string.Empty;
    public string Label { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
}

internal static class Guard
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
}
