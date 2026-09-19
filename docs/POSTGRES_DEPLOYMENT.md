# PostgreSQL production deployment model

The owner authorized production connection verification, compatible schema preparation and deployment in this session. Preserve existing records and administrator passwords. This document does not assert these actions have run.

## Separate providers and migration histories

SQLite remains the local test provider. `scripts/sync-postgres-schema.mjs` derives `apps/backend/prisma/postgresql/schema.prisma` from the canonical data model, changing the provider and preserving the observed production table name `QuestProgress` (SQLite uses `quest_progress`). `--check` prevents divergence. PostgreSQL has its own migration history; never apply SQLite migrations to it.

`Dockerfile.production` explicitly generates the PostgreSQL client. The normal Dockerfile remains SQLite-compatible. Neither startup command creates, resets or migrates tables.

## State-dependent schema procedure

Let T be the observed set of existing application tables and D the intended PostgreSQL schema.

- Unknown T: inspect database metadata through an authenticated connection first. Do not infer emptiness from a new deployment, missing Prisma history or a healthy database process.
- Empty application schema: the initial migration may be applied after confirming the target. Use `prisma migrate deploy --schema prisma/postgresql/schema.prisma` in the backend workspace.
- Existing schema: take an approved backup, compare metadata with D, and generate/review a migration from the actual state. Baseline the initial migration only if actual tables, columns, constraints and indexes match it. Never mark it applied simply to suppress an error.
- SQLite data exists: changing provider is not data conversion. Preserve account IDs and password hashes through an explicit verified migration; do not create a fresh administrator in place of an existing one.

No `db push --accept-data-loss`, `migrate reset`, blind baseline or implicit seed. Initial migration contains table/index/constraint creation, no account/password updates. Rollout must stop on migration errors. Backup/restore validation and administrator access verification remain required before switching traffic.

## Runtime release inputs

Verify the exact Git commit/source, PostgreSQL DATABASE_URL reference, JWT_SECRET, CORS_ORIGIN and appropriate backend service port. Provision secrets in the secret manager, never in repository files or logs. Set the AI endpoint/key only for a configured private AI service; absent AI capabilities remain disabled. Keep SOCIAL_PUBLISH_ENABLED=false. Use one backend replica until shared admission control and trusted-proxy topology are validated.

Inspect and separate all pre-existing staged environment changes before releasing this service. Select `Dockerfile.production`, remove legacy start/pre-deploy schema-sync commands, and health-check the deployed service. A generic health response does not prove DB connectivity: validate session-backed authorization and metadata compatibility separately. Keep the old service available for rollback; do not roll back to exposed credentials.

## Observed existing production baseline

Authenticated inspection confirmed 16 existing application tables, including legacy `QuestProgress`. Preserve that table name rather than dropping/recreating it. The reviewed diff adds its nullable `completedAt` column, three language preference booleans with defaults, a quest requirement field with default, and 20 missing tables plus their indexes/foreign keys. No account/password update is required. Production backup archive was created and its table of contents validated; this is not a restore drill. Apply only the freshly reviewed incremental SQL in one transaction with bounded lock/statement timeouts, then compare actual schema to the target before baselining migration history.
