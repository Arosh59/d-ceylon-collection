using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.Modules.Catalogue.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Contracts;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Domain;
using D.Ceylon.Modules.ItinerariesTravelPlanning.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.ItinerariesTravelPlanning.Application;

internal sealed class TravelPlanRecords(
    ItinerariesTravelPlanningDbContext database,
    ICustomerRecords customerRecords,
    ICatalogueQueries catalogue,
    IDeterministicTravelPlanner planner,
    TimeProvider timeProvider)
    : ITravelPlanRecords
{
    public async Task<PagedResponse<TravelPlanSummaryResponse>> GetAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.TravelPlans.AsNoTracking().Where(x => x.CustomerId == customerId);
        var total = await query.LongCountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new TravelPlanSummaryResponse(
                x.Id, x.Title, x.TravelStartDate, x.TravelEndDate, x.Pace,
                x.Status, x.CurrentRevisionNumber, x.ConcurrencyToken, x.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        return PagedResponse.Create(items, pageNumber, pageSize, total);
    }

    public async Task<TravelPlanResponse?> GetAsync(
        Guid customerId,
        Guid planId,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: false)
            .SingleOrDefaultAsync(cancellationToken);
        return entity is null ? null : ToResponse(entity);
    }

    public async Task<TravelPlanResponse> CreateAsync(
        Guid customerId,
        CreateTravelPlanRequest request,
        CancellationToken cancellationToken)
    {
        await ValidateReferences(customerId, request, cancellationToken);
        var entity = new TravelPlan(
            Guid.NewGuid(), customerId, request.SavedItineraryId, request.Title,
            request.TravelStartDate, request.TravelEndDate, request.Pace,
            request.AccessibilityConsiderations, request.DietaryConsiderations);
        entity.ReplaceReferences(
            request.DestinationSlugs, request.TravellerIds, request.Interests,
            request.ProductTypeSlugs, request.CategorySlugs, request.TagSlugs);
        await GenerateRevision(entity, cancellationToken);
        database.TravelPlans.Add(entity);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> UpdateInputAsync(
        Guid customerId,
        Guid planId,
        UpdateTravelPlanInputRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        RequireVersion(entity, request.ConcurrencyToken);
        await ValidateReferences(customerId, request, cancellationToken);
        entity.SetInput(
            request.Title, request.TravelStartDate, request.TravelEndDate, request.Pace,
            request.AccessibilityConsiderations, request.DietaryConsiderations);
        entity.ReplaceReferences(
            request.DestinationSlugs, request.TravellerIds, request.Interests,
            request.ProductTypeSlugs, request.CategorySlugs, request.TagSlugs);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> GenerateAsync(
        Guid customerId,
        Guid planId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        RequireVersion(entity, concurrencyToken);
        await GenerateRevision(entity, cancellationToken);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> UpdateDayAsync(
        Guid customerId,
        Guid planId,
        Guid dayId,
        UpdateItineraryDayRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        var day = CurrentRevision(entity).Days.SingleOrDefault(x => x.Id == dayId);
        if (day is null) return null;
        RequireVersion(day, request.ConcurrencyToken);
        day.UpdateTitle(request.Title);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> CreateItemAsync(
        Guid customerId,
        Guid planId,
        Guid dayId,
        CreateItineraryItemRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        var day = CurrentRevision(entity).Days.SingleOrDefault(x => x.Id == dayId);
        if (day is null) return null;
        await RequireDestination(request.DestinationSlug, cancellationToken);
        var position = request.Position ?? day.Items.Count + 1;
        if (position < 1 || position > day.Items.Count + 1)
            throw new TravelPlanConflictException("The item position is outside the day.");
        foreach (var item in day.Items.Where(x => x.Position >= position))
            item.Move(day.Id, item.Position + 1);
        day.Items.Add(new ItineraryItem(
            Guid.NewGuid(), day.Id, position, request.Title, request.Notes,
            request.DurationMinutes, request.DestinationSlug, null, "custom"));
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> UpdateItemAsync(
        Guid customerId,
        Guid planId,
        Guid itemId,
        UpdateItineraryItemRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        var item = CurrentRevision(entity).Days.SelectMany(x => x.Items)
            .SingleOrDefault(x => x.Id == itemId);
        if (item is null) return null;
        RequireVersion(item, request.ConcurrencyToken);
        await RequireDestination(request.DestinationSlug, cancellationToken);
        item.Update(request.Title, request.Notes, request.DurationMinutes, request.DestinationSlug);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<TravelPlanResponse?> ReorderItemAsync(
        Guid customerId,
        Guid planId,
        Guid itemId,
        ReorderItineraryItemRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await OwnedPlan(customerId, planId, tracking: true)
            .SingleOrDefaultAsync(cancellationToken);
        if (entity is null) return null;
        var revision = CurrentRevision(entity);
        var sourceDay = revision.Days.SingleOrDefault(x => x.Items.Any(item => item.Id == itemId));
        var targetDay = revision.Days.SingleOrDefault(x => x.Id == request.TargetDayId);
        var item = sourceDay?.Items.SingleOrDefault(x => x.Id == itemId);
        if (item is null || sourceDay is null || targetDay is null) return null;
        RequireVersion(item, request.ConcurrencyToken);
        var targetCount = targetDay.Items.Count - (sourceDay.Id == targetDay.Id ? 1 : 0);
        if (request.Position < 1 || request.Position > targetCount + 1)
            throw new TravelPlanConflictException("The target position is outside the day.");

        var oldPosition = item.Position;
        foreach (var sibling in sourceDay.Items.Where(x => x.Id != item.Id && x.Position > oldPosition))
            sibling.Move(sourceDay.Id, sibling.Position - 1);
        foreach (var sibling in targetDay.Items.Where(x => x.Id != item.Id && x.Position >= request.Position))
            sibling.Move(targetDay.Id, sibling.Position + 1);
        if (sourceDay.Id != targetDay.Id)
        {
            sourceDay.Items.Remove(item);
            targetDay.Items.Add(item);
        }
        item.Move(targetDay.Id, request.Position);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    private IQueryable<TravelPlan> OwnedPlan(Guid customerId, Guid planId, bool tracking)
    {
        var query = database.TravelPlans
            .Where(x => x.CustomerId == customerId && x.Id == planId)
            .Include(x => x.Destinations)
            .Include(x => x.Travellers)
            .Include(x => x.Interests)
            .Include(x => x.Preferences)
            .Include(x => x.Revisions)
                .ThenInclude(x => x.Days)
                    .ThenInclude(x => x.Items)
            .AsSplitQuery();
        return tracking ? query : query.AsNoTracking();
    }

    private async Task ValidateReferences(
        Guid customerId,
        TravelPlanInput request,
        CancellationToken cancellationToken)
    {
        if (request.SavedItineraryId is { } savedId
            && await customerRecords.GetSavedItineraryAsync(customerId, savedId, cancellationToken) is null)
            throw new TravelPlanReferenceException("The saved itinerary was not found.");
        foreach (var travellerId in request.TravellerIds)
            if (await customerRecords.GetTravellerAsync(customerId, travellerId, cancellationToken) is null)
                throw new TravelPlanReferenceException("One or more travellers were not found.");
        foreach (var destination in request.DestinationSlugs)
            await RequireDestination(destination, cancellationToken);
    }

    private async Task RequireDestination(string slug, CancellationToken cancellationToken)
    {
        if (await catalogue.GetDestinationAsync(slug, cancellationToken) is null)
            throw new TravelPlanReferenceException("A published destination was not found.");
    }

    private async Task GenerateRevision(TravelPlan entity, CancellationToken cancellationToken)
    {
        var input = Input(entity);
        var catalogueItems = await catalogue.GetPlanningCatalogueAsync(
            input.Destinations, cancellationToken);
        entity.AddRevision(planner.Generate(input, catalogueItems), timeProvider.GetUtcNow());
    }

    private static PlannerInput Input(TravelPlan entity) =>
        new(
            entity.TravelStartDate, entity.TravelEndDate, entity.Pace,
            entity.Destinations.OrderBy(x => x.Position).Select(x => x.Slug).ToArray(),
            entity.Travellers.OrderBy(x => x.Position).Select(x => x.TravellerId).ToArray(),
            entity.Interests.OrderBy(x => x.Position).Select(x => x.Slug).ToArray(),
            Preferences(entity, "product-type"), Preferences(entity, "category"),
            Preferences(entity, "tag"), entity.AccessibilityConsiderations,
            entity.DietaryConsiderations);

    private static string[] Preferences(TravelPlan entity, string kind) =>
        entity.Preferences.Where(x => x.Kind == kind).OrderBy(x => x.Position)
            .Select(x => x.Slug).ToArray();

    private static ItineraryRevision CurrentRevision(TravelPlan entity) =>
        entity.Revisions.Single(x => x.RevisionNumber == entity.CurrentRevisionNumber);

    private static void RequireVersion(AuditableEntity entity, Guid supplied)
    {
        if (supplied == Guid.Empty || entity.ConcurrencyToken != supplied)
            throw new TravelPlanConflictException("The record changed. Reload and retry.");
    }

    private static TravelPlanResponse ToResponse(TravelPlan entity)
    {
        var revision = CurrentRevision(entity);
        return new(
            entity.Id, entity.SavedItineraryId, entity.Title, entity.TravelStartDate,
            entity.TravelEndDate, entity.Pace, entity.Status,
            new TravelPlanInputResponse(
                entity.Destinations.OrderBy(x => x.Position).Select(x => x.Slug).ToArray(),
                entity.Travellers.OrderBy(x => x.Position).Select(x => x.TravellerId).ToArray(),
                entity.Interests.OrderBy(x => x.Position).Select(x => x.Slug).ToArray(),
                Preferences(entity, "product-type"), Preferences(entity, "category"),
                Preferences(entity, "tag"), entity.AccessibilityConsiderations,
                entity.DietaryConsiderations),
            new ItineraryRevisionResponse(
                revision.Id, revision.RevisionNumber, revision.RuleVersion,
                revision.InputFingerprint, revision.GeneratedAtUtc,
                revision.Days.OrderBy(x => x.DayNumber).Select(day =>
                    new ItineraryDayResponse(
                        day.Id, day.DayNumber, day.Date, day.Title, day.ConcurrencyToken,
                        day.Items.OrderBy(x => x.Position).Select(item =>
                            new ItineraryItemResponse(
                                item.Id, item.Position, item.Title, item.Notes,
                                item.DurationMinutes, item.DestinationSlug,
                                item.ProductSlug, item.Source, item.ConcurrencyToken)).ToArray()))
                    .ToArray()),
            entity.ConcurrencyToken, entity.CreatedAtUtc, entity.UpdatedAtUtc);
    }
}
