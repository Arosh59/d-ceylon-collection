# Coding Conventions

## General

- Prefer clear module boundaries and small, reviewable changes.
- Store timestamps in UTC and use UUID identifiers.
- Never commit secrets or log sensitive data.
- Validate untrusted input at every trust boundary.
- Update documentation and tests with behavior changes.

## TypeScript and React

- Enable strict TypeScript.
- Prefer accessible semantic HTML and reusable components.
- Support keyboard use and `prefers-reduced-motion`.
- Keep server-only values out of browser bundles.
- Use Framer Motion only as restrained progressive enhancement.

The Phase 4 frontend uses Prettier, ESLint, strict TypeScript, Vitest, Testing
Library, axe-core, and Playwright. Run the frontend gate from the repository
root:

```bash
npm run format:check
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:web:a11y
```

## NestJS backend

- Keep strict TypeScript enabled and expose API DTOs rather than Prisma records.
- Use parameterized Prisma queries and preserve database ownership boundaries.
- Keep operation IDs and response behavior synchronized with the canonical OpenAPI document.
- Use asynchronous APIs for I/O.
- Enforce authorization and validation in the server boundary.

## Python

- Use type annotations and automated formatting, linting, and tests.
- Keep the AI service isolated from the production database.
- Do not grant AI tools authority to finalize prices, availability, bookings, or
  payments.

Each later application must add equivalent, application-specific commands when
its scaffold is introduced.
