# Authentication and Authorization

Phase 5 integrates standards-based external OpenID Connect authentication. The identity provider
authenticates users and issues access tokens; the ASP.NET Core API remains authoritative for
authorization, organisation isolation, customer ownership, and security audit records. D Ceylon does
not store passwords.

## API token validation

`Authentication:External` is required outside tests and is supplied through environment
configuration or a managed secret/configuration service. The API validates:

- the configured issuer and audience;
- the signature against provider-published signing keys;
- token expiry, signing, and lifetime with a maximum five-minute configurable clock skew;
- required `sub`, `jti`, and `iat` claims; and
- configured role, permission, organisation, and customer claim mappings.

Issuer and authority values must use HTTPS in Production. Loopback HTTP is accepted only in
Development. Access tokens—not ID tokens—authorize API calls. Never commit client secrets, signing
material, or tokens.

The authorization fallback policy requires an authenticated identity. Public catalogue, OpenAPI,
root, liveness, and readiness routes opt out explicitly. Named policies cover customer, agent,
staff, and administrator access. Customer and agent resources perform an additional server-side
owner or organisation-ID check; UI filtering is never considered an authorization boundary.

## Web session

The Next.js application uses `next-auth` with an external OIDC provider, PKCE, state and nonce
validation, and an encrypted HTTP-only, SameSite=Lax session cookie. The API bearer token remains
only in the encrypted server-side session token and is not included in the browser-visible session
response. Production cookies are secure and use the `__Secure-` prefix.

Sign-in, sign-up, and callback processing live under `/api/auth`, with accessible entry, error,
unauthorized, and forbidden routes under `/auth`. The public `/auth/sign-up` route does not collect
credentials: it redirects to Auth0 Universal Login with `screen_hint=signup` and `prompt=login`.
Configure customer self-registration and email verification in the identity provider; other OIDC
providers may use their own registration parameter or hosted registration flow. Redirects accept
only same-origin or application-relative targets. Customer and agent layouts check the session role
before rendering, then call the generated API client so the API independently validates the token
and ownership boundary. Logout clears the session and returns to the public site.

Required server-only web settings are documented in `apps/web/.env.example`. `AUTH_SECRET`,
`AUTH_CLIENT_SECRET`, and provider credentials must come from a secret store and must never use
`NEXT_PUBLIC_*`.

## Isolated testing authentication

Deterministic customer, agent, staff, and administrator personas exist only for automated tests:

- ASP.NET registers the HMAC test issuer and token endpoint only when
  `ASPNETCORE_ENVIRONMENT=Testing`;
- Next.js registers the test credentials provider only when `APP_ENVIRONMENT=Testing`;
- both sides require independent keys of at least 32 characters;
- startup fails when required test configuration is absent or test settings are supplied to another
  web environment; and
- the API test-token route is omitted from OpenAPI and uses the stricter authentication rate-limit
  policy.

These fixtures are not a password store and must never be exposed on a shared or production
deployment.

## Remaining provider controls

The selected managed provider must enforce MFA for staff and administrators, account recovery,
lockout, anti-enumeration, credential monitoring, and signing key rotation. Refresh-token rotation
and revocation must be designed before any refresh token is retained. Cookie-authenticated mutation
routes must retain NextAuth CSRF protection and add feature-specific anti-replay controls.
