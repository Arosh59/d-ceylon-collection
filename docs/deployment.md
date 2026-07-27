# Deployment Guide

Azure-compatible deployment configuration is planned for the production
hardening phase.

The production design must cover:

- independently deployable web, admin, API, Directus, and future AI workloads;
- managed PostgreSQL, Redis, private object storage, and secret management;
- private networking and least-privilege managed identities;
- TLS, security headers, health probes, scaling, and structured telemetry;
- controlled EF Core migration execution;
- immutable, scanned build artifacts;
- reviewed promotion between environments; and
- rollback, disaster recovery, and release verification.

No deployment resources or automated deployments exist in Phase 0. Unreviewed
pull requests must never deploy.
