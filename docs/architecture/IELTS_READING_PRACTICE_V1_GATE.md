# W6 Gate C — IELTS Reading Practice v1

## Gate contract

This W6 slice is `VERIFIED` only when every item below belongs to the same
candidate commit:

1. Practice start and answer endpoints require authentication.
2. Practice cannot start until the current user has valid completed Reading
   Diagnostic evidence.
3. The latest diagnostic objective accuracy deterministically selects
   `foundation`, `consolidation`, or `maintenance`.
4. Each focus level maps to a deterministic three-question original IELTS-style
   passage that is distinct from the diagnostic passages.
5. Start responses never expose answer keys or explanations.
6. Answers are accepted in order only, are scored on the server, and use an
   optimistic duplicate-submit guard.
7. Objective answer feedback is returned only after submission.
8. Practice results use `scoreType: practice-accuracy`,
   `profileEvidence: false`, and `bandEstimate: null`.
9. The Learning Profile query remains restricted to completed Diagnostic
   sessions, so Practice cannot contaminate diagnostic evidence.
10. Backend tests/build, frontend tests/build, AI Engine tests, and lint pass in
    the complete repository CI.

## Focused verification

```bash
npm ci
npm -w apps/backend run db:generate
npm -w apps/backend run test
npm -w apps/backend run build
```

## Current boundary

This slice provides a bounded Reading practice loop and objective feedback. It
does not persist a separate assignment model, modify the database schema,
produce generative feedback, update official profile evidence, or estimate an
IELTS Band. It is not authorized for Production database access or Production
deployment.
