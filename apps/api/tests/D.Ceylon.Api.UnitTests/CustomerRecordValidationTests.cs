using System.ComponentModel.DataAnnotations;
using D.Ceylon.Modules.CustomersTravellers.Contracts;
using D.Ceylon.Modules.CustomersTravellers.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class CustomerRecordValidationTests
{
    [Fact]
    public void ProfileRequiresTheSelectedContactChannel()
    {
        var request = new CreateCustomerProfileRequest
        {
            GivenName = "Asha",
            FamilyName = "Perera",
            PreferredContactMethod = "phone",
            PreferredLocale = "en-LK",
        };

        var errors = Validate(request);

        Assert.Contains(
            errors,
            error => error.MemberNames.Contains(nameof(request.ContactPhone)));
    }

    [Fact]
    public void TravellerRejectsUnpairedEmergencyContactAndFutureBirthDate()
    {
        var request = new CreateTravellerRequest
        {
            GivenName = "Maya",
            FamilyName = "Perera",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            EmergencyContactName = "Asha Perera",
        };

        var errors = Validate(request);

        Assert.Contains(
            errors,
            error => error.MemberNames.Contains(nameof(request.DateOfBirth)));
        Assert.Contains(
            errors,
            error => error.MemberNames.Contains(nameof(request.EmergencyContactPhone)));
    }

    [Fact]
    public void SavedItineraryRejectsAnEndDateBeforeItsStart()
    {
        var request = new CreateSavedItineraryRequest
        {
            Title = "Coast",
            TravelStartDate = new DateOnly(2027, 2, 10),
            TravelEndDate = new DateOnly(2027, 2, 9),
        };

        var errors = Validate(request);

        Assert.Contains(
            errors,
            error => error.MemberNames.Contains(nameof(request.TravelEndDate)));
    }

    [Fact]
    public void DomainRecordsTrimOnlyTheSubmittedMinimumData()
    {
        var traveller = new Traveller(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "  Maya ",
            " Perera ",
            null,
            null,
            " vegetarian ",
            null,
            null);

        Assert.Equal("Maya", traveller.GivenName);
        Assert.Equal("Perera", traveller.FamilyName);
        Assert.Equal("vegetarian", traveller.DietaryNeeds);
        Assert.Null(traveller.AccessibilityNeeds);
        Assert.Null(traveller.EmergencyContactName);
    }

    private static List<ValidationResult> Validate(object request)
    {
        var errors = new List<ValidationResult>();
        Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            errors,
            validateAllProperties: true);
        return errors;
    }
}
