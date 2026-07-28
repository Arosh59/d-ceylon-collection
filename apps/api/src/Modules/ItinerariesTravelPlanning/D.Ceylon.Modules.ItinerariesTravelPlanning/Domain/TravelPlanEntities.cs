using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;

public sealed class TravelPlan : AuditableEntity
{
    private TravelPlan()
    {
    }

    public TravelPlan(
        Guid id,
        Guid customerId,
        Guid? savedItineraryId,
        string title,
        DateOnly startDate,
        DateOnly endDate,
        string pace,
        string? accessibility,
        string? dietary)
        : base(id)
    {
        CustomerId = Guard.Id(customerId, nameof(customerId));
        SavedItineraryId = savedItineraryId;
        Status = "draft";
        SetInput(title, startDate, endDate, pace, accessibility, dietary);
    }

    public Guid CustomerId { get; private set; }
    public Guid? SavedItineraryId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public DateOnly TravelStartDate { get; private set; }
    public DateOnly TravelEndDate { get; private set; }
    public string Pace { get; private set; } = string.Empty;
    public string? AccessibilityConsiderations { get; private set; }
    public string? DietaryConsiderations { get; private set; }
    public string Status { get; private set; } = string.Empty;
    public string RuleVersion { get; private set; } = DeterministicTravelPlanner.RuleVersion;
    public string InputFingerprint { get; private set; } = string.Empty;
    public int CurrentRevisionNumber { get; private set; }
    public ICollection<TravelPlanDestination> Destinations { get; } = [];
    public ICollection<TravelPlanTraveller> Travellers { get; } = [];
    public ICollection<TravelPlanInterest> Interests { get; } = [];
    public ICollection<TravelPlanPreference> Preferences { get; } = [];
    public ICollection<ItineraryRevision> Revisions { get; } = [];

    public void SetInput(
        string title,
        DateOnly startDate,
        DateOnly endDate,
        string pace,
        string? accessibility,
        string? dietary)
    {
        Title = Guard.Required(title, 200, nameof(title));
        TravelStartDate = startDate;
        TravelEndDate = endDate;
        Pace = Guard.Required(pace, 20, nameof(pace));
        AccessibilityConsiderations = Guard.Optional(accessibility, 1_000, nameof(accessibility));
        DietaryConsiderations = Guard.Optional(dietary, 1_000, nameof(dietary));
    }

    public void ReplaceReferences(
        IReadOnlyList<string> destinationSlugs,
        IReadOnlyList<Guid> travellerIds,
        IReadOnlyList<string> interests,
        IReadOnlyList<string> productTypes,
        IReadOnlyList<string> categories,
        IReadOnlyList<string> tags)
    {
        Synchronize(
            Destinations,
            destinationSlugs,
            item => item.Slug,
            (value, order) => new TravelPlanDestination(Id, value, order),
            (item, order) => item.SetPosition(order));
        for (var index = 0; index < travellerIds.Count; index++)
        {
            var travellerId = travellerIds[index];
            var existing = Travellers.SingleOrDefault(item => item.TravellerId == travellerId);
            if (existing is null) Travellers.Add(new(Id, travellerId, index + 1));
            else existing.SetPosition(index + 1);
        }
        foreach (var removed in Travellers.Where(item => !travellerIds.Contains(item.TravellerId)).ToArray())
            Travellers.Remove(removed);
        Synchronize(
            Interests, interests, item => item.Slug,
            (value, order) => new TravelPlanInterest(Id, value, order),
            (item, order) => item.SetPosition(order));
        SynchronizePreferences("product-type", productTypes);
        SynchronizePreferences("category", categories);
        SynchronizePreferences("tag", tags);
    }

    public void AddRevision(PlannedDraft draft, DateTimeOffset generatedAt)
    {
        CurrentRevisionNumber++;
        RuleVersion = draft.RuleVersion;
        InputFingerprint = draft.InputFingerprint;
        var revision = new ItineraryRevision(
            DeterministicTravelPlanner.StableId($"{Id}:revision:{CurrentRevisionNumber}"),
            Id,
            CurrentRevisionNumber,
            draft.RuleVersion,
            draft.InputFingerprint,
            generatedAt);
        foreach (var day in draft.Days)
        {
            revision.AddDay(day, CurrentRevisionNumber);
        }

        Revisions.Add(revision);
    }

    private static void Synchronize<T>(
        ICollection<T> collection,
        IReadOnlyList<string> values,
        Func<T, string> key,
        Func<string, int, T> create,
        Action<T, int> setPosition)
    {
        foreach (var removed in collection.Where(item => !values.Contains(key(item))).ToArray())
            collection.Remove(removed);
        for (var index = 0; index < values.Count; index++)
        {
            var value = values[index];
            var existing = collection.SingleOrDefault(item => key(item) == value);
            if (existing is null) collection.Add(create(value, index + 1));
            else setPosition(existing, index + 1);
        }
    }

    private void SynchronizePreferences(string kind, IReadOnlyList<string> values)
    {
        foreach (var removed in Preferences.Where(item =>
                     item.Kind == kind && !values.Contains(item.Slug)).ToArray())
            Preferences.Remove(removed);
        for (var index = 0; index < values.Count; index++)
        {
            var value = values[index];
            var existing = Preferences.SingleOrDefault(item =>
                item.Kind == kind && item.Slug == value);
            if (existing is null) Preferences.Add(new(Id, kind, value, index + 1));
            else existing.SetPosition(index + 1);
        }
    }
}

