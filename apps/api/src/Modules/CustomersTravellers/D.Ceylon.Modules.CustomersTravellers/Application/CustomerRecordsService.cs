using D.Ceylon.BuildingBlocks.Domain;
using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Domain;
using D.Ceylon.Modules.CustomersTravellers.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace D.Ceylon.Modules.CustomersTravellers.Application;

internal sealed class CustomerRecordsService(CustomersTravellersDbContext database)
    : ICustomerRecords
{
    public async Task<CustomerProfileResponse?> GetProfileAsync(
        Guid customerId,
        CancellationToken cancellationToken)
    {
        var entity = await database.CustomerProfiles
            .AsNoTracking()
            .Where(entity => entity.CustomerId == customerId)
            .SingleOrDefaultAsync(cancellationToken);
        return entity is null ? null : ToProfileResponse(entity);
    }

    public async Task<CustomerProfileResponse> CreateProfileAsync(
        Guid customerId,
        CreateCustomerProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (await database.CustomerProfiles.AnyAsync(
                entity => entity.CustomerId == customerId,
                cancellationToken))
        {
            throw new CustomerRecordConflictException(
                "A customer profile already exists.");
        }

        var entity = new CustomerProfile(
            Guid.NewGuid(),
            customerId,
            request.GivenName,
            request.FamilyName,
            request.ContactEmail,
            request.ContactPhone,
            request.CountryCode,
            request.PreferredLocale,
            request.PreferredContactMethod,
            request.MarketingConsent);
        database.CustomerProfiles.Add(entity);
        await SaveAsync("A customer profile already exists.", cancellationToken);
        return ToProfileResponse(entity);
    }

    public async Task<CustomerProfileResponse?> UpdateProfileAsync(
        Guid customerId,
        UpdateCustomerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await database.CustomerProfiles.SingleOrDefaultAsync(
            item => item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return null;
        }

        RequireCurrentVersion(entity, request.ConcurrencyToken);
        entity.Update(
            request.GivenName,
            request.FamilyName,
            request.ContactEmail,
            request.ContactPhone,
            request.CountryCode,
            request.PreferredLocale,
            request.PreferredContactMethod,
            request.MarketingConsent);
        await database.SaveChangesAsync(cancellationToken);
        return ToProfileResponse(entity);
    }

    public async Task<bool> DeleteProfileAsync(
        Guid customerId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        var entity = await database.CustomerProfiles.SingleOrDefaultAsync(
            item => item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return false;
        }

        RequireCurrentVersion(entity, concurrencyToken);
        database.CustomerProfiles.Remove(entity);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResponse<TravellerResponse>> GetTravellersAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Travellers
            .AsNoTracking()
            .Where(entity => entity.CustomerId == customerId);
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderBy(entity => entity.FamilyName)
            .ThenBy(entity => entity.GivenName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var items = entities.Select(ToTravellerResponse).ToArray();
        return PagedResponse.Create(items, pageNumber, pageSize, total);
    }

    public async Task<TravellerResponse?> GetTravellerAsync(
        Guid customerId,
        Guid travellerId,
        CancellationToken cancellationToken)
    {
        var entity = await database.Travellers
            .AsNoTracking()
            .Where(entity => entity.Id == travellerId && entity.CustomerId == customerId)
            .SingleOrDefaultAsync(cancellationToken);
        return entity is null ? null : ToTravellerResponse(entity);
    }

    public async Task<TravellerResponse> CreateTravellerAsync(
        Guid customerId,
        CreateTravellerRequest request,
        CancellationToken cancellationToken)
    {
        var entity = new Traveller(
            Guid.NewGuid(),
            customerId,
            request.GivenName,
            request.FamilyName,
            request.DateOfBirth,
            request.AccessibilityNeeds,
            request.DietaryNeeds,
            request.EmergencyContactName,
            request.EmergencyContactPhone);
        database.Travellers.Add(entity);
        await database.SaveChangesAsync(cancellationToken);
        return ToTravellerResponse(entity);
    }

    public async Task<TravellerResponse?> UpdateTravellerAsync(
        Guid customerId,
        Guid travellerId,
        UpdateTravellerRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await database.Travellers.SingleOrDefaultAsync(
            item => item.Id == travellerId && item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return null;
        }

        RequireCurrentVersion(entity, request.ConcurrencyToken);
        entity.Update(
            request.GivenName,
            request.FamilyName,
            request.DateOfBirth,
            request.AccessibilityNeeds,
            request.DietaryNeeds,
            request.EmergencyContactName,
            request.EmergencyContactPhone);
        await database.SaveChangesAsync(cancellationToken);
        return ToTravellerResponse(entity);
    }

    public async Task<bool> DeleteTravellerAsync(
        Guid customerId,
        Guid travellerId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        var entity = await database.Travellers.SingleOrDefaultAsync(
            item => item.Id == travellerId && item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return false;
        }

        RequireCurrentVersion(entity, concurrencyToken);
        database.Travellers.Remove(entity);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResponse<WishlistEntryResponse>> GetWishlistAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.WishlistEntries
            .AsNoTracking()
            .Where(entity => entity.CustomerId == customerId);
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(entity => entity.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var items = entities.Select(ToWishlistResponse).ToArray();
        return PagedResponse.Create(items, pageNumber, pageSize, total);
    }

    public async Task<WishlistEntryResponse> CreateWishlistEntryAsync(
        Guid customerId,
        CreateWishlistEntryRequest request,
        CancellationToken cancellationToken)
    {
        if (await database.WishlistEntries.AnyAsync(
                entity => entity.CustomerId == customerId
                    && entity.ProductSlug == request.ProductSlug,
                cancellationToken))
        {
            throw new CustomerRecordConflictException(
                "This product is already in the wishlist.");
        }

        var entity = new WishlistEntry(
            Guid.NewGuid(),
            customerId,
            request.ProductSlug,
            request.Note);
        database.WishlistEntries.Add(entity);
        await SaveAsync("This product is already in the wishlist.", cancellationToken);
        return ToWishlistResponse(entity);
    }

    public async Task<WishlistEntryResponse?> UpdateWishlistEntryAsync(
        Guid customerId,
        Guid entryId,
        UpdateWishlistEntryRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await database.WishlistEntries.SingleOrDefaultAsync(
            item => item.Id == entryId && item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return null;
        }

        RequireCurrentVersion(entity, request.ConcurrencyToken);
        entity.UpdateNote(request.Note);
        await database.SaveChangesAsync(cancellationToken);
        return ToWishlistResponse(entity);
    }

    public async Task<bool> DeleteWishlistEntryAsync(
        Guid customerId,
        Guid entryId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        var entity = await database.WishlistEntries.SingleOrDefaultAsync(
            item => item.Id == entryId && item.CustomerId == customerId,
            cancellationToken);
        if (entity is null)
        {
            return false;
        }

        RequireCurrentVersion(entity, concurrencyToken);
        database.WishlistEntries.Remove(entity);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResponse<SavedItineraryResponse>> GetSavedItinerariesAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.SavedItineraries
            .AsNoTracking()
            .Where(entity => entity.CustomerId == customerId && !entity.IsArchived);
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(entity => entity.UpdatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var items = entities.Select(ToSavedItineraryResponse).ToArray();
        return PagedResponse.Create(items, pageNumber, pageSize, total);
    }

    public async Task<SavedItineraryResponse?> GetSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        CancellationToken cancellationToken)
    {
        var entity = await database.SavedItineraries
            .AsNoTracking()
            .Where(entity => entity.Id == itineraryId
                && entity.CustomerId == customerId
                && !entity.IsArchived)
            .SingleOrDefaultAsync(cancellationToken);
        return entity is null ? null : ToSavedItineraryResponse(entity);
    }

    public async Task<SavedItineraryResponse> CreateSavedItineraryAsync(
        Guid customerId,
        CreateSavedItineraryRequest request,
        CancellationToken cancellationToken)
    {
        var entity = new SavedItinerary(
            Guid.NewGuid(),
            customerId,
            request.Title,
            request.Summary,
            request.TravelStartDate,
            request.TravelEndDate,
            request.PrimaryDestinationSlug);
        database.SavedItineraries.Add(entity);
        await database.SaveChangesAsync(cancellationToken);
        return ToSavedItineraryResponse(entity);
    }

    public async Task<SavedItineraryResponse?> UpdateSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        UpdateSavedItineraryRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await database.SavedItineraries.SingleOrDefaultAsync(
            item => item.Id == itineraryId
                && item.CustomerId == customerId
                && !item.IsArchived,
            cancellationToken);
        if (entity is null)
        {
            return null;
        }

        RequireCurrentVersion(entity, request.ConcurrencyToken);
        entity.Update(
            request.Title,
            request.Summary,
            request.TravelStartDate,
            request.TravelEndDate,
            request.PrimaryDestinationSlug);
        await database.SaveChangesAsync(cancellationToken);
        return ToSavedItineraryResponse(entity);
    }

    public async Task<bool> DeleteSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        Guid concurrencyToken,
        CancellationToken cancellationToken)
    {
        var entity = await database.SavedItineraries.SingleOrDefaultAsync(
            item => item.Id == itineraryId
                && item.CustomerId == customerId
                && !item.IsArchived,
            cancellationToken);
        if (entity is null)
        {
            return false;
        }

        RequireCurrentVersion(entity, concurrencyToken);
        database.SavedItineraries.Remove(entity);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task SaveAsync(string conflictMessage, CancellationToken cancellationToken)
    {
        try
        {
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
            })
        {
            throw new CustomerRecordConflictException(conflictMessage);
        }
    }

    private static void RequireCurrentVersion(
        AuditableEntity entity,
        Guid suppliedConcurrencyToken)
    {
        if (suppliedConcurrencyToken == Guid.Empty
            || entity.ConcurrencyToken != suppliedConcurrencyToken)
        {
            throw new DbUpdateConcurrencyException(
                "The supplied concurrency token is not current.");
        }
    }

    private static CustomerProfileResponse ToProfileResponse(CustomerProfile entity) =>
        new(
            entity.Id,
            entity.GivenName,
            entity.FamilyName,
            entity.ContactEmail,
            entity.ContactPhone,
            entity.CountryCode,
            entity.PreferredLocale,
            entity.PreferredContactMethod,
            entity.MarketingConsent,
            entity.ConcurrencyToken,
            entity.UpdatedAtUtc);

    private static TravellerResponse ToTravellerResponse(Traveller entity) =>
        new(
            entity.Id,
            entity.GivenName,
            entity.FamilyName,
            entity.DateOfBirth,
            entity.AccessibilityNeeds,
            entity.DietaryNeeds,
            entity.EmergencyContactName,
            entity.EmergencyContactPhone,
            entity.ConcurrencyToken,
            entity.UpdatedAtUtc);

    private static WishlistEntryResponse ToWishlistResponse(WishlistEntry entity) =>
        new(
            entity.Id,
            entity.ProductSlug,
            entity.Note,
            entity.ConcurrencyToken,
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc);

    private static SavedItineraryResponse ToSavedItineraryResponse(SavedItinerary entity) =>
        new(
            entity.Id,
            entity.Title,
            entity.Summary,
            entity.TravelStartDate,
            entity.TravelEndDate,
            entity.PrimaryDestinationSlug,
            entity.IsArchived,
            entity.ConcurrencyToken,
            entity.UpdatedAtUtc);
}
