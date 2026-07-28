using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.CustomersTravellers.Contracts;

public sealed record CustomerProfileResponse(
    Guid Id,
    string GivenName,
    string FamilyName,
    string? ContactEmail,
    string? ContactPhone,
    string? CountryCode,
    string PreferredLocale,
    string PreferredContactMethod,
    bool MarketingConsent,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record TravellerResponse(
    Guid Id,
    string GivenName,
    string FamilyName,
    DateOnly? DateOfBirth,
    string? AccessibilityNeeds,
    string? DietaryNeeds,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public sealed record WishlistEntryResponse(
    Guid Id,
    string ProductSlug,
    string? Note,
    Guid ConcurrencyToken,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record SavedItineraryResponse(
    Guid Id,
    string Title,
    string? Summary,
    DateOnly? TravelStartDate,
    DateOnly? TravelEndDate,
    string? PrimaryDestinationSlug,
    bool IsArchived,
    Guid ConcurrencyToken,
    DateTimeOffset UpdatedAtUtc);

public abstract class CustomerProfileInput : IValidatableObject
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string GivenName { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string FamilyName { get; init; } = string.Empty;

    [EmailAddress]
    [StringLength(320)]
    public string? ContactEmail { get; init; }

    [Phone]
    [StringLength(40)]
    public string? ContactPhone { get; init; }

    [RegularExpression("^[A-Za-z]{2}$")]
    public string? CountryCode { get; init; }

    [Required]
    [RegularExpression("^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")]
    public string PreferredLocale { get; init; } = "en-LK";

    [Required]
    [RegularExpression("^(email|phone)$")]
    public string PreferredContactMethod { get; init; } = "email";

    public bool MarketingConsent { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PreferredContactMethod == "email" && string.IsNullOrWhiteSpace(ContactEmail))
        {
            yield return new ValidationResult(
                "A contact email is required when email is preferred.",
                [nameof(ContactEmail), nameof(PreferredContactMethod)]);
        }

        if (PreferredContactMethod == "phone" && string.IsNullOrWhiteSpace(ContactPhone))
        {
            yield return new ValidationResult(
                "A contact phone is required when phone is preferred.",
                [nameof(ContactPhone), nameof(PreferredContactMethod)]);
        }
    }
}

public sealed class CreateCustomerProfileRequest : CustomerProfileInput;

public sealed class UpdateCustomerProfileRequest : CustomerProfileInput
{
    public Guid ConcurrencyToken { get; init; }
}

public abstract class TravellerInput : IValidatableObject
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string GivenName { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string FamilyName { get; init; } = string.Empty;

    public DateOnly? DateOfBirth { get; init; }

    [StringLength(1_000)]
    public string? AccessibilityNeeds { get; init; }

    [StringLength(1_000)]
    public string? DietaryNeeds { get; init; }

    [StringLength(200)]
    public string? EmergencyContactName { get; init; }

    [Phone]
    [StringLength(40)]
    public string? EmergencyContactPhone { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DateOfBirth is { } dateOfBirth
            && (dateOfBirth > DateOnly.FromDateTime(DateTime.UtcNow)
                || dateOfBirth < DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-120))))
        {
            yield return new ValidationResult(
                "Date of birth must be in the past and no more than 120 years ago.",
                [nameof(DateOfBirth)]);
        }

        var hasEmergencyName = !string.IsNullOrWhiteSpace(EmergencyContactName);
        var hasEmergencyPhone = !string.IsNullOrWhiteSpace(EmergencyContactPhone);
        if (hasEmergencyName != hasEmergencyPhone)
        {
            yield return new ValidationResult(
                "Emergency contact name and phone must be supplied together.",
                [nameof(EmergencyContactName), nameof(EmergencyContactPhone)]);
        }
    }
}

public sealed class CreateTravellerRequest : TravellerInput;

public sealed class UpdateTravellerRequest : TravellerInput
{
    public Guid ConcurrencyToken { get; init; }
}

public sealed class CreateWishlistEntryRequest : IValidatableObject
{
    [Required]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    [StringLength(200)]
    public string ProductSlug { get; init; } = string.Empty;

    [StringLength(500)]
    public string? Note { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        [];
}

public sealed class UpdateWishlistEntryRequest
{
    [StringLength(500)]
    public string? Note { get; init; }

    public Guid ConcurrencyToken { get; init; }
}

public abstract class SavedItineraryInput : IValidatableObject
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    [StringLength(2_000)]
    public string? Summary { get; init; }

    public DateOnly? TravelStartDate { get; init; }

    public DateOnly? TravelEndDate { get; init; }

    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    [StringLength(200)]
    public string? PrimaryDestinationSlug { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TravelStartDate is { } start
            && TravelEndDate is { } end
            && end < start)
        {
            yield return new ValidationResult(
                "Travel end date cannot be before the start date.",
                [nameof(TravelStartDate), nameof(TravelEndDate)]);
        }
    }
}

public sealed class CreateSavedItineraryRequest : SavedItineraryInput;

public sealed class UpdateSavedItineraryRequest : SavedItineraryInput
{
    public Guid ConcurrencyToken { get; init; }
}

public interface ICustomerRecords
{
    Task<CustomerProfileResponse?> GetProfileAsync(
        Guid customerId,
        CancellationToken cancellationToken);

    Task<CustomerProfileResponse> CreateProfileAsync(
        Guid customerId,
        CreateCustomerProfileRequest request,
        CancellationToken cancellationToken);

    Task<CustomerProfileResponse?> UpdateProfileAsync(
        Guid customerId,
        UpdateCustomerProfileRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteProfileAsync(
        Guid customerId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<PagedResponse<TravellerResponse>> GetTravellersAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<TravellerResponse?> GetTravellerAsync(
        Guid customerId,
        Guid travellerId,
        CancellationToken cancellationToken);

    Task<TravellerResponse> CreateTravellerAsync(
        Guid customerId,
        CreateTravellerRequest request,
        CancellationToken cancellationToken);

    Task<TravellerResponse?> UpdateTravellerAsync(
        Guid customerId,
        Guid travellerId,
        UpdateTravellerRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteTravellerAsync(
        Guid customerId,
        Guid travellerId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<PagedResponse<WishlistEntryResponse>> GetWishlistAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<WishlistEntryResponse> CreateWishlistEntryAsync(
        Guid customerId,
        CreateWishlistEntryRequest request,
        CancellationToken cancellationToken);

    Task<WishlistEntryResponse?> UpdateWishlistEntryAsync(
        Guid customerId,
        Guid entryId,
        UpdateWishlistEntryRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteWishlistEntryAsync(
        Guid customerId,
        Guid entryId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);

    Task<PagedResponse<SavedItineraryResponse>> GetSavedItinerariesAsync(
        Guid customerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<SavedItineraryResponse?> GetSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        CancellationToken cancellationToken);

    Task<SavedItineraryResponse> CreateSavedItineraryAsync(
        Guid customerId,
        CreateSavedItineraryRequest request,
        CancellationToken cancellationToken);

    Task<SavedItineraryResponse?> UpdateSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        UpdateSavedItineraryRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteSavedItineraryAsync(
        Guid customerId,
        Guid itineraryId,
        Guid concurrencyToken,
        CancellationToken cancellationToken);
}

public sealed class CustomerRecordConflictException(string message) : Exception(message);
