# W1 acceptance — 2026-09-20

Candidate: `9a4fb349b1427272f7cebba5090723f3238bd5db`.
Status: PARTIAL; not full W1 acceptance.

## Verified in this run

- Main GitHub Actions run 35486656282: success.
- Local frontend language contract: 6/6 tests passed.
- Production homepage browser interaction: zh-TW, zh-CN, en-US, ja-JP,
  ko-KR each showed matching hero text, navigation, document language and title.
- Canonical production health endpoint: HTTP 200.
- Anonymous /api/auth/me: HTTP 401.
- Existing dedicated QA account: login 200, authenticated /auth/me 200,
  /spirits 200 with data. No credential or user list included in this report.
- Authenticated /api/assistant/chat synthetic English greeting: HTTP 200,
  nonempty response (6 characters). This establishes connectivity only, not
  multilingual quality, load capacity or general answer correctness.
- Owner previously confirmed administrator login works. This is owner evidence,
  not a fresh browser sign-in performed by the agent in this run.

## Observed issue

The existing cloud browser initially loaded blank. Its DOM referenced
/assets/index-fzx90sMh.js. A separate direct HTTP request to the canonical root
returned /assets/index-5-HNCuBa.js; requesting the obsolete asset returned HTML
with HTTP 200. One reload did not recover the old browser document. A fresh
homepage request using a nonsecret acceptance query parameter rendered correctly.
This is consistent with stale HTML/assets, but the caching layer responsible
is not established. Do not claim ordinary navigation or upgrade recovery has
passed based on the query-parameter recovery alone.

## Remaining evidence

- Signed-in browser workflow: this browser currently shows the login form.
  API tests above do not establish dashboard/buttons/rendered images/chat UI.
  Secure browser sign-in is needed before these interactions can be evaluated.
- Mobile visual acceptance: current browser API does not expose viewport/device
  emulation. Desktop and DOM tests do not establish a phone viewport result.
- Five-language checks above cover the homepage/navigation/metadata only;
  protected pages and full multilingual AI quality are not certified.
- Resolve or characterize stale-document recovery before marking W1 VERIFIED.

No payment, social publication, account password change or schema migration
was performed for this acceptance run. Existing QA data only was read through
application APIs; a fresh QA login created its normal session.

## Signed-in follow-up

After owner manual login, the browser showed the administrator dashboard and
Logout control. Dashboard, spirit list and existing spirit detail rendered.
No existing spirit/account data was modified.

A synthetic assistant greeting submitted through the UI failed with the old
message claiming the AI engine was not started. Source review found a generic
10-second frontend timeout versus a 60-second backend assistant deadline.
PR #35 aligns the four assistant client deadlines to 75 seconds and replaces
that unsupported error claim. Post-deployment browser verification is pending.

Additional observed gaps:
- zh-TW selected but signed-in navigation remains English and spirit pages mix
  simplified/traditional Chinese. Homepage-only language pass is not a full-app
  localization pass.
- Existing spirit detail displayed negative values for several attributes and
  incomplete labels (`? ?`, an evolution entry without a level). The provenance
  and intended semantics of these values are not established; do not alter user
  data or claim the detail view is fully accepted.
- Mobile viewport acceptance remains unverified. Browser zoom shortcuts did not
  change the measured CSS viewport and were restored; this is not mobile evidence.

## PR #35 production recheck

PR #35 merged as `1a891c49745b165cda250cae060ed98fbde7551d` after both
head workflows passed. Frontend build and 6 language tests passed locally.
The production browser loaded /assets/index-C4sZtFid.js and retained positive
signed-in navigation. A fresh synthetic greeting submitted through the actual
assistant textbox/button rendered the model response `Hello!` on screen.
This supersedes the pending assistant post-deployment check above: basic signed-in
assistant UI round-trip now PASS. It does not certify other assistant modes,
Chinese response quality, mobile rendering or load capacity.

W1 remains PARTIAL due to mobile evidence, signed-in localization/display gaps
and stale-document recovery described above. Administrator login and dashboard,
list/detail loading, and the basic assistant UI interaction are verified.

## Defect remediation — PR #36

Merged candidate: `08c82c5286ae45f2d0e09e46250bc6e625a1ced7`.
Head CI runs 35489206513 and 35489206549 passed; Vercel preview passed.
Production backend deployment bb570694-feff-4117-afe0-3947d9154949 succeeded.
Frontend asset: /assets/index-ZDQ0cmb1.js.

Root cause: the detail page searched canonical backend stages such as HATCHLING
in an array of Chinese display labels. Index -1 produced negative cosmetic
indicators and an invalid evolution-to-egg suggestion. Canonical stage codes,
level validation, explicit missing-species labels and translated display labels
now resolve this without changing persisted spirit data. Unknown/invalid state
cannot offer an evolution action. Indicators are explicitly labeled as calculated
growth values, not persisted combat statistics.

Production browser recheck on the existing level-2 hatchling:
- Growth indicators: 34, 28, 23, 24, 38; no negative values.
- Correct disabled evolution action: requires level 5.
- Missing species shown explicitly; stage and timeline labels populated.
- zh-TW spirit list and detail now render traditional Chinese.
- Signed-in navigation and detail controls successfully switched through zh-CN,
  en-US, ja-JP, ko-KR and zh-TW; restored zh-TW at end.
- No spirit evolution, deletion, customization or database repair performed.
  Language preferences changed through the normal UI and were restored.

HTTP delivery recheck:
- Root and /spirits: 200 with Cache-Control: no-store, max-age=0.
- Obsolete /assets/index-fzx90sMh.js: 404 text/plain, not 200 HTML.
- /api/health remains 200 JSON.
- Ordinary navigation to /spirits loaded the current frontend without a
  cache-busting query. Existing documents cached before this change may need
  a refresh; this change does not claim to remotely purge browser caches.
- Startup HTML provides loading/recovery text before the app mounts.

Validation: 13 frontend tests pass (including real component stage regression,
all-five-language detail controls, invalid stages/levels and terminal evolution
boundaries), production build and diff checks pass.

Narrow-layout code improvements: list headers wrap, detail chat inputs shrink,
buttons wrap and generated images respect container width. Actual phone viewport
visual verification remains outstanding; no desktop-only result certifies it.
Full-product translation outside the changed navigation/dashboard/spirit pages
and model language quality are outside this remediation scope.
