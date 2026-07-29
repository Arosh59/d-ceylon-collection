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
}
