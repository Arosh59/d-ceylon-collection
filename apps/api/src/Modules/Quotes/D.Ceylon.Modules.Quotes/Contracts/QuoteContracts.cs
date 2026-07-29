using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Pricing;

namespace D.Ceylon.Modules.Quotes.Contracts;

public sealed record MoneyResponse(decimal Amount, string Currency);

public sealed record QuoteLineResponse(
    Guid Id,
    int Position,
    string Title,
    string? Description,
    decimal Quantity,
    MoneyResponse UnitPrice,
    MoneyResponse LineTotal);

public sealed record QuotePriceComponentResponse(
    Guid Id,
    int Position,
    string Kind,
    string Label,
    MoneyResponse Amount);

public sealed record QuoteVersionResponse(
    Guid Id,
    int VersionNumber,
    DateTimeOffset SentAtUtc,
    DateTimeOffset ExpiresAtUtc,
    string Currency,
    MoneyResponse Subtotal,
    MoneyResponse TaxTotal,
    MoneyResponse AdjustmentTotal,
    MoneyResponse GrandTotal,
    IReadOnlyList<string> Assumptions,
    IReadOnlyList<string> Inclusions,
    IReadOnlyList<string> Exclusions,
    string Terms,
    IReadOnlyList<QuoteLineResponse> Lines,
    IReadOnlyList<QuotePriceComponentResponse> Components);

public sealed record QuoteRequestResponse(
    Guid Id,
    Guid TravelPlanId,
    Guid ItineraryRevisionId,
    int ItineraryRevisionNumber,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string RuleVersion,
    string ItineraryFingerprint,
    string? CustomerNotes,
    DateTimeOffset RequestedAtUtc);

public sealed record CustomerQuoteSummaryResponse(
    Guid Id,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Status,
    int CurrentVersionNumber,
    string? Currency,
    decimal? GrandTotal,
    DateTimeOffset? ExpiresAtUtc,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record CustomerQuoteResponse(
    Guid Id,
    string Status,
    QuoteRequestResponse Request,
    Guid? OrganisationId,
    Guid? CurrentVersionId,
    IReadOnlyList<QuoteVersionResponse> Versions,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

/// <summary>
/// Immutable, accepted-quote snapshot used by the Bookings module. It deliberately contains
/// no Quote persistence types, so a booking cannot observe or modify a quote aggregate.
/// </summary>
public sealed record QuoteBookingLine(
    int Position,
    string Title,
    string? Description,
    decimal Quantity,
    decimal UnitAmount,
    decimal LineTotal);

public sealed record AcceptedQuoteBookingSource(
    Guid QuoteId,
    Guid QuoteVersionId,
    Guid CustomerId,
    Guid? OrganisationId,
    string Currency,
    decimal Subtotal,
    decimal TaxTotal,
    decimal AdjustmentTotal,
    decimal GrandTotal,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    IReadOnlyList<QuoteBookingLine> Lines);

public sealed record AgentQuoteQueueResponse(
    Guid Id,
    string ItineraryTitle,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Status,
    bool IsUnassigned,
    int CurrentVersionNumber,
    string? Currency,
    decimal? GrandTotal,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record AgentQuoteDraftResponse(
    string? Currency,
    IReadOnlyList<string> Assumptions,
    IReadOnlyList<string> Inclusions,
    IReadOnlyList<string> Exclusions,
    string? Terms,
    string? InternalNotes,
    IReadOnlyList<QuoteLineResponse> Lines,
    IReadOnlyList<QuotePriceComponentResponse> Components,
    MoneyResponse? Subtotal,
    MoneyResponse? TaxTotal,
    MoneyResponse? AdjustmentTotal,
    MoneyResponse? GrandTotal);

public sealed record AgentQuoteResponse(
    Guid Id,
    string Status,
    QuoteRequestResponse Request,
    Guid OrganisationId,
    AgentQuoteDraftResponse Draft,
    Guid? CurrentVersionId,
    IReadOnlyList<QuoteVersionResponse> Versions,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed class CreateQuoteRequest : IValidatableObject
{
    public Guid TravelPlanId { get; init; }

    public Guid ItineraryRevisionId { get; init; }

    [StringLength(2_000)]
    public string? CustomerNotes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TravelPlanId == Guid.Empty)
        {
            yield return new ValidationResult(
                "A travel plan is required.",
                [nameof(TravelPlanId)]);
        }

        if (ItineraryRevisionId == Guid.Empty)
        {
            yield return new ValidationResult(
                "An itinerary revision is required.",
                [nameof(ItineraryRevisionId)]);
        }
    }
}

public sealed class PrepareAgentQuoteRequest : IValidatableObject
{
    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; init; } = string.Empty;

    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
        {
            yield return new ValidationResult(
                "A concurrency token is required.",
                [nameof(ConcurrencyToken)]);
        }

        var currencyError = QuoteValidation.Currency(Currency);
        if (currencyError is not null)
        {
            yield return currencyError;
        }
    }
}

