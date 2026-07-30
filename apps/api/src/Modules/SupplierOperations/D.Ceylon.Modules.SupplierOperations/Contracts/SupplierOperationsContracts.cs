using System.ComponentModel.DataAnnotations;
using D.Ceylon.BuildingBlocks.Pagination;

namespace D.Ceylon.Modules.SupplierOperations.Contracts;

public sealed class SupplierOperationsConflictException(string message) : Exception(message);

public sealed class SupplierOperationsNotFoundException(string message) : Exception(message);

public sealed record SupplierResponse(
    Guid Id,
    string Name,
    string Category,
    string? ContactName,
    string? ContactEmail,
    string Status,
    Guid ConcurrencyToken);

public sealed record OperationTaskResponse(
    Guid Id,
    Guid BookingId,
    Guid? SupplierId,
    string Title,
    string Status,
    DateOnly? DueDate,
    string? Notes,
    Guid ConcurrencyToken);

public sealed record VehicleResponse(
    Guid Id,
    Guid? SupplierId,
    string Name,
    string RegistrationNumber,
    int Capacity,
    string Status,
    string? Notes,
    Guid ConcurrencyToken);

public sealed record DriverResponse(
    Guid Id,
    string Name,
    string Phone,
    string? LicenceNumber,
    string Status,
    Guid ConcurrencyToken);

public sealed record GuideResponse(
    Guid Id,
    string Name,
    string Phone,
    string? Languages,
    string Status,
    Guid ConcurrencyToken);

public sealed record ArrivalResponse(
    Guid Id,
    Guid BookingId,
    DateTimeOffset ArrivalAtUtc,
    string Airport,
    string? FlightNumber,
    string Status,
    string? Notes,
    Guid ConcurrencyToken);

public sealed record BookingResourceAssignmentResponse(
    Guid Id,
    Guid BookingId,
    DateOnly ServiceDate,
    Guid? VehicleId,
    Guid? DriverId,
    Guid? GuideId,
    string Status,
    string? Notes,
    Guid ConcurrencyToken);

public sealed class CreateSupplierRequest
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(60)]
    public string Category { get; init; } = string.Empty;

    [StringLength(120)]
    public string? ContactName { get; init; }

    [EmailAddress, StringLength(320)]
    public string? ContactEmail { get; init; }
}

public sealed class CreateOperationTaskRequest : IValidatableObject
{
    public Guid BookingId { get; init; }

    public Guid? SupplierId { get; init; }

    [Required, StringLength(200)]
    public string Title { get; init; } = string.Empty;

    public DateOnly? DueDate { get; init; }

    [StringLength(2000)]
    public string? Notes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (BookingId == Guid.Empty)
        {
            yield return new ValidationResult(
                "A booking is required.",
                [nameof(BookingId)]);
        }
    }
}

public sealed class CreateVehicleRequest : IValidatableObject
{
    public Guid? SupplierId { get; init; }

    [Required, StringLength(160)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(40)]
    public string RegistrationNumber { get; init; } = string.Empty;

    [Range(1, 100)]
    public int Capacity { get; init; }

    [StringLength(1000)]
    public string? Notes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(RegistrationNumber))
        {
            yield return new ValidationResult(
                "Vehicle name and registration number are required.",
                [nameof(Name), nameof(RegistrationNumber)]);
        }
    }
}

public sealed class CreateDriverRequest
{
    [Required, StringLength(160)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(40)]
    public string Phone { get; init; } = string.Empty;

    [StringLength(80)]
    public string? LicenceNumber { get; init; }
}

public sealed class CreateGuideRequest
{
    [Required, StringLength(160)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(40)]
    public string Phone { get; init; } = string.Empty;

    [StringLength(300)]
    public string? Languages { get; init; }
}

public sealed class CreateArrivalRequest : IValidatableObject
{
    public Guid BookingId { get; init; }

    public DateTimeOffset ArrivalAtUtc { get; init; }

    [Required, StringLength(120)]
    public string Airport { get; init; } = string.Empty;

    [StringLength(30)]
    public string? FlightNumber { get; init; }

    [StringLength(1000)]
    public string? Notes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (BookingId == Guid.Empty || ArrivalAtUtc == default || string.IsNullOrWhiteSpace(Airport))
        {
            yield return new ValidationResult(
                "Booking, arrival time, and airport are required.",
                [nameof(BookingId), nameof(ArrivalAtUtc), nameof(Airport)]);
        }
    }
}

public sealed class CreateBookingResourceAssignmentRequest : IValidatableObject
{
    public Guid BookingId { get; init; }

    public DateOnly ServiceDate { get; init; }

    public Guid? VehicleId { get; init; }

    public Guid? DriverId { get; init; }

    public Guid? GuideId { get; init; }

    [StringLength(1000)]
    public string? Notes { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (BookingId == Guid.Empty || ServiceDate == default)
        {
            yield return new ValidationResult(
                "Booking and service date are required.",
                [nameof(BookingId), nameof(ServiceDate)]);
        }

        if (VehicleId is null && DriverId is null && GuideId is null)
        {
            yield return new ValidationResult(
                "Assign at least one vehicle, driver, or guide.",
                [nameof(VehicleId), nameof(DriverId), nameof(GuideId)]);
        }
    }
}

public interface ISupplierOperationsRecords
{
    Task<PagedResponse<SupplierResponse>> GetSuppliersAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<SupplierResponse> CreateSupplierAsync(
        CreateSupplierRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<OperationTaskResponse>> GetTasksAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<OperationTaskResponse> CreateTaskAsync(
        CreateOperationTaskRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<VehicleResponse>> GetVehiclesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<VehicleResponse> CreateVehicleAsync(
        CreateVehicleRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<DriverResponse>> GetDriversAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<DriverResponse> CreateDriverAsync(
        CreateDriverRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<GuideResponse>> GetGuidesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<GuideResponse> CreateGuideAsync(
        CreateGuideRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<ArrivalResponse>> GetArrivalsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<ArrivalResponse> CreateArrivalAsync(
        CreateArrivalRequest request,
        CancellationToken cancellationToken);

    Task<PagedResponse<BookingResourceAssignmentResponse>> GetAssignmentsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<BookingResourceAssignmentResponse> CreateAssignmentAsync(
        CreateBookingResourceAssignmentRequest request,
        CancellationToken cancellationToken);
}
