# Production Readiness and Release Checklist

## Required release gates

- Run locked restores, dependency audits, formatting, type checks, linting, unit, integration,
  accessibility, browser, migration, OpenAPI, and production-build checks in CI.
- Verify the release uses managed identity or Key Vault references for all secrets. No connection
  string, OIDC secret, Directus token, payment secret, or AI gateway secret may be in an image,
  workflow log, or Bicep parameter.
- Apply reviewed migrations once through a controlled release job; verify backup freshness and a
  restore exercise before the production migration window.
- Confirm readiness/liveness probes, structured logs, correlation IDs, alert routing, rate limits,
  CSP/security headers, and rollback image availability.
- Confirm Directus roles, public-read collection fields, media licences, retention policy, staff
  MFA, payment-provider webhook secrets, and AI gateway shared-secret rotation.

## Azure baseline

`infrastructure/azure/main.bicep` creates the managed container environment anchor. The deployment
pipeline must provide container images, managed PostgreSQL/Redis/object storage, Key Vault
references, private ingress where appropriate, and least-privilege managed identities. The template
intentionally does not create a production database or accept secret values.

## Explicit operational limits

This repository contains integrations and skeletons, not a production deployment. A human release
owner must complete threat modelling, legal/privacy review, performance/load tests against approved
infrastructure, supplier/payment certification, disaster-recovery exercise, and monitoring
on-call ownership before launch.
