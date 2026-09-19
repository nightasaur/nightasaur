# Account remediation and key cutover

Status: PREPARED / NOT EXECUTED. This PR does not authorize production database access, deployment, or main merge. No production accounts have been inspected, disabled, or verified safe. No secret values were retrieved or rotated.

## Preconditions and responsible operator

The release owner must name the environment, deployed commit, service IDs, maintenance window, rollback owner, and exact scope of approved changes. Review inherited/shared variable **names and references**, without printing values. A service-level variable list alone cannot prove that a runtime secret is absent. Review existing staged cloud changes separately; never apply unrelated staged changes as part of this cutover.

An authorized account owner must supply exact target user IDs and a separate recovery administrator through a private operations channel, not a public issue. Verify the recovery administrator can actually sign in using an individually issued credential and has a secured recovery method. An active ADMIN database flag alone does not prove access. Do not auto-create or promote a recovery account.

## Ordered procedure (requires separate production authorization)

1. Restrict public access or enter maintenance before remediation. Take an approved, access-controlled backup and verify its recovery procedure. Preserve incident evidence privately where needed.
2. On an explicitly approved connection, invoke `remediateAccounts` from `apps/backend/src/services/accountRemediation.ts` with exact target IDs, recovery administrator ID, and `apply` omitted. It returns counts only and refuses empty, duplicate, unknown, or more than 20 targets; it refuses a recovery administrator within the target set or without active ADMIN status. Do not discover targets by exporting account lists.
3. Review the target list privately and approve the returned impact counts. Re-run with `apply: true` only for this scoped operation. One transaction disables targets, deletes their sessions, and invalidates unused password-reset tokens. It never deletes users or changes another user's credentials. Targeted account identifiers must not enter public CI or PR logs.
4. Rotate keys using the deployment secret manager. Generate each key independently using a cryptographically secure generator (at least 32 random bytes encoded for transport). Never place keys in source, command history, tickets, build artifacts, or this document. Confirm the validators accept them without logging them.
5. Deploy the reviewed backend and AI engine together under the separately approved release process. Keep ingress restricted until checks pass. The old runtime may not enforce `isActive`; deleting session rows alone does not invalidate stateless JWTs. New backend plus JWT rotation is required before reopening traffic.
6. Verify old JWTs fail, disabled accounts cannot sign in, an authorized active account can sign in, old AI service keys fail, and the new backend-to-AI credential succeeds. Use controlled operations probes with no secret or token output. Verify health, draft ownership, and that social publishing remains disabled. Record counts, revision, timestamps and pass/fail only.
7. Reopen traffic only after review. On failure retain maintenance and use a corrected release with fresh keys; never restore exposed passwords or keys. Restoring an old database backup can reactivate accounts and reset tokens: reapply remediation before reopening. Do not roll back to the unsafe default-account runtime.

## Rotation matrix

| Credential | Required action | Completion evidence |
|---|---|---|
| JWT_SECRET | New backend-only random secret; replace all replicas; force all sessions to sign in again | Old signed token rejected; new active-user token accepted |
| AI_ENGINE_API_KEY | Different random secret, shared only by backend caller and AI engine; coordinated replacement | Old credential rejected, authorized proxy works |
| Administrator credentials | Disable specifically approved legacy/shared accounts; independently secure recovery administrator | Counts-only remediation result plus private recovery sign-in verification |
| Database / Redis | Determine actual exposure and consumers with the operator; separate scoped rotation if needed | All authorized consumers migrated, old credentials revoked |
| Social / other provider tokens | Owner-managed provider revocation and reissue if exposed; keep publishing disabled | Provider-side revocation evidence; no real post required |

The helper is not exposed as an HTTP route or automatic migration. Its test uses disposable SQLite and fixture users. Production execution, identity verification, secret-manager provisioning and runtime acceptance remain operator actions. This helper does not add general session revocation to JWT authentication or replace rate limiting and incident response.
