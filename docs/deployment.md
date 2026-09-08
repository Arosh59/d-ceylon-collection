# Deployment Guide

See [production readiness](production-readiness.md) for release gates. Secrets must come from the
deployment secret store and must never be copied into an image or committed environment file.

## Backend stack

Deploy `infrastructure/docker/compose.production.yaml`, populate every value in
`infrastructure/docker/.env.production.example`, and route the API hostname to service `api` on port
`8080`. The one-shot migration service applies reviewed Prisma migrations before API startup.

The backend needs a unique `JWT_ACCESS_SECRET`, Firebase Admin service-account values, SMTP
credentials, and the public HTTPS `PASSWORD_RESET_URL`. Preserve `FIREBASE_PRIVATE_KEY` newlines as
escaped `\n` when the deployment UI stores one-line values. Never expose this key to Next.js.

Verify `/health/ready`, then run the administrator bootstrap command from a trusted one-off backend
shell as documented in [authentication](authentication.md). Remove the bootstrap password from the
environment immediately afterward.

## Firebase

Create one Firebase project and enable only Google under Authentication > Sign-in method. Add the
local, public-web, and admin hosts to Authorized domains. Register both frontend apps; they may use
the same Firebase project, but each deployment must receive the correct Web configuration as
`NEXT_PUBLIC_FIREBASE_*` Docker build arguments.

## Public web and admin applications

Build from the repository root with `frontend/web/Dockerfile` or `frontend/admin/Dockerfile`.
Configure these server-side runtime values:

```dotenv
APP_ENVIRONMENT=Production
API_BASE_URL=https://api.example.com
SITE_URL=https://www.example.com
```

Configure these public Firebase values at image build time:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Route the public web image to port `3000` and admin image to port `3001`. The two applications use
separate secure HTTP-only cookie names. `API_BASE_URL` must be reachable from each container; use
the public HTTPS API origin when services do not share a private Docker network.

Before frontend rollout, verify:

```text
https://api.example.com/health/ready
https://api.example.com/api/v1/catalogue/destinations?pageSize=1
```

Deploy backend and migrations first, then web and admin. Validate password login, Google login,
refresh, logout, reset email, customer access, and administrator rejection/acceptance. Remove old
legacy identity-provider variables and rotate any previously exposed session, provider, or API
secrets.

Never use `prisma migrate reset` or `prisma db push` against an existing environment. Production
also requires managed backups, TLS, image scanning, monitoring, rollback, and disaster recovery.
