# Supplier and Operations Foundation

Phase 10 introduces a deliberately narrow, staff-only foundation for recording suppliers, arrivals,
vehicles, drivers, guides, booking-resource assignments, and booking-operation tasks. It is not a
supplier portal or an administration application.

## Module boundary

The NestJS `OperationsModule` owns access to the `supplier_operations` PostgreSQL schema and its
`Supplier`, `Vehicle`, `Driver`, `Guide`, `Arrival`, `BookingResourceAssignment`, and
`BookingOperationTask` records. It performs a narrow, read-only booking status lookup before
creating booking-linked operational records.

The versioned API is restricted to the `staff` policy:

- `GET` and `POST` `/api/v1/operations/suppliers`;
- `GET` and `POST` `/api/v1/operations/tasks`.
- `GET` and `POST` `/api/v1/operations/vehicles`;
- `GET` and `POST` `/api/v1/operations/drivers`;
- `GET` and `POST` `/api/v1/operations/guides`;
- `GET` and `POST` `/api/v1/operations/arrivals`; and
- `GET` and `POST` `/api/v1/operations/assignments`.

Creating a task, arrival, or assignment confirms that the referenced booking exists and rejects
cancelled or refunded bookings. Vehicles may reference only active suppliers; assignments may
reference only active vehicles, drivers, and guides. Lookup, status, date, and booking-resource
indexes support staff queues without exposing Booking persistence. Successful writes record a
security audit event and retain the established correlation ID and Problem Details behaviour.

## Protected portal

`/portal/operations` is server-side authenticated for the `staff` role. It uses the generated SDK
and retains its bearer token only in the server-side session boundary. The page presents paginated
supplier, task, vehicle, driver, guide, arrival, and assignment summaries, including accessible
empty states.

## Explicit limitations

This foundation does not implement supplier login or self-service, supplier availability,
assignment/fulfilment status changes, booking changes, payment capture, administration, Directus,
or customer credentials. It must not be used to imply live availability or booking fulfilment.
