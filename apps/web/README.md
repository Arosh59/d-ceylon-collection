# Public Web Application

`apps/web` is the accessible public Next.js App Router host for D Ceylon Collection. Phases 3
through 7 establish the visual foundation, public catalogue discovery, external OIDC session,
protected customer and agent boundaries, and customer-owned profile, traveller, wishlist, and
saved-itinerary foundations plus deterministic draft planning. Quotes, administration, and commerce
remain later phases.

## Runtime and configuration

Use Node.js 24 LTS and the npm version declared by the root `packageManager` field. Install the
exact workspace dependency graph from the repository root:

```bash
npm ci
```

The server requires:

- `API_BASE_URL` — server-only origin of the ASP.NET Core API; and
- `SITE_URL` — canonical public origin used by metadata, robots, and sitemap generation;
- `APP_ENVIRONMENT` — `Development`, `Production`, or isolated `Testing`;
- `AUTH_ISSUER`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, and `AUTH_SCOPE` — external OIDC
  integration; and
- `AUTH_SECRET` — at least 32 random characters for encrypted session state.

Copy `apps/web/.env.example` to `apps/web/.env.local` for normal local development. Real environment
files are ignored. None of these values is exposed through a `NEXT_PUBLIC_*` variable. Production
requires an HTTPS issuer. `AUTH_TEST_ENDPOINT_KEY` is accepted only in `Testing`.

## Commands

Run from the repository root:

```bash
npm run dev:web
npm run format:check
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
npm run build:web
./scripts/web-acceptance.sh
```

The live acceptance command requires Docker and local Google Chrome. CI should install Playwright
Chromium and set `CI=true`, which makes the suite use the bundled browser instead of the local
Chrome channel.

## Routes and states

- `/` — premium homepage foundation and five collection perspectives;
- `/catalogue` — searchable, filterable, paginated live catalogue;
- `/catalogue/[slug]` — published product detail with relationships and media metadata;
- `/collections` and `/collections/[slug]` — five collection perspectives and linked products;
- `/destinations` and `/destinations/[slug]` — published places and linked products;
- `/experiences` and `/accommodation` — typed product-type discovery;
- `/auth/sign-in`, `/auth/error`, `/auth/unauthorized`, and `/auth/forbidden` — accessible
  authentication states with validated same-origin redirects;
- `/portal/customer` — protected customer overview;
- `/portal/customer/profile` — profile/contact preference create, read, update, and delete;
- `/portal/customer/travellers` and child routes — paginated traveller list/detail/create/edit;
- `/portal/customer/wishlist` — paginated catalogue shortlist with note editing;
- `/portal/customer/saved-itineraries` and child routes — metadata-only list/detail/create/edit;
- `/portal/customer/travel-plans` and `/new` — paginated drafts and accessible planner input;
- `/portal/customer/travel-plans/[id]` and `/edit` — draft review, generation, day/item editing,
  reordering, input review, regeneration, and conflict/not-found states;
- `/portal/agent` — protected agent organisation foundation;
- `loading.tsx`, `error.tsx`, and `not-found.tsx` — explicit loading, recovery, and unknown-route
  experiences; and
- `/robots.txt` and `/sitemap.xml` — metadata foundations.

The layout includes a skip link, semantic landmarks, desktop and mobile navigation, visible focus
treatment, reduced-motion behavior, responsive type and spacing, security headers, and correlation
response headers.

## API contract

The web application imports response types from `@dceylon/sdk`. Those types are generated from
`packages/sdk/openapi/v1.json`; no backend domain entity is redeclared in the frontend.

With the API running:

```bash
API_BASE_URL=http://127.0.0.1:8080 npm run sdk:verify
npm run sdk:generate
```

The first command fails when the committed snapshot differs semantically from the live versioned
API. The second regenerates TypeScript types from the reviewed snapshot.

All catalogue and protected customer calls run at the server boundary. The encrypted, HTTP-only
session retains the provider access token without adding it to the browser-visible session DTO.
Server actions use generated OpenAPI request/response types, enforce the authenticated API boundary,
surface validation/concurrency Problem Details, and preserve correlation IDs. Filters use native GET
form controls, pagination preserves active filters, and media placeholders render from stable API
metadata without licensed image assets.

Planning pages use the same server-only token boundary and generated contracts. They label every
result as a draft without availability, final price, quote, bookability, or booking confirmation.
See the repository [planner rules and limitations](../../docs/planner-limitations.md).