public sealed class TravelPlanDestination
{
    private TravelPlanDestination() { }
    public TravelPlanDestination(Guid planId, string slug, int position)
    {
        TravelPlanId = Guard.Id(planId, nameof(planId));
        Slug = Guard.Required(slug, 200, nameof(slug));
        Position = position;
    }
    public Guid TravelPlanId { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public int Position { get; private set; }
    public void SetPosition(int position) => Position = position;
}

public sealed class TravelPlanTraveller
{
    private TravelPlanTraveller() { }
    public TravelPlanTraveller(Guid planId, Guid travellerId, int position)
    {
        TravelPlanId = Guard.Id(planId, nameof(planId));
        TravellerId = Guard.Id(travellerId, nameof(travellerId));
        Position = position;
    }
    public Guid TravelPlanId { get; private set; }
    public Guid TravellerId { get; private set; }
    public int Position { get; private set; }
    public void SetPosition(int position) => Position = position;
}

public sealed class TravelPlanInterest
{
    private TravelPlanInterest() { }
    public TravelPlanInterest(Guid planId, string slug, int position)
    {
        TravelPlanId = Guard.Id(planId, nameof(planId));
        Slug = Guard.Required(slug, 200, nameof(slug));
        Position = position;
    }
    public Guid TravelPlanId { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public int Position { get; private set; }
    public void SetPosition(int position) => Position = position;
}

public sealed class TravelPlanPreference
{
    private TravelPlanPreference() { }
    public TravelPlanPreference(Guid planId, string kind, string slug, int position)
    {
        TravelPlanId = Guard.Id(planId, nameof(planId));
        Kind = Guard.Required(kind, 30, nameof(kind));
        Slug = Guard.Required(slug, 200, nameof(slug));
        Position = position;
    }
    public Guid TravelPlanId { get; private set; }
    public string Kind { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public int Position { get; private set; }
    public void SetPosition(int position) => Position = position;
}

public sealed class ItineraryRevision : AuditableEntity
{
    private ItineraryRevision() { }
    public ItineraryRevision(
        Guid id,
        Guid planId,
        int revisionNumber,
        string ruleVersion,
        string fingerprint,
        DateTimeOffset generatedAt)
        : base(id)
    {
        TravelPlanId = Guard.Id(planId, nameof(planId));
        RevisionNumber = revisionNumber;
        RuleVersion = Guard.Required(ruleVersion, 100, nameof(ruleVersion));
        InputFingerprint = Guard.Required(fingerprint, 64, nameof(fingerprint));
        GeneratedAtUtc = generatedAt;
    }
    public Guid TravelPlanId { get; private set; }
    public int RevisionNumber { get; private set; }
    public string RuleVersion { get; private set; } = string.Empty;
    public string InputFingerprint { get; private set; } = string.Empty;
    public DateTimeOffset GeneratedAtUtc { get; private set; }
    public ICollection<ItineraryDay> Days { get; } = [];
    public void AddDay(PlannedDay day, int revisionNumber)
    {
        var entity = new ItineraryDay(
            DeterministicTravelPlanner.StableId(
                $"{TravelPlanId}:{day.Id}:revision:{revisionNumber}"),
            Id,
            day.DayNumber,
            day.Date,
            day.Title);
        foreach (var item in day.Items)
        {
            entity.Items.Add(
                new ItineraryItem(
                    DeterministicTravelPlanner.StableId(
                        $"{TravelPlanId}:{item.Id}:revision:{revisionNumber}"),
                    entity.Id,
                    item.Position,
                    item.Title,
                    item.Notes,
                    item.DurationMinutes,
                    item.DestinationSlug,
                    item.ProductSlug,
                    item.Source));
        }
        Days.Add(entity);
    }
}

public sealed class ItineraryDay : AuditableEntity
{
    private ItineraryDay() { }
    public ItineraryDay(Guid id, Guid revisionId, int number, DateOnly date, string title)
        : base(id)
    {
        ItineraryRevisionId = Guard.Id(revisionId, nameof(revisionId));
        DayNumber = number;
        Date = date;
        UpdateTitle(title);
    }
    public Guid ItineraryRevisionId { get; private set; }
    public int DayNumber { get; private set; }
    public DateOnly Date { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public ICollection<ItineraryItem> Items { get; } = [];
    public void UpdateTitle(string title) => Title = Guard.Required(title, 200, nameof(title));
}

public sealed class ItineraryItem : AuditableEntity
{
    private ItineraryItem() { }
    public ItineraryItem(
        Guid id,
        Guid dayId,
        int position,
        string title,
        string? notes,
        int? duration,
        string destination,
        string? product,
        string source)
        : base(id)
    {
        ItineraryDayId = Guard.Id(dayId, nameof(dayId));
        Position = position;
        Source = Guard.Required(source, 20, nameof(source));
        Update(title, notes, duration, destination);
        ProductSlug = Guard.Optional(product, 200, nameof(product));
    }
    public Guid ItineraryDayId { get; private set; }
    public int Position { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Notes { get; private set; }
    public int? DurationMinutes { get; private set; }
    public string DestinationSlug { get; private set; } = string.Empty;
    public string? ProductSlug { get; private set; }
    public string Source { get; private set; } = string.Empty;
    public void Update(string title, string? notes, int? duration, string destination)
    {
        Title = Guard.Required(title, 200, nameof(title));
        Notes = Guard.Optional(notes, 2_000, nameof(notes));
        DurationMinutes = duration;
        DestinationSlug = Guard.Required(destination, 200, nameof(destination));
    }
    public void Move(Guid dayId, int position)
    {
        ItineraryDayId = Guard.Id(dayId, nameof(dayId));
        Position = position;
    }
}

internal static class Guard
{
    public static Guid Id(Guid value, string name) =>
        value == Guid.Empty ? throw new ArgumentException("Identifier is required.", name) : value;
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
