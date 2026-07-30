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

public sealed class Vehicle : AuditableEntity
{
    private Vehicle()
    {
    }

    public Vehicle(
        Guid id,
        Guid? supplierId,
        string name,
        string registrationNumber,
        int capacity,
        string? notes)
        : base(id)
    {
        SupplierId = supplierId;
        Name = name.Trim();
        RegistrationNumber = registrationNumber.Trim().ToUpperInvariant();
        Capacity = capacity;
        Notes = notes?.Trim();
        Status = "active";
    }

    public Guid? SupplierId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string RegistrationNumber { get; private set; } = string.Empty;

    public int Capacity { get; private set; }

    public string Status { get; private set; } = string.Empty;

    public string? Notes { get; private set; }
}

public sealed class Driver : AuditableEntity
{
    private Driver()
    {
    }

    public Driver(Guid id, string name, string phone, string? licenceNumber)
        : base(id)
    {
        Name = name.Trim();
        Phone = phone.Trim();
        LicenceNumber = licenceNumber?.Trim().ToUpperInvariant();
        Status = "active";
    }

    public string Name { get; private set; } = string.Empty;

    public string Phone { get; private set; } = string.Empty;

    public string? LicenceNumber { get; private set; }

    public string Status { get; private set; } = string.Empty;
}

public sealed class Guide : AuditableEntity
{
    private Guide()
    {
    }

    public Guide(Guid id, string name, string phone, string? languages)
        : base(id)
    {
        Name = name.Trim();
        Phone = phone.Trim();
        Languages = languages?.Trim();
        Status = "active";
    }

    public string Name { get; private set; } = string.Empty;

    public string Phone { get; private set; } = string.Empty;

    public string? Languages { get; private set; }

    public string Status { get; private set; } = string.Empty;
}

public sealed class Arrival : AuditableEntity
{
    private Arrival()
    {
    }

    public Arrival(
        Guid id,
        Guid bookingId,
        DateTimeOffset arrivalAtUtc,
        string airport,
        string? flightNumber,
        string? notes)
        : base(id)
    {
        BookingId = bookingId;
        ArrivalAtUtc = arrivalAtUtc;
        Airport = airport.Trim();
        FlightNumber = flightNumber?.Trim().ToUpperInvariant();
        Notes = notes?.Trim();
        Status = "expected";
    }

    public Guid BookingId { get; private set; }

    public DateTimeOffset ArrivalAtUtc { get; private set; }

    public string Airport { get; private set; } = string.Empty;

    public string? FlightNumber { get; private set; }

    public string Status { get; private set; } = string.Empty;

    public string? Notes { get; private set; }
}

public sealed class BookingResourceAssignment : AuditableEntity
{
    private BookingResourceAssignment()
    {
    }

    public BookingResourceAssignment(
        Guid id,
        Guid bookingId,
        DateOnly serviceDate,
        Guid? vehicleId,
        Guid? driverId,
        Guid? guideId,
        string? notes)
        : base(id)
    {
        BookingId = bookingId;
        ServiceDate = serviceDate;
        VehicleId = vehicleId;
        DriverId = driverId;
        GuideId = guideId;
        Notes = notes?.Trim();
        Status = "planned";
    }

    public Guid BookingId { get; private set; }

    public DateOnly ServiceDate { get; private set; }

    public Guid? VehicleId { get; private set; }

    public Guid? DriverId { get; private set; }

    public Guid? GuideId { get; private set; }

    public string Status { get; private set; } = string.Empty;

    public string? Notes { get; private set; }
}
