# W6 Gate D — IELTS Learning Loop UI

## Gate contract

This W6 slice is `VERIFIED` only when every item below belongs to the same
candidate commit:

1. The authenticated Assessment page loads Learning Profile and Daily Plan from
   their server APIs instead of inventing browser-only evidence.
2. Reading displays latest objective Diagnostic counts and accuracy.
3. A ready Daily Plan displays its server-selected focus, bounded minutes, and
   task list.
4. Practice can be started from the plan and displays only the public passage,
   question, and options returned by the server.
5. Answers are submitted to the Practice API and server-scored feedback is
   rendered after submission.
6. Completed practice displays objective practice accuracy and explicitly says
   it is not Diagnostic Profile evidence.
7. The UI always states that no IELTS Band estimate is produced.
8. Loading and API failure states are visible and do not fabricate fallback
   results.
9. Frontend component tests, complete frontend/backend builds, AI Engine tests,
   and lint pass in repository CI.
10. No local or remote language model is invoked by this UI slice.

## Focused verification

```bash
npm ci
npm -w apps/web run test
npm -w apps/web run build
```

## Current boundary

This slice connects the verified W6 read APIs and practice loop to the existing
authenticated Assessment page. It does not add generative feedback, call Qwen
or another model, change the database schema, access Production data, or deploy
to Production.
