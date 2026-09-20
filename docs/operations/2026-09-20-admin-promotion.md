# One-time administrator promotion — 2026-09-20

- Target: `ceo@cccbuyear.com`
- Authorization: project owner explicitly approved the exact account promotion.
- Operation ID: `admin-promotion-20260920-ceo`
- Execution boundary: Railway Production Backend pre-deploy CLI; no public API.
- Data boundary: update only the exact account role to `ADMIN`; preserve all other account and related data.
- Audit boundary: persistent `operational_audit_logs` row plus structured deployment event.
- Cleanup requirement: remove the one-time CLI, command, temporary variables, and restore the standard AI verification pre-deploy command immediately after success.

Status: scheduled; completion evidence is recorded in Railway deployment logs and the database audit row.
