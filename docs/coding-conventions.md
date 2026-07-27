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

## C#

- Enable nullable reference types.
- Treat warnings as errors in CI where practical.
- Expose DTOs rather than Entity Framework entities.
- Use asynchronous APIs for I/O and accept cancellation tokens.
- Enforce authorization and validation in the server boundary.

## Python

- Use type annotations and automated formatting, linting, and tests.
- Keep the AI service isolated from the production database.
- Do not grant AI tools authority to finalize prices, availability, bookings, or
  payments.

Concrete formatter and linter commands will be added with each application
scaffold.
