# Authentication and Authorization

Authentication will be integrated through an abstraction that supports a managed
identity provider. The application API remains responsible for authorization.

## Required controls

- MFA for staff accounts
- secure, HTTP-only cookies where cookies are used
- CSRF protection for cookie-authenticated mutations
- role- and policy-based authorization
- customer-record ownership checks
- agent-organisation isolation with explicit grants for exceptions
- account lockout and anti-enumeration behavior
- refresh-token rotation if refresh tokens are introduced
- auditable security-sensitive actions

Provider selection, claim mapping, session design, token handling, recovery
flows, and policy tests are deferred to Phase 5. No authentication mechanism is
implemented in Phase 0.
