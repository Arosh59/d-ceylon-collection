# Contributing

## Workflow

1. Start from an approved issue or implementation phase.
2. Keep changes within that phase's scope.
3. Record material architecture choices as decision records.
4. Add or update tests and documentation with implementation changes.
5. Run the applicable formatting, linting, type, test, and build checks.
6. Submit changes through a reviewed pull request.

Do not deploy unreviewed pull requests or commit credentials, personal data,
payment data, passport details, private documents, or production exports.

## Change quality

- Preserve module and ownership boundaries.
- Prefer small, reviewable commits.
- Use UTC timestamps and UUID identifiers in application models.
- Validate input at trust boundaries.
- Treat warnings as errors in CI where practical.
- Do not expose persistence entities from API endpoints.
- Document assumptions, migration steps, security impact, and rollback needs.

See [coding conventions](docs/coding-conventions.md) and the
[feature-status matrix](docs/features/status.md).