public sealed class QuoteLineInput
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    [StringLength(1_000)]
    public string? Description { get; init; }

    public decimal Quantity { get; init; }

    public decimal UnitAmount { get; init; }
}

public sealed class QuotePriceComponentInput
{
    [Required]
    [StringLength(20, MinimumLength = 1)]
    public string Kind { get; init; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Label { get; init; } = string.Empty;

    public decimal Amount { get; init; }
}

public sealed class UpdateAgentQuoteDraftRequest : IValidatableObject
{
    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; init; } = string.Empty;

    public IReadOnlyList<string> Assumptions { get; init; } = [];

    public IReadOnlyList<string> Inclusions { get; init; } = [];

    public IReadOnlyList<string> Exclusions { get; init; } = [];

    [Required]
    [StringLength(5_000, MinimumLength = 1)]
    public string Terms { get; init; } = string.Empty;

    [StringLength(2_000)]
    public string? InternalNotes { get; init; }

    public IReadOnlyList<QuoteLineInput> Lines { get; init; } = [];

    public IReadOnlyList<QuotePriceComponentInput> Components { get; init; } = [];

    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
        {
            yield return new ValidationResult(
                "A concurrency token is required.",
                [nameof(ConcurrencyToken)]);
        }

        var currencyError = QuoteValidation.Currency(Currency);
        if (currencyError is not null)
        {
            yield return currencyError;
        }

        foreach (var result in ValidateTextList(Assumptions, nameof(Assumptions)))
            yield return result;
        foreach (var result in ValidateTextList(Inclusions, nameof(Inclusions)))
            yield return result;
        foreach (var result in ValidateTextList(Exclusions, nameof(Exclusions)))
            yield return result;

        if (Lines.Count is < 1 or > 100)
        {
            yield return new ValidationResult(
                "A quote requires 1 to 100 line items.",
                [nameof(Lines)]);
        }

        for (var index = 0; index < Lines.Count; index++)
        {
            var line = Lines[index];
            if (string.IsNullOrWhiteSpace(line.Title)
                || line.Title.Length > 200
                || line.Description?.Length > 1_000
                || line.Quantity is <= 0 or > 1_000
                || line.UnitAmount is < 0 or > PriceCalculator.MaximumAmount
                || line.UnitAmount != PriceCalculator.Round(line.UnitAmount))
            {
                yield return new ValidationResult(
                    $"Line item {index + 1} is invalid.",
                    [nameof(Lines)]);
            }
        }

        if (Components.Count > 50)
        {
            yield return new ValidationResult(
                "A quote supports at most 50 price components.",
                [nameof(Components)]);
        }

        for (var index = 0; index < Components.Count; index++)
        {
            var component = Components[index];
            var kind = component.Kind.Trim().ToLowerInvariant();
            if (kind is not ("tax" or "adjustment")
                || string.IsNullOrWhiteSpace(component.Label)
                || component.Label.Length > 200
                || component.Amount < (kind == "adjustment"
                    ? -PriceCalculator.MaximumAmount
                    : 0)
                || component.Amount > PriceCalculator.MaximumAmount
                || component.Amount != PriceCalculator.Round(component.Amount))
            {
                yield return new ValidationResult(
                    $"Price component {index + 1} is invalid.",
                    [nameof(Components)]);
            }
        }
    }

    private static IEnumerable<ValidationResult> ValidateTextList(
        IReadOnlyList<string> values,
        string member)
    {
        if (values.Count > 20
            || values.Any(value => string.IsNullOrWhiteSpace(value) || value.Length > 500))
        {
            yield return new ValidationResult(
                $"{member} supports at most 20 non-empty entries of 500 characters.",
                [member]);
        }
    }
}

