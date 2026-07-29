# Isolated AI Gateway Skeleton

This Phase 14 service is an authenticated FastAPI boundary for future draft assistance. It has no
database driver, database connection setting, booking/payment operation, or direct customer access.
The ASP.NET Core API must authenticate and authorise every future request before forwarding a
minimum necessary, approved context to this service.

The only draft endpoint returns a clearly labelled human-review result. It cannot confirm live
availability, set a final price, create/cancel a booking, charge a payment method, or persist a
conversation. Tool interfaces are declared but intentionally have no implementation.

Set only `AI_GATEWAY_SHARED_SECRET`, `BACKEND_API_BASE_URL`, and retention settings through the
deployment secret store. The service refuses to start if the gateway secret is weak, a database-like
environment setting is present, or the backend URL is invalid.
