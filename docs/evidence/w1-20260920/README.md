# W1 acceptance follow-up — 2026-09-20

**Status: BLOCKED / NOT VERIFIED.** This record does not certify W1 completion.

## Versions and environment

- Production/main baseline: `ae143d9d984e1524b3139fa0de7cdaad6751a607`.
- Isolated candidate branch: `codex/w1-acceptance-20260920`.
- Canonical production UI: `https://www.nightasaur.com/`.
- Railway backend deployment `64abc988-0048-4114-9cfa-c48b3bc64cff`: SUCCESS, exact baseline commit. All five production services report SUCCESS.
- Baseline GitHub checks: backend, frontend, AI Engine, PostgreSQL migration/sessions and lint all success. Vercel commit status success, deployment `4sSBU7XzirrnZswvEMNkBfZau9nA`.
- Candidate UI: local Vite preview with same-origin API proxy to the production application. Real requests used only the newly created synthetic QA account. This is not a deployment of the candidate to production.

## Production results

- A new synthetic account registered through the real UI and obtained an initial spirit. Reload preserved authenticated access and fetched the spirit.
- Dashboard, spirit list and detail rendered; displayed growth values were 7, 5, 4, 6, 8, all nonnegative.
- Procedural image generation completed; the actual displayed image was decoded at 512×512.
- Assistant UI rendered `Hello` for a synthetic greeting. This is connectivity evidence, not broad model quality certification.
- Spirit dialogue displayed the connection-interrupted error. The browser client uses a 10-second default while the backend allows 120 seconds for inference.
- Source tracing identified a second defect: backend returns `message`, while SpiritDetail reads `reply` and fabricates `...` when absent.
- At a 390px desktop browser viewport, signed-in dashboard/list rendered without horizontal overflow. The hamburger opened, Korean selection changed navigation, Traditional Chinese was restored, and selecting a navigation link closed the menu. Screenshot: `production-mobile-menu.png`.
- Logout returned the browser to a login form; direct `/dashboard` navigation while logged out remained on login. This checks UI access control; server-side session revocation is additionally covered by isolated tests.

## Candidate repairs and validation

1. Dialogue client deadline is 135 seconds, allowing the existing backend 120-second limit plus transport overhead; unrelated requests retain their existing limits.
2. SpiritDetail renders the backend's actual `message`. Empty/missing message fails visibly rather than being substituted with an ellipsis.
3. Three existing backend database tests explicitly create their empty temporary SQLite file before schema provisioning. Reproduction showed Prisma's Windows schema engine failed when the file was absent and succeeded with the file present. Production schemas and account data are unchanged by this test repair.

Validation:

- Frontend: 33 tests passed. New regression cases cover a real local HTTP reply delayed for 11 seconds, rendering the backend message, and rejecting empty content.
- Backend: 32 tests passed after the Windows test-fixture correction; before correction 29 passed and three failed during schema setup.
- Backend TypeScript build and frontend production build passed.
- ESLint: 0 errors, 57 existing warnings. Diff whitespace check passed.
- Candidate UI obtained and displayed a real production AI response: `你好，我是活潑的蛋！`. Screenshot: `candidate-spirit-mobile.png`.
- The prompt requested English; the reply was Chinese. Connectivity/display pass does **not** imply instruction-following or language-quality pass.
- Candidate spirit-detail layout measured at 375/390/430px: content widths 360/375/415px, no horizontal overflow, hamburger present at all three. These are desktop responsive measurements, not Safari-device evidence.

## Owner's physical-device evidence

The owner reported an iPhone 16 using a regular Safari webpage:

- Spirit page: normal.
- Software keyboard: normal.
- Hamburger menu: absent.
- AI dialogue: failed.

The owner's report overrides any suggestion that desktop responsive checks certify this device. The referenced phone screenshot has not reached this task's accessible attachments. The menu failure is not reproduced or fixed by this candidate. Need the actual screenshot/page context and device recheck to close it.

The owner also reported completing administrator login. This is owner evidence only: the connected browser exposes the synthetic USER session, not an administrator session. No administrator password, role or session was changed during this run.

## Remaining W1 gates

- Diagnose and repair the iPhone Safari missing hamburger; verify on the actual device.
- Review/deploy the dialogue candidate and repeat the real phone conversation against that deployed commit.
- Bind administrator role/access evidence to an observed authorized session or a reviewed audit result; do not relabel the synthetic USER tests as administrator verification.
- Keep broader localization/model language quality open: a language selection updates navigation, but the assistant page remains Chinese in the Korean selection, and the English dialogue instruction was not followed.

## Test data and boundaries

One synthetic account `W1_QA_2b22b19152` and spirit `cmu9yhhg6000foba4vfm9awqv` were created through normal registration. Its generated image and synthetic dialogue records remain for follow-up. No existing user content was changed. Credentials/tokens are not included in this evidence or repository. Do not delete accounts by a broad prefix; cleanup needs exact verified ownership and its own scoped operation.

No payment, social publication, password reset, administrator promotion, production schema migration, main merge or production deployment was performed by this acceptance run.
