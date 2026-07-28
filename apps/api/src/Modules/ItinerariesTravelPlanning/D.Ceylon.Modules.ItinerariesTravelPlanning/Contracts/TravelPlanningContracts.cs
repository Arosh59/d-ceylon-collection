using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;

public sealed record TravelPlanSummaryResponse(
    Guid Id,
    string Title,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Pace,
    string Status,
    int CurrentRevisionNumber,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record TravelPlanInputResponse(
    IReadOnlyList<string> DestinationSlugs,
    IReadOnlyList<Guid> TravellerIds,
    IReadOnlyList<string> Interests,
    IReadOnlyList<string> ProductTypeSlugs,
    IReadOnlyList<string> CategorySlugs,
    IReadOnlyList<string> TagSlugs,
    string? AccessibilityConsiderations,
    string? DietaryConsiderations);

public sealed record ItineraryItemResponse(
    Guid Id,
    int Position,
    string Title,
    string? Notes,
    int? DurationMinutes,
    string DestinationSlug,
    string? ProductSlug,
    string Source,
    Guid ConcurrencyToken);

public sealed record ItineraryDayResponse(
    Guid Id,
    int DayNumber,
    DateOnly Date,
    string Title,
    Guid ConcurrencyToken,
    IReadOnlyList<ItineraryItemResponse> Items);

public sealed record ItineraryRevisionResponse(
    Guid Id,
    int RevisionNumber,
    string RuleVersion,
    string InputFingerprint,
    DateTimeOffset GeneratedAtUtc,
    IReadOnlyList<ItineraryDayResponse> Days);

public sealed record TravelPlanResponse(
    Guid Id,
    Guid? SavedItineraryId,
    string Title,
    DateOnly TravelStartDate,
    DateOnly TravelEndDate,
    string Pace,
    string Status,
    TravelPlanInputResponse Input,
    ItineraryRevisionResponse CurrentRevision,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public abstract class TravelPlanInput : IValidatableObject
{
    private static readonly HashSet<string> Paces =
        new(["relaxed", "balanced", "active"], StringComparer.Ordinal);

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    public Guid? SavedItineraryId { get; init; }

    public DateOnly TravelStartDate { get; init; }

    public DateOnly TravelEndDate { get; init; }

    [Required]
    public string Pace { get; init; } = "balanced";

    public IReadOnlyList<string> DestinationSlugs { get; init; } = [];

    public IReadOnlyList<Guid> TravellerIds { get; init; } = [];

    public IReadOnlyList<string> Interests { get; init; } = [];

    public IReadOnlyList<string> ProductTypeSlugs { get; init; } = [];

    public IReadOnlyList<string> CategorySlugs { get; init; } = [];

    public IReadOnlyList<string> TagSlugs { get; init; } = [];

    [StringLength(1_000)]
    public string? AccessibilityConsiderations { get; init; }

    [StringLength(1_000)]
    public string? DietaryConsiderations { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TravelStartDate == default || TravelEndDate == default)
        {
            yield return new ValidationResult(
                "Travel start and end dates are required.",
                [nameof(TravelStartDate), nameof(TravelEndDate)]);
        }
        else if (TravelEndDate < TravelStartDate)
        {
            yield return new ValidationResult(
                "Travel end date cannot be before the start date.",
                [nameof(TravelEndDate)]);
        }
        else if (TravelEndDate.DayNumber - TravelStartDate.DayNumber + 1 > 30)
        {
            yield return new ValidationResult(
                "A generated draft can cover at most 30 days.",
                [nameof(TravelEndDate)]);
        }

        if (!Paces.Contains(Pace))
        {
            yield return new ValidationResult(
                "Pace must be relaxed, balanced, or active.",
                [nameof(Pace)]);
        }

        foreach (var error in ValidateSlugs(DestinationSlugs, nameof(DestinationSlugs), 1, 10))
        {
            yield return error;
        }

        foreach (var error in ValidateSlugs(Interests, nameof(Interests), 0, 20))
        {
            yield return error;
        }

        foreach (var error in ValidateSlugs(ProductTypeSlugs, nameof(ProductTypeSlugs), 0, 20))
        {
            yield return error;
        }

        foreach (var error in ValidateSlugs(CategorySlugs, nameof(CategorySlugs), 0, 20))
        {
            yield return error;
        }

        foreach (var error in ValidateSlugs(TagSlugs, nameof(TagSlugs), 0, 20))
        {
            yield return error;
        }

        if (TravellerIds.Count > 20
            || TravellerIds.Any(id => id == Guid.Empty)
            || TravellerIds.Distinct().Count() != TravellerIds.Count)
        {
            yield return new ValidationResult(
                "Traveller associations must contain at most 20 unique identifiers.",
                [nameof(TravellerIds)]);
        }
    }

    private static IEnumerable<ValidationResult> ValidateSlugs(
        IReadOnlyList<string> values,
        string member,
        int minimum,
        int maximum)
    {
        if (values.Count < minimum
            || values.Count > maximum
            || values.Distinct(StringComparer.Ordinal).Count() != values.Count
            || values.Any(value =>
                string.IsNullOrWhiteSpace(value)
                || value.Length > 200
                || !SlugPattern().IsMatch(value)))
        {
            yield return new ValidationResult(
                $"{member} must contain {minimum} to {maximum} unique lowercase slugs.",
                [member]);
        }
    }

    private static System.Text.RegularExpressions.Regex SlugPattern() =>
        new("^[a-z0-9]+(?:-[a-z0-9]+)*$", System.Text.RegularExpressions.RegexOptions.CultureInvariant);
}

public sealed class CreateTravelPlanRequest : TravelPlanInput;

public sealed class UpdateTravelPlanInputRequest : TravelPlanInput
{
    public Guid ConcurrencyToken { get; init; }
}

public sealed class GenerateTravelPlanRequest
{
    public Guid ConcurrencyToken { get; init; }
}

public sealed class UpdateItineraryDayRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    public Guid ConcurrencyToken { get; init; }
}

