# Public Web Application

`apps/web` is the accessible public Next.js App Router host for D Ceylon Collection. Phases 3 and
4 establish the visual foundation and public read-only catalogue discovery. Authentication, quote
requests, administration, and commerce workflows remain assigned to later phases.

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
- `/catalogue` — searchable, filterable, paginated live catalogue;
- `/catalogue/[slug]` — published product detail with relationships and media metadata;
- `/collections` and `/collections/[slug]` — five collection perspectives and linked products;
- `/destinations` and `/destinations/[slug]` — published places and linked products;
- `/experiences` and `/accommodation` — typed product-type discovery;
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

All catalogue calls run at the server boundary. Filters use native GET form controls, pagination
preserves active filters, and media placeholders render from stable API metadata without licensed
image assets.
