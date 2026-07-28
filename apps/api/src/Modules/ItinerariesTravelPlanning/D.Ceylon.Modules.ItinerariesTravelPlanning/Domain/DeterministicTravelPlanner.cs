using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using D.Ceylon.Modules.Catalogue.Contracts;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;

public sealed record PlannerInput(
    DateOnly StartDate,
    DateOnly EndDate,
    string Pace,
    IReadOnlyList<string> Destinations,
    IReadOnlyList<Guid> TravellerIds,
    IReadOnlyList<string> Interests,
    IReadOnlyList<string> ProductTypes,
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> Tags,
    string? Accessibility,
    string? Dietary);

public sealed record PlannedItem(
    Guid Id,
    int Position,
    string Title,
    string? Notes,
    int? DurationMinutes,
    string DestinationSlug,
    string? ProductSlug,
    string Source);

public sealed record PlannedDay(
    Guid Id,
    int DayNumber,
    DateOnly Date,
    string Title,
    IReadOnlyList<PlannedItem> Items);

public sealed record PlannedDraft(
    string RuleVersion,
    string InputFingerprint,
    IReadOnlyList<PlannedDay> Days);

public interface IDeterministicTravelPlanner
{
    PlannedDraft Generate(PlannerInput input, IReadOnlyList<PlanningCatalogueItem> catalogue);
}

public sealed class DeterministicTravelPlanner : IDeterministicTravelPlanner
{
    public const string RuleVersion = "dceylon-deterministic-v1";

    public PlannedDraft Generate(
        PlannerInput input,
        IReadOnlyList<PlanningCatalogueItem> catalogue)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(catalogue);
        var fingerprint = Fingerprint(input, catalogue);
        var capacity = input.Pace switch
        {
            "relaxed" => 1,
            "active" => 3,
            _ => 2,
        };
        var used = new HashSet<string>(StringComparer.Ordinal);
        var days = new List<PlannedDay>();
        var dayCount = input.EndDate.DayNumber - input.StartDate.DayNumber + 1;

        for (var index = 0; index < dayCount; index++)
        {
            var dayNumber = index + 1;
            var destination = input.Destinations[index % input.Destinations.Count];
            var candidates = catalogue
                .Where(item => item.DestinationSlugs.Contains(destination, StringComparer.Ordinal))
                .Where(item => !used.Contains(item.ProductSlug))
                .OrderByDescending(item => Score(item, input))
                .ThenBy(item => item.ProductSlug, StringComparer.Ordinal)
                .Take(capacity)
                .ToArray();
            var items = candidates
                .Select((item, itemIndex) =>
                {
                    used.Add(item.ProductSlug);
                    return new PlannedItem(
                        StableId($"{fingerprint}:day:{dayNumber}:item:{item.ProductSlug}"),
                        itemIndex + 1,
                        item.Name,
                        "Selected by explicit catalogue preference and ordering rules.",
                        item.DurationMinutes,
                        destination,
                        item.ProductSlug,
                        "catalogue");
                })
                .ToArray();
            days.Add(
                new PlannedDay(
                    StableId($"{fingerprint}:day:{dayNumber}"),
                    dayNumber,
                    input.StartDate.AddDays(index),
                    $"Day {dayNumber} · {destination.Replace('-', ' ')}",
                    items));
        }

        return new PlannedDraft(RuleVersion, fingerprint, days);
    }

    public static Guid StableId(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return new Guid(bytes.AsSpan(0, 16));
    }

    private static int Score(PlanningCatalogueItem item, PlannerInput input) =>
        item.ProductTypeSlugs.Intersect(input.ProductTypes, StringComparer.Ordinal).Count() * 8
        + item.CategorySlugs.Intersect(input.Categories, StringComparer.Ordinal).Count() * 6
        + item.TagSlugs.Intersect(input.Tags, StringComparer.Ordinal).Count() * 4
        + item.CategorySlugs.Intersect(input.Interests, StringComparer.Ordinal).Count() * 2
        + item.TagSlugs.Intersect(input.Interests, StringComparer.Ordinal).Count() * 2;

    private static string Fingerprint(
        PlannerInput input,
        IReadOnlyList<PlanningCatalogueItem> catalogue)
    {
        var canonical = JsonSerializer.Serialize(
            new
            {
                ruleVersion = RuleVersion,
                startDate = input.StartDate,
                endDate = input.EndDate,
                input.Pace,
                destinations = input.Destinations,
                travellers = input.TravellerIds.Select(value => value.ToString("D")),
                interests = input.Interests.Order(StringComparer.Ordinal),
                productTypes = input.ProductTypes.Order(StringComparer.Ordinal),
                categories = input.Categories.Order(StringComparer.Ordinal),
                tags = input.Tags.Order(StringComparer.Ordinal),
                accessibility = input.Accessibility?.Trim(),
                dietary = input.Dietary?.Trim(),
                catalogueSnapshot = catalogue
                    .OrderBy(item => item.ProductSlug, StringComparer.Ordinal)
                    .Select(item => new
                    {
                        item.ProductSlug,
                        item.Name,
                        item.DurationMinutes,
                        productTypes = item.ProductTypeSlugs.Order(StringComparer.Ordinal),
                        categories = item.CategorySlugs.Order(StringComparer.Ordinal),
                        destinations = item.DestinationSlugs.Order(StringComparer.Ordinal),
                        tags = item.TagSlugs.Order(StringComparer.Ordinal),
                    }),
            });
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)))
            .ToLowerInvariant();
    }
}
