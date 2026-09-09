# Authentication and authorization

NestJS is the authentication and authorization authority. PostgreSQL stores users, password
credentials, external identity links, refresh sessions, roles, permissions, password reset tokens,
and audit events. Firebase is used only to prove a Google identity.

## Browser session flow

The web and admin applications expose same-origin BFF routes under `/api/auth/*`. They send login,
registration, reset, refresh, and Firebase Google token exchanges to NestJS. The BFF stores the
short-lived D Ceylon access token and rotating refresh token in separate `HttpOnly`, `SameSite=Lax`
cookies. Production cookies use `Secure`. Browser JavaScript never receives refresh tokens and no
authentication token is stored in `localStorage`.

The web and admin applications use different cookie names. Admin exchanges are accepted only when
the current database roles include `administrator`.

## API endpoints

- `POST /api/v1/auth/register` creates a customer account.
- `POST /api/v1/auth/login` verifies a scrypt password credential.
- `POST /api/v1/auth/google` verifies a Firebase Google ID token and safely links or creates a user.
- `POST /api/v1/auth/refresh` rotates the refresh token family.
- `POST /api/v1/auth/logout` revokes the active refresh session.
- `POST /api/v1/auth/forgot-password` sends a generic, non-enumerating response and SMTP email.
- `POST /api/v1/auth/reset-password` consumes a single-use reset token and revokes active sessions.
- `POST /api/v1/auth/change-password` replaces an authenticated password and revokes active
  sessions.
- `GET /api/v1/auth/me` returns current roles, permissions, customer ID, and organisation ID.

Access tokens use issuer and audience `dceylon-api` by default and expire after 15 minutes. The API
verifies signature, issuer, audience, expiry, subject, token ID, and issued-at time, then reloads
the active user and current authorization assignments from PostgreSQL. Ownership and organisation
isolation remain enforced in service code.

## Google setup

Create a Firebase project, enable Authentication > Sign-in method > Google, and add the local and
production frontend hosts under Authentication > Settings > Authorized domains. Register both web
applications and provide their `NEXT_PUBLIC_FIREBASE_*` values at Next.js build time.

Create a Firebase service account for the backend and store `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in the deployment secret store. Preserve private
key newlines as escaped `\n` characters when the platform requires a single-line value. Never add
the Admin private key to either frontend.

Only a Firebase token with Google as its sign-in provider and a verified email is accepted. Exact,
case-insensitive email matching links only one active existing user. Duplicate matches are rejected.
Google login never grants `agent`, `staff`, or `administrator` automatically.

## Administrator bootstrap

After applying migrations, run this one-off command from a trusted backend environment:

```sh
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD='replace-with-a-long-random-password' \
npm run auth:bootstrap-admin --workspace=@dceylon/backend
```

The command refuses ambiguous or inactive users, upserts a password credential, and assigns the
existing `administrator` role without removing any current roles. A bootstrapped administrator must
replace the temporary password immediately after the first sign-in. Remove the bootstrap variables
afterward and never commit a real password.

Administrator accounts can manage products, product types, categories, tags, collections,
destinations, media metadata, journal articles, contact-page content, and user roles from the admin
application. PostgreSQL remains the source of truth, protected write requests are audited, and the
last active administrator cannot be deactivated or stripped of the administrator role.

## Testing mode

The existing persona-token endpoint remains available only when `APP_ENVIRONMENT=Testing` and both
independent test keys are configured. Production cannot enable this path.