public class CreateItineraryItemRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    [StringLength(2_000)]
    public string? Notes { get; init; }

    [Range(1, 1_440)]
    public int? DurationMinutes { get; init; }

    [Required]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string DestinationSlug { get; init; } = string.Empty;

    public int? Position { get; init; }
}

public sealed class UpdateItineraryItemRequest : CreateItineraryItemRequest
{
    public Guid ConcurrencyToken { get; init; }
}

public sealed class ReorderItineraryItemRequest
{
    public Guid TargetDayId { get; init; }

    [Range(1, 100)]
    public int Position { get; init; }

    public Guid ConcurrencyToken { get; init; }
}

public interface ITravelPlanRecords
{
    Task<PagedResponse<TravelPlanSummaryResponse>> GetAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> GetAsync(
        Guid customerId,
        Guid planId,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse> CreateAsync(
        Guid customerId,
        CreateTravelPlanRequest request,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> UpdateInputAsync(
        Guid customerId,
        Guid planId,
        UpdateTravelPlanInputRequest request,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> GenerateAsync(
        Guid customerId,
        Guid planId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> UpdateDayAsync(
        Guid customerId,
        Guid planId,
        Guid dayId,
        UpdateItineraryDayRequest request,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> CreateItemAsync(
        Guid customerId,
        Guid planId,
        Guid dayId,
        CreateItineraryItemRequest request,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> UpdateItemAsync(
        Guid customerId,
        Guid planId,
        Guid itemId,
        UpdateItineraryItemRequest request,
        CancellationToken cancellationToken);

    Task<TravelPlanResponse?> ReorderItemAsync(
        Guid customerId,
        Guid planId,
        Guid itemId,
        ReorderItineraryItemRequest request,
        CancellationToken cancellationToken);
}

public sealed class TravelPlanConflictException(string message) : Exception(message);

public sealed class TravelPlanReferenceException(string message) : Exception(message);
