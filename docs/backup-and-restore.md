# Backup and Restore Guide

PostgreSQL transactional and editorial data, deployment configuration, and encryption key
dependencies require a tested backup and restore plan. Application startup never changes a
database; restore and migration actions are controlled operations.

## Local restore exercise

With local infrastructure running, this command takes a plain PostgreSQL backup of the application
database, restores it into a uniquely named temporary database, verifies migration and table
integrity, and drops only that temporary database on exit. The backup is retained in the operating
system temporary directory for inspection.

```bash
DCEYLON_CONFIRM_LOCAL_RESTORE_EXERCISE=yes ./scripts/verify-local-backup-restore.sh
```

It never drops the application database. It is not a substitute for a production
restore exercise, which must use approved encrypted backups, separate infrastructure, and an
observed application smoke test.

Before production launch, this guide must define:

- backup scope, frequency, encryption, retention, and ownership;
- recovery point and recovery time objectives;
- off-site and cross-region strategy;
- restore prerequisites and exact tested commands;
- integrity verification and application smoke tests;
- key and secret recovery dependencies;
- evidence retention for scheduled restore exercises; and
- escalation and incident communication.

A backup is not considered reliable until a representative restore has been completed and verified
in an isolated environment.
