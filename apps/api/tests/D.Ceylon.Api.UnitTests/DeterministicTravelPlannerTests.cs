using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class DeterministicTravelPlannerTests
{
    [Fact]
    public void SameCanonicalInputAndRuleProduceTheSameDraft()
    {
        var planner = new DeterministicTravelPlanner();
        var input = Input();
        PlanningCatalogueItem[] catalogue =
        [
            new(
                "tea-country-rail-estate-walk", "Tea country walk", 180,
                ["experience"], ["nature"], ["ella"], ["slow-travel"]),
            new(
                "ella-ridge-morning", "Ella ridge morning", 120,
                ["experience"], ["nature"], ["ella"], ["walking"]),
        ];

        var first = planner.Generate(input, catalogue);
        var second = planner.Generate(input, catalogue);

        Assert.Equal(DeterministicTravelPlanner.RuleVersion, first.RuleVersion);
        Assert.Equal(JsonSerializer.Serialize(first), JsonSerializer.Serialize(second));
        Assert.Equal(3, first.Days.Count);
        Assert.All(first.Days, day => Assert.True(day.Items.Count <= 2));
        Assert.Equal("tea-country-rail-estate-walk", first.Days[0].Items[0].ProductSlug);
    }

    [Fact]
    public void RuleMetadataAndPaceHaveReviewableEffects()
    {
        var planner = new DeterministicTravelPlanner();
        var relaxed = Input() with { Pace = "relaxed" };
        var active = Input() with { Pace = "active" };
        var catalogue = Enumerable.Range(1, 4)
            .Select(index => new PlanningCatalogueItem(
                $"item-{index}", $"Item {index}", 60, ["experience"],
                ["nature"], ["ella"], ["walking"]))
            .ToArray();

        var relaxedDraft = planner.Generate(relaxed, catalogue);
        var activeDraft = planner.Generate(active, catalogue);

        Assert.Single(relaxedDraft.Days[0].Items);
        Assert.Equal(3, activeDraft.Days[0].Items.Count);
        Assert.NotEqual(relaxedDraft.InputFingerprint, activeDraft.InputFingerprint);
    }

    [Fact]
    public void CatalogueSnapshotChangesAreVisibleInTheFingerprint()
    {
        var planner = new DeterministicTravelPlanner();
        PlanningCatalogueItem[] catalogue =
        [
            new(
                "ella-ridge-morning", "Ella ridge morning", 120,
                ["experience"], ["nature"], ["ella"], ["walking"]),
        ];

        var initial = planner.Generate(Input(), catalogue);
        var revised = planner.Generate(
            Input(),
            [catalogue[0] with { DurationMinutes = 150 }]);

        Assert.NotEqual(initial.InputFingerprint, revised.InputFingerprint);
    }

    [Fact]
    public void PlannerInputRejectsInvalidDatesDuplicatesAndPace()
    {
        var request = new CreateTravelPlanRequest
        {
            Title = "Invalid",
            TravelStartDate = new DateOnly(2027, 3, 2),
            TravelEndDate = new DateOnly(2027, 3, 1),
            Pace = "rushed",
            DestinationSlugs = ["ella", "ella"],
            TravellerIds = [Guid.Empty],
        };
        var results = new List<ValidationResult>();

        Validator.TryValidateObject(
            request, new ValidationContext(request), results, validateAllProperties: true);

        Assert.Contains(results, result => result.MemberNames.Contains(nameof(request.TravelEndDate)));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(request.Pace)));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(request.DestinationSlugs)));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(request.TravellerIds)));
    }

    private static PlannerInput Input() =>
        new(
            new DateOnly(2027, 2, 10),
            new DateOnly(2027, 2, 12),
            "balanced",
            ["ella"],
            [],
            ["nature"],
            ["experience"],
            ["nature"],
            ["slow-travel"],
            "Step-free options where possible",
            "Vegetarian");
}
