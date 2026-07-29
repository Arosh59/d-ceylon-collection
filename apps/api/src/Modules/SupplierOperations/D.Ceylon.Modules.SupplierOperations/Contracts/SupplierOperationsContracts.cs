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
}
