# Disposable acceptance accounts

This operator-only lifecycle creates a fresh synthetic `USER` account and one
synthetic spirit, then previews or deletes exactly that account. It is not an
account-deletion HTTP endpoint. Existing users, including earlier QA accounts,
cannot be enrolled retroactively by email matching. No database migration.

## Operational contract

Run from a trusted checkout with dependencies installed and a Prisma client
generated for the selected database (SQLite or PostgreSQL, as in deployment).
Set `DATABASE_URL` through the existing secret channel. Independently set:

- `TEST_ACCOUNT_OPERATIONS_ENABLED=true` for this operator process only.
- `TEST_ACCOUNT_CLEANUP_KEY`: a cryptographically random secret of at least 64
  characters, retained securely until cleanup completes.
- `TEST_ACCOUNT_PASSWORD`: a unique random password of at least 24 characters
  for creation only. Never pass secrets as CLI arguments or commit them.

The receipt is signed and bound to the exact database URL, account ID, synthetic
email, username and creation time. URL/credential rotation therefore requires
preserving the original target configuration for this operation. Do not lose
the receipt or key; there is intentionally no unsafe bypass. Store receipts
outside the checkout and restrict access (POSIX mode 0600 is requested; Windows
operators must use an access-controlled directory).

```sh
node scripts/test-account-lifecycle.mjs create /secure/path/receipt.json
node scripts/test-account-lifecycle.mjs preview /secure/path/receipt.json
# Use the exact userId printed by create/preview, after checking the counts:
node scripts/test-account-lifecycle.mjs delete /secure/path/receipt.json qa_EXACT_ID
```

Creation writes the receipt exclusively before the atomic user/spirit insert.
If creation fails, the unused receipt is harmless; inspect before retrying with
a new file. Creation reports only synthetic email and user ID, never password,
key or token. It does not log into a browser or bypass browser credential rules.
Use the normal sign-in flow; stop test traffic and close its sessions before
deletion. Cleanup also revokes all persisted sessions through cascading deletion.

Preview performs no writes. Delete validates the receipt again, requires the
exact ID, locks/deactivates the account within a serializable transaction, checks
the ownership graph and deletes it. Failure rolls back all database changes.
Concurrent activity may cause a serialization error; stop it and preview again.
An already absent signed account returns `already_absent` for safe recovery.

The operation refuses changed identities/roles, cross-owner spirit/squad links,
active or queued generation tasks, external generation assets, and scheduled or
published social posts. These blockers require separate reconciliation; this
tool does not cancel workers or delete external publications. No prefix-wide,
email-wide, all-user or administrator deletion is supported.

The current cascade covers sessions, reset tokens, preferences, settings,
spirits, conversations, evolutions, upgrades, puzzle progress, squad/training,
inventory associations, quest/achievement progress, learning, locations,
hatching, AR records, generation tasks and draft social posts. Shared content
definitions remain. Schema additions to the ownership graph fail closed until
reviewed. SQLite integration tests populate every current related table and
verify another administrator, their spirit and shared definitions survive.

## Scope and rollout

Code delivery does not execute this tool in production or authorize deployment.
Validate against the target provider in an isolated environment before rollout;
the initial local evidence is SQLite, not production PostgreSQL acceptance.
This tool removes live relational data and inline generated results only. It
does not erase backups, platform request logs, third-party records or separately
stored files, and must not be represented as a general data-rights erasure tool.
Keep receipt/count-only evidence without recording credentials or user content.
After successful verification, remove the local receipt and temporary secrets
using the operator's secret-management procedure.