public sealed class SendQuoteRequest : IValidatableObject
{
    public DateTimeOffset ExpiresAtUtc { get; init; }

    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
        {
            yield return new ValidationResult(
                "A concurrency token is required.",
                [nameof(ConcurrencyToken)]);
        }

        if (ExpiresAtUtc == default)
        {
            yield return new ValidationResult(
                "An expiry timestamp is required.",
                [nameof(ExpiresAtUtc)]);
        }
    }
}

public sealed class QuoteTransitionRequest : IValidatableObject
{
    public Guid VersionId { get; init; }

    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (VersionId == Guid.Empty)
        {
            yield return new ValidationResult(
                "A quote version is required.",
                [nameof(VersionId)]);
        }

        if (ConcurrencyToken == Guid.Empty)
        {
            yield return new ValidationResult(
                "A concurrency token is required.",
                [nameof(ConcurrencyToken)]);
        }
    }
}

public sealed class QuoteConcurrencyRequest : IValidatableObject
{
    public Guid ConcurrencyToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConcurrencyToken == Guid.Empty)
        {
            yield return new ValidationResult(
                "A concurrency token is required.",
                [nameof(ConcurrencyToken)]);
        }
    }
}

public interface IQuoteRecords
{
    Task<PagedResponse<CustomerQuoteSummaryResponse>> GetCustomerQuotesAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<CustomerQuoteResponse?> GetCustomerQuoteAsync(
        Guid customerId,
        Guid quoteId,
        CancellationToken cancellationToken);

    Task<CustomerQuoteResponse> RequestQuoteAsync(
        Guid customerId,
        CreateQuoteRequest request,
        CancellationToken cancellationToken);

    Task<CustomerQuoteResponse?> AcceptAsync(
        Guid customerId,
        Guid quoteId,
        QuoteTransitionRequest request,
        CancellationToken cancellationToken);

    Task<CustomerQuoteResponse?> DeclineAsync(
        Guid customerId,
        Guid quoteId,
        QuoteTransitionRequest request,
        CancellationToken cancellationToken);

    Task<CustomerQuoteResponse?> WithdrawCustomerAsync(
        Guid customerId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<PagedResponse<AgentQuoteQueueResponse>> GetAgentQueueAsync(
        Guid organisationId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> GetAgentQuoteAsync(
        Guid organisationId,
        Guid quoteId,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> PrepareAsync(
        Guid organisationId,
        Guid quoteId,
        PrepareAgentQuoteRequest request,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> UpdateDraftAsync(
        Guid organisationId,
        Guid quoteId,
        UpdateAgentQuoteDraftRequest request,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> SendAsync(
        Guid organisationId,
        Guid quoteId,
        SendQuoteRequest request,
        string subject,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> ReviseAsync(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<AgentQuoteResponse?> WithdrawAgentAsync(
        Guid organisationId,
        Guid quoteId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);
}

public interface IQuoteBookingSources
{
    Task<AcceptedQuoteBookingSource?> GetAcceptedQuoteAsync(
        Guid customerId,
        Guid quoteId,
        Guid quoteVersionId,
        CancellationToken cancellationToken);
}

public sealed class QuoteConflictException(string message) : Exception(message);

public sealed class QuoteReferenceException(string message) : Exception(message);

public sealed class QuoteTransitionException(string message) : Exception(message);

internal static class QuoteValidation
{
    public static ValidationResult? Currency(string currency)
    {
        try
        {
            CurrencyRules.RequireSupported(currency);
            return null;
        }
        catch (PricingValidationException exception)
        {
            return new ValidationResult(exception.Message, ["currency"]);
        }
    }
}
