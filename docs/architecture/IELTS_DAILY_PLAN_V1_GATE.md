# W6 Gate B — IELTS Daily Plan v1

## Gate contract

This W6 slice is `VERIFIED` only when every item below belongs to the same
candidate commit:

1. `GET /api/academy/ielts/daily-plan` requires authentication.
2. The evidence query is scoped to the authenticated user, the Reading
   Diagnostic course, and completed sessions only.
3. The database projection contains only session ID, objective score counts,
   and completion time; questions, answer keys, raw answers, and explanations
   are neither selected nor returned.
4. No valid evidence returns `diagnostic-required`, an empty task list, and
   zero assigned minutes.
5. A valid latest result deterministically selects one focus level:
   - below 70%: `foundation`
   - 70% through 89%: `consolidation`
   - 90% through 100%: `maintenance`
6. A ready plan is bounded to two Reading tasks and 25 minutes.
7. Invalid zero-question or impossible-score evidence is ignored.
8. `bandEstimate` remains `null`; no official IELTS Band is inferred.
9. Backend tests/build, frontend tests/build, AI Engine tests, and lint pass in
   the complete repository CI.

## Focused verification

```bash
npm ci
npm -w apps/backend run db:generate
npm -w apps/backend run test
npm -w apps/backend run build
```

## Current boundary

The plan is a deterministic read-only view over existing completed diagnostic
evidence. It does not persist assignments, unlock Production writes, generate
AI feedback, or claim an official IELTS Band. It makes no schema migration and
is not authorized for Production deployment or Production database access.
