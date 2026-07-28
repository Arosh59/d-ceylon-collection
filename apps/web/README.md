# Public Web Application

`apps/web` is the accessible public Next.js App Router host for D Ceylon Collection. Phase 3
establishes the visual and integration foundation only; catalogue data, filters, search,
authentication, quote requests, and commerce workflows remain assigned to later phases.

## Runtime and configuration

Use Node.js 24 LTS and the npm version declared by the root `packageManager` field. Install the
exact workspace dependency graph from the repository root:

```bash
npm ci
```

The server requires:

- `API_BASE_URL` — server-only origin of the ASP.NET Core API; and
- `SITE_URL` — canonical public origin used by metadata, robots, and sitemap generation.

Copy `apps/web/.env.example` to `apps/web/.env.local` for normal local development. Real environment
files are ignored. Neither value is exposed through a `NEXT_PUBLIC_*` variable.

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
- `/catalogue` — live read-only API catalogue with populated or empty states;
- `/catalogue/[slug]` — live product-detail foundation;
- `/collections`, `/destinations`, `/experiences`, and `/accommodation` — accessible placeholders
  for Phase 4;
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
