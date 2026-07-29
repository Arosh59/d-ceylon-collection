using D.Ceylon.BuildingBlocks.Domain;

namespace D.Ceylon.Modules.SupplierOperations.Domain;

public sealed class Supplier : AuditableEntity
{
    private Supplier()
    {
    }

    public Supplier(
        Guid id,
        string name,
        string category,
        string? contactName,
        string? contactEmail)
        : base(id)
    {
        Name = name.Trim();
        Category = category.Trim();
        ContactName = contactName?.Trim();
        ContactEmail = contactEmail?.Trim();
        Status = "active";
    }

    public string Name { get; private set; } = string.Empty;

    public string Category { get; private set; } = string.Empty;

    public string? ContactName { get; private set; }

    public string? ContactEmail { get; private set; }

    public string Status { get; private set; } = string.Empty;
}

public sealed class BookingOperationTask : AuditableEntity
{
    private BookingOperationTask()
    {
    }

    public BookingOperationTask(
        Guid id,
        Guid bookingId,
        Guid? supplierId,
        string title,
        DateOnly? dueDate,
        string? notes)
        : base(id)
    {
        BookingId = bookingId;
        SupplierId = supplierId;
        Title = title.Trim();
        DueDate = dueDate;
        Notes = notes?.Trim();
        Status = "open";
    }

    public Guid BookingId { get; private set; }

    public Guid? SupplierId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string Status { get; private set; } = string.Empty;

    public DateOnly? DueDate { get; private set; }

    public string? Notes { get; private set; }
}
