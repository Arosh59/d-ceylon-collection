using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.CustomersTravellers.Domain;

public sealed class CustomerProfile : AuditableEntity
{
    private CustomerProfile()
    {
    }

    public CustomerProfile(
        Guid id,
        Guid customerId,
        string givenName,
        string familyName,
        string? contactEmail,
        string? contactPhone,
        string? countryCode,
        string preferredLocale,
        string preferredContactMethod,
        bool marketingConsent)
        : base(id)
    {
        CustomerId = CustomerRecordsGuard.Identifier(customerId, nameof(customerId));
        Update(
            givenName,
            familyName,
            contactEmail,
            contactPhone,
            countryCode,
            preferredLocale,
            preferredContactMethod,
            marketingConsent);
    }

    public Guid CustomerId { get; private set; }

    public string GivenName { get; private set; } = string.Empty;

    public string FamilyName { get; private set; } = string.Empty;

    public string? ContactEmail { get; private set; }

    public string? ContactPhone { get; private set; }

    public string? CountryCode { get; private set; }

    public string PreferredLocale { get; private set; } = string.Empty;

    public string PreferredContactMethod { get; private set; } = string.Empty;

    public bool MarketingConsent { get; private set; }

    public void Update(
        string givenName,
        string familyName,
        string? contactEmail,
        string? contactPhone,
        string? countryCode,
        string preferredLocale,
        string preferredContactMethod,
        bool marketingConsent)
    {
        GivenName = CustomerRecordsGuard.Required(givenName, 100, nameof(givenName));
        FamilyName = CustomerRecordsGuard.Required(familyName, 100, nameof(familyName));
        ContactEmail = CustomerRecordsGuard.Optional(contactEmail, 320, nameof(contactEmail));
        ContactPhone = CustomerRecordsGuard.Optional(contactPhone, 40, nameof(contactPhone));
        CountryCode = CustomerRecordsGuard.Optional(countryCode, 2, nameof(countryCode))?.ToUpperInvariant();
        PreferredLocale = CustomerRecordsGuard.Required(
            preferredLocale,
            20,
            nameof(preferredLocale));
        PreferredContactMethod = CustomerRecordsGuard.Required(
            preferredContactMethod,
            20,
            nameof(preferredContactMethod));
        MarketingConsent = marketingConsent;
    }
}

public sealed class Traveller : AuditableEntity
{
    private Traveller()
    {
    }

    public Traveller(
        Guid id,
        Guid customerId,
        string givenName,
        string familyName,
        DateOnly? dateOfBirth,
        string? accessibilityNeeds,
        string? dietaryNeeds,
        string? emergencyContactName,
        string? emergencyContactPhone)
        : base(id)
    {
        CustomerId = CustomerRecordsGuard.Identifier(customerId, nameof(customerId));
        Update(
            givenName,
            familyName,
            dateOfBirth,
            accessibilityNeeds,
            dietaryNeeds,
            emergencyContactName,
            emergencyContactPhone);
    }

    public Guid CustomerId { get; private set; }

    public string GivenName { get; private set; } = string.Empty;

    public string FamilyName { get; private set; } = string.Empty;

    public DateOnly? DateOfBirth { get; private set; }

    public string? AccessibilityNeeds { get; private set; }

    public string? DietaryNeeds { get; private set; }

    public string? EmergencyContactName { get; private set; }

    public string? EmergencyContactPhone { get; private set; }

    public void Update(
        string givenName,
        string familyName,
        DateOnly? dateOfBirth,
        string? accessibilityNeeds,
        string? dietaryNeeds,
        string? emergencyContactName,
        string? emergencyContactPhone)
    {
        GivenName = CustomerRecordsGuard.Required(givenName, 100, nameof(givenName));
        FamilyName = CustomerRecordsGuard.Required(familyName, 100, nameof(familyName));
        DateOfBirth = dateOfBirth;
        AccessibilityNeeds = CustomerRecordsGuard.Optional(
            accessibilityNeeds,
            1_000,
            nameof(accessibilityNeeds));
        DietaryNeeds = CustomerRecordsGuard.Optional(dietaryNeeds, 1_000, nameof(dietaryNeeds));
        EmergencyContactName = CustomerRecordsGuard.Optional(
            emergencyContactName,
            200,
            nameof(emergencyContactName));
        EmergencyContactPhone = CustomerRecordsGuard.Optional(
            emergencyContactPhone,
            40,
            nameof(emergencyContactPhone));
    }
}

public sealed class WishlistEntry : AuditableEntity
{
    private WishlistEntry()
    {
    }

    public WishlistEntry(Guid id, Guid customerId, string productSlug, string? note)
        : base(id)
    {
        CustomerId = CustomerRecordsGuard.Identifier(customerId, nameof(customerId));
        ProductSlug = CustomerRecordsGuard.Required(productSlug, 200, nameof(productSlug));
        Note = CustomerRecordsGuard.Optional(note, 500, nameof(note));
    }

    public Guid CustomerId { get; private set; }

    public string ProductSlug { get; private set; } = string.Empty;

    public string? Note { get; private set; }

    public void UpdateNote(string? note) =>
        Note = CustomerRecordsGuard.Optional(note, 500, nameof(note));
}

public sealed class SavedItinerary : AuditableEntity
{
    private SavedItinerary()
    {
    }

    public SavedItinerary(
        Guid id,
        Guid customerId,
        string title,
        string? summary,
        DateOnly? travelStartDate,
        DateOnly? travelEndDate,
        string? primaryDestinationSlug)
        : base(id)
    {
        CustomerId = CustomerRecordsGuard.Identifier(customerId, nameof(customerId));
        Update(
            title,
            summary,
            travelStartDate,
            travelEndDate,
            primaryDestinationSlug);
    }

    public Guid CustomerId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Summary { get; private set; }

    public DateOnly? TravelStartDate { get; private set; }

    public DateOnly? TravelEndDate { get; private set; }

    public string? PrimaryDestinationSlug { get; private set; }

    public bool IsArchived { get; private set; }

    public void Update(
        string title,
        string? summary,
        DateOnly? travelStartDate,
        DateOnly? travelEndDate,
        string? primaryDestinationSlug)
    {
        Title = CustomerRecordsGuard.Required(title, 200, nameof(title));
        Summary = CustomerRecordsGuard.Optional(summary, 2_000, nameof(summary));
        TravelStartDate = travelStartDate;
        TravelEndDate = travelEndDate;
        PrimaryDestinationSlug = CustomerRecordsGuard.Optional(
            primaryDestinationSlug,
            200,
            nameof(primaryDestinationSlug));
    }

    public void Archive() => IsArchived = true;
}

internal static class CustomerRecordsGuard
{
    public static Guid Identifier(Guid value, string parameterName) =>
        value == Guid.Empty
            ? throw new ArgumentException("Identifiers cannot be empty.", parameterName)
            : value;

    public static string Required(string value, int maximumLength, string parameterName)
    {
        var result = value.Trim();
        return result.Length is > 0 && result.Length <= maximumLength
            ? result
            : throw new ArgumentOutOfRangeException(parameterName);
    }

    public static string? Optional(
        string? value,
        int maximumLength,
        string parameterName)
    {
        var result = value?.Trim();
        if (string.IsNullOrEmpty(result))
        {
            return null;
        }

        return result.Length <= maximumLength
            ? result
            : throw new ArgumentOutOfRangeException(parameterName);
    }
}
