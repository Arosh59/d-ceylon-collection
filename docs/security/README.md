# Security Guide

Security controls are designed into each phase and verified before a feature is
considered complete.

## Baseline principles

- least privilege and deny-by-default authorization;
- customer and organisation isolation in every applicable query and mutation;
- layered validation, safe output encoding, and parameterized data access;
- secure cookies, CSRF protection, CSP, and security headers where relevant;
- rate limits for public and authentication endpoints;
- private document storage with short-lived signed access;
- no storage of card numbers, CVV values, or raw payment credentials;
- redaction of passwords, tokens, passport data, card data, and documents from
  logs;
- auditable security-sensitive activity;
- secrets supplied by local or managed secret stores, never source control;
- dependency, static, secret, and container scanning in CI; and
- documented retention, backup, restore, and incident practices.

See the current [threat model](threat-model.md), [customer privacy guide](../privacy.md), and root
[security policy](../../SECURITY.md). Control implementation evidence will be
added alongside the relevant phase.
