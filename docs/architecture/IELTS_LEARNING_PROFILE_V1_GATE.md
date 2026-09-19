# W6 Gate A — IELTS Learning Profile v1

## Gate contract

This first W6 slice is `VERIFIED` only when all evidence belongs to the same
candidate commit:

1. `GET /api/academy/ielts/profile` requires authentication.
2. The query is scoped to the authenticated user, the Reading Diagnostic course,
   and completed sessions only.
3. The database projection contains only session ID, objective score counts, and
   completion time; questions, answer keys, raw answers, and explanations are
   not selected or returned.
4. Reading exposes latest and best objective accuracy from valid completed
   evidence.
5. Listening, Writing, and Speaking remain explicitly `not-assessed` until
   their own evidence-producing flows exist.
6. Every skill keeps `bandEstimate: null`; the short original diagnostic must
   never be represented as an official IELTS test or Band score.
7. Invalid zero-question or impossible-score records are ignored.
8. Backend tests, backend build, frontend tests/build, AI Engine tests, and lint
   pass in the complete repository CI.

## Focused verification

```bash
npm ci
npm -w apps/backend run db:generate
npm -w apps/backend run test
npm -w apps/backend run build
```

## Current boundary

This slice provides read-only Learning Profile evidence. It does not yet
generate a Daily Plan, Writing/Speaking rubric, AI feedback, or a Band
estimate. It makes no schema migration and is not authorized for Production
deployment or Production database access.
