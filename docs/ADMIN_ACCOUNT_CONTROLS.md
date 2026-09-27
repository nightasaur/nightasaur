# Account administration

ADMIN members can search accounts, filter by status, suspend or restore ordinary accounts, revoke their sessions, and read the latest 50 account audit entries. The existing ADMIN account ceo@cccbuyear.com displays a CEO badge. Email alone grants nothing. All administrators, including self, are protected against these actions.

Suspension/restoration and session revocation require a reason. Account state, revoked sessions and audit insertion share one database transaction. Existing profiles, spirits and content remain intact; restoration requires fresh login. The API deliberately has no permanent-account-removal operation. PostgreSQL migration also rejects users DELETE/TRUNCATE and audit modification/deletion/truncation. Database owners with schema-altering credentials remain responsible for infrastructure access; application administrators have no such interface.

## Deployment

Migration: apps/backend/prisma/postgresql/migrations/20260920000100_account_administration/migration.sql. Additive account_audits table/index and protection triggers; no existing account records are removed. Apply the reviewed migration before enabling the new API, with the existing production migration procedure. Current Railway pre-deploy runs only deploy/verify-production-ai.mjs and does not apply migrations. Do not claim the management page is deployed based on frontend readiness alone.

Canonical SQLite schema is for isolated tests; PostgreSQL schema is synchronized using scripts/sync-postgres-schema.mjs. Prisma db push does not install database triggers; migration SQL is required. CI verifies PostgreSQL migrations and deletion/truncation guards.

## Verification

Real isolated HTTP tests cover ordinary-user rejection, active-admin checks, self/admin protection, blank reason rejection, suspension/login denial, session revocation on restoration, immutable data, duplicate transition conflicts, audit failure rollback and DELETE rejection. Frontend tests cover role gating and confirmation. Local browser 390px verifies CEO navigation and synthetic account suspension/restoration. No production accounts were suspended.
