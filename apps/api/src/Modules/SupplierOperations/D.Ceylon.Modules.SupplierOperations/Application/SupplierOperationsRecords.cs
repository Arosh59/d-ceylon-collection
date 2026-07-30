using D.Ceylon.BuildingBlocks.Pagination;
using D.Ceylon.Modules.Bookings.Contracts;
using D.Ceylon.Modules.SupplierOperations.Contracts;
using D.Ceylon.Modules.SupplierOperations.Domain;
using D.Ceylon.Modules.SupplierOperations.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.SupplierOperations.Application;

internal sealed class SupplierOperationsRecords(
    SupplierOperationsDbContext database,
    IBookingOperationsSources bookingSources)
    : ISupplierOperationsRecords
{
    public async Task<PagedResponse<SupplierResponse>> GetSuppliersAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Suppliers.AsNoTracking();
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderBy(supplier => supplier.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            entities.Select(ToResponse).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<SupplierResponse> CreateSupplierAsync(
        CreateSupplierRequest request,
        CancellationToken cancellationToken)
    {
        var supplier = new Supplier(
            Guid.NewGuid(),
            request.Name,
            request.Category,
            request.ContactName,
            request.ContactEmail);

        database.Suppliers.Add(supplier);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(supplier);
    }

    public async Task<PagedResponse<OperationTaskResponse>> GetTasksAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = database.Tasks.AsNoTracking();
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .OrderBy(task => task.DueDate)
            .ThenBy(task => task.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse.Create(
            entities.Select(ToResponse).ToArray(),
            pageNumber,
            pageSize,
            total);
    }

    public async Task<OperationTaskResponse> CreateTaskAsync(
        CreateOperationTaskRequest request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingSources.GetOperationsSourceAsync(
            request.BookingId,
            cancellationToken);
        if (booking is null)
        {
            throw new SupplierOperationsNotFoundException(
                "The booking reference was not found.");
        }

        if (booking.Status is "cancelled" or "refunded")
        {
            throw new SupplierOperationsConflictException(
                "An operation task cannot be created for a cancelled or refunded booking.");
        }

        if (request.SupplierId is { } supplierId
            && !await database.Suppliers.AnyAsync(
                supplier => supplier.Id == supplierId && supplier.Status == "active",
                cancellationToken))
        {
            throw new SupplierOperationsNotFoundException(
                "The active supplier reference was not found.");
        }

        var task = new BookingOperationTask(
            Guid.NewGuid(),
            booking.BookingId,
            request.SupplierId,
            request.Title,
            request.DueDate,
            request.Notes);

        database.Tasks.Add(task);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(task);
    }

    public async Task<PagedResponse<VehicleResponse>> GetVehiclesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        await PageAsync(
            database.Vehicles.AsNoTracking().OrderBy(vehicle => vehicle.Name),
            ToResponse,
            pageNumber,
            pageSize,
            cancellationToken);

    public async Task<VehicleResponse> CreateVehicleAsync(
        CreateVehicleRequest request,
        CancellationToken cancellationToken)
    {
        if (request.SupplierId is { } supplierId && !await IsActiveSupplierAsync(supplierId, cancellationToken))
        {
            throw new SupplierOperationsNotFoundException("The active supplier reference was not found.");
        }

        var vehicle = new Vehicle(
            Guid.NewGuid(),
            request.SupplierId,
            request.Name,
            request.RegistrationNumber,
            request.Capacity,
            request.Notes);
        database.Vehicles.Add(vehicle);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(vehicle);
    }

    public async Task<PagedResponse<DriverResponse>> GetDriversAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        await PageAsync(
            database.Drivers.AsNoTracking().OrderBy(driver => driver.Name),
            ToResponse,
            pageNumber,
            pageSize,
            cancellationToken);

    public async Task<DriverResponse> CreateDriverAsync(
        CreateDriverRequest request,
        CancellationToken cancellationToken)
    {
        var driver = new Driver(Guid.NewGuid(), request.Name, request.Phone, request.LicenceNumber);
        database.Drivers.Add(driver);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(driver);
    }

    public async Task<PagedResponse<GuideResponse>> GetGuidesAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        await PageAsync(
            database.Guides.AsNoTracking().OrderBy(guide => guide.Name),
            ToResponse,
            pageNumber,
            pageSize,
            cancellationToken);

    public async Task<GuideResponse> CreateGuideAsync(
        CreateGuideRequest request,
        CancellationToken cancellationToken)
    {
        var guide = new Guide(Guid.NewGuid(), request.Name, request.Phone, request.Languages);
        database.Guides.Add(guide);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(guide);
    }

    public async Task<PagedResponse<ArrivalResponse>> GetArrivalsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        await PageAsync(
            database.Arrivals.AsNoTracking().OrderBy(arrival => arrival.ArrivalAtUtc),
            ToResponse,
            pageNumber,
            pageSize,
            cancellationToken);

    public async Task<ArrivalResponse> CreateArrivalAsync(
        CreateArrivalRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureOperationalBookingAsync(request.BookingId, cancellationToken);
        var arrival = new Arrival(
            Guid.NewGuid(),
            request.BookingId,
            request.ArrivalAtUtc,
            request.Airport,
            request.FlightNumber,
            request.Notes);
        database.Arrivals.Add(arrival);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(arrival);
    }

    public async Task<PagedResponse<BookingResourceAssignmentResponse>> GetAssignmentsAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken) =>
        await PageAsync(
            database.Assignments.AsNoTracking()
                .OrderBy(assignment => assignment.ServiceDate)
                .ThenBy(assignment => assignment.CreatedAtUtc),
            ToResponse,
            pageNumber,
            pageSize,
            cancellationToken);

    public async Task<BookingResourceAssignmentResponse> CreateAssignmentAsync(
        CreateBookingResourceAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureOperationalBookingAsync(request.BookingId, cancellationToken);

        if (request.VehicleId is { } vehicleId
                && !await database.Vehicles.AnyAsync(
                    vehicle => vehicle.Id == vehicleId && vehicle.Status == "active",
                    cancellationToken)
            || request.DriverId is { } driverId
                && !await database.Drivers.AnyAsync(
                    driver => driver.Id == driverId && driver.Status == "active",
                    cancellationToken)
            || request.GuideId is { } guideId
                && !await database.Guides.AnyAsync(
                    guide => guide.Id == guideId && guide.Status == "active",
                    cancellationToken))
        {
            throw new SupplierOperationsNotFoundException(
                "An active vehicle, driver, or guide reference was not found.");
        }

        var assignment = new BookingResourceAssignment(
            Guid.NewGuid(),
            request.BookingId,
            request.ServiceDate,
            request.VehicleId,
            request.DriverId,
            request.GuideId,
            request.Notes);
        database.Assignments.Add(assignment);
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(assignment);
    }

    private async Task EnsureOperationalBookingAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        var booking = await bookingSources.GetOperationsSourceAsync(bookingId, cancellationToken);
        if (booking is null)
        {
            throw new SupplierOperationsNotFoundException("The booking reference was not found.");
        }

        if (booking.Status is "cancelled" or "refunded")
        {
            throw new SupplierOperationsConflictException(
                "Operations cannot be scheduled for a cancelled or refunded booking.");
        }
    }

    private Task<bool> IsActiveSupplierAsync(Guid supplierId, CancellationToken cancellationToken) =>
        database.Suppliers.AnyAsync(
            supplier => supplier.Id == supplierId && supplier.Status == "active",
            cancellationToken);

    private static async Task<PagedResponse<TResponse>> PageAsync<TEntity, TResponse>(
        IOrderedQueryable<TEntity> query,
        Func<TEntity, TResponse> map,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
        where TEntity : class
    {
        var total = await query.LongCountAsync(cancellationToken);
        var entities = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return PagedResponse.Create(entities.Select(map).ToArray(), pageNumber, pageSize, total);
    }

    private static SupplierResponse ToResponse(Supplier supplier) => new(
        supplier.Id,
        supplier.Name,
        supplier.Category,
        supplier.ContactName,
        supplier.ContactEmail,
        supplier.Status,
        supplier.ConcurrencyToken);

    private static OperationTaskResponse ToResponse(BookingOperationTask task) => new(
        task.Id,
        task.BookingId,
        task.SupplierId,
        task.Title,
        task.Status,
        task.DueDate,
        task.Notes,
        task.ConcurrencyToken);

    private static VehicleResponse ToResponse(Vehicle vehicle) => new(
        vehicle.Id,
        vehicle.SupplierId,
        vehicle.Name,
        vehicle.RegistrationNumber,
        vehicle.Capacity,
        vehicle.Status,
        vehicle.Notes,
        vehicle.ConcurrencyToken);

    private static DriverResponse ToResponse(Driver driver) => new(
        driver.Id,
        driver.Name,
        driver.Phone,
        driver.LicenceNumber,
        driver.Status,
        driver.ConcurrencyToken);

    private static GuideResponse ToResponse(Guide guide) => new(
        guide.Id,
        guide.Name,
        guide.Phone,
        guide.Languages,
        guide.Status,
        guide.ConcurrencyToken);

    private static ArrivalResponse ToResponse(Arrival arrival) => new(
        arrival.Id,
        arrival.BookingId,
        arrival.ArrivalAtUtc,
        arrival.Airport,
        arrival.FlightNumber,
        arrival.Status,
        arrival.Notes,
        arrival.ConcurrencyToken);

    private static BookingResourceAssignmentResponse ToResponse(BookingResourceAssignment assignment) => new(
        assignment.Id,
        assignment.BookingId,
        assignment.ServiceDate,
        assignment.VehicleId,
        assignment.DriverId,
        assignment.GuideId,
        assignment.Status,
        assignment.Notes,
        assignment.ConcurrencyToken);
}
