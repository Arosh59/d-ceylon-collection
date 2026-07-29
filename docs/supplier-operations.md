# Supplier and Operations Foundation

Phase 10 introduces a deliberately narrow, staff-only foundation for recording suppliers and
booking-operation tasks. It is not a supplier portal or an administration application.

## Module boundary

`D.Ceylon.Modules.SupplierOperations` owns the `supplier_operations` PostgreSQL schema and its
`Supplier` and `BookingOperationTask` records. It references booking data only through the stable
`IBookingOperationsSources` contract; it does not access Booking persistence entities or tables.

The versioned API is restricted to the `staff` policy:

- `GET` and `POST` `/api/v1/operations/suppliers`;
- `GET` and `POST` `/api/v1/operations/tasks`.

Creating a task confirms that the referenced booking exists and rejects cancelled or refunded
bookings. If present, a supplier reference must identify an active supplier. Successful writes
record a security audit event and retain the established correlation ID and Problem Details
behaviour.

## Protected portal

`/portal/operations` is server-side authenticated for the `staff` role. It uses the generated SDK
and retains its bearer token only in the server-side session boundary. The page presents paginated
supplier and task summaries, including accessible empty states.

## Explicit limitations

This foundation does not implement supplier login or self-service, supplier availability,
assignment/fulfilment workflows, booking changes, payment capture, administration, Directus, or
customer credentials. It must not be used to imply live availability or booking fulfilment.
