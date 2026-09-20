# W1 acceptance — 2026-09-20

Initial candidate: `9a4fb349b1427272f7cebba5090723f3238bd5db`.
Latest verified production candidate: `617724250afe89e4226cba7155a16229ecb0bc33`.
The follow-up sections below supersede earlier pending items within their stated scope.
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

## Login resilience — PR #37

Merged candidate: `bfa9cebe60dcdbf9b6a1f32bf77e4a7ea8f30422`.
The login client now waits up to 45 seconds and session verification up to 30
seconds. Temporary verification failures preserve the session and show a retry
screen; a confirmed 401 clears it. Login timeout feedback is distinct from an
incorrect-password response. Fifteen frontend tests and the production build
passed.

A dedicated QA API login returned 200 after 19.77 seconds, longer than the old
10-second client timeout. This supports latency as a failure mechanism, but is
not proof of the cause of the owner's specific failed attempt. An existing
administrator browser session rendered the new dashboard afterward.

Source review found a maximum of 20 sessions per account: creating a new session
evicts the oldest only when the limit is exceeded. It does not reject a normal
new login because one browser is already signed in. The agent browser then logged
out at the owner's request and remains signed out for the public mobile checks.

## Responsive acceptance — PRs #38 and #39

Harness merge: `cc8d27ac4b8cda09bc9a0a5505509801e7144ad2`.
Mobile menu fix merge: `ed9f49047e7a5127ea7561359dbb100a97113e27`.
PR #39 head workflows 35491622671 and 35491622745 passed; 16 frontend tests and
the production build passed locally.

The public `/_checks/mobile.html` harness loads the actual same-origin app at
375, 390 or 430 CSS pixels. It records the allowlisted route, frame/viewport/
content widths and an overflow flag without reading credentials, cookies,
storage or user content. It refuses to pass before navigation and main content
render. Desktop scrollbars can reduce the inner width by 15 pixels.

At 375px, the mobile language dropdown was clipped by its scrollable navigation
container. PR #39 makes the options expand in normal flow, adds expanded-state
accessibility attributes, and translates the mobile logout label.

The first post-deployment check still rendered the old dropdown. Direct HTTP
responses contained the new build and no-store headers, while the existing
browser showed old content. Source review identified the service worker's fixed
cache and cache-first HTML policy as a mechanism that persisted obsolete pages.
A cache-busting query recovered the new harness, but this was not counted as
successful ordinary-navigation recovery.

## Deployment-cache remediation — PR #40

Merged candidate: `617724250afe89e4226cba7155a16229ecb0bc33`.
PR head workflows 35491875067 and 35491875110 passed. Main workflow
35491949928 passed. Vercel production status is success.
Frontend asset: `/assets/index-BcKK_9YK.js`.

The service worker now loads documents from the network without caching HTML.
Only the generic offline page, manifest and public logo are precached. API
requests are not intercepted or persisted by this worker. Activation removes
old caches owned by Nightasaur only; it preserves unrelated caches. Session
storage and account credentials are unchanged.

Validation: 23 frontend tests pass, including 7 worker regression cases, plus
production build and diff checks.

Production recovery result:
- An ordinary reload of the existing logged-out browser loaded the current asset.
- The unmodified `/_checks/mobile.html` URL loaded the current harness.
- Its default homepage loaded normally, with the current asset, without a
  cache-busting query or manual cache clearing.
- At 375px all five language options displayed fully in the mobile navigation.
  English and Korean selections updated visible navigation; zh-TW was restored.
- Navigation links closed the mobile menu after navigating.

### Current public responsive results

| Page | Frame widths (CSS px) | Observed content viewport widths | Horizontal overflow |
| --- | --- | --- | --- |
| Homepage | 375 / 390 / 430 | 360 / 375 / 415 | None in 3 checks |
| Login | 375 / 390 / 430 | 375 / 390 / 430 | None in 3 checks |
| Registration | 375 / 390 / 430 | 375 / 390 / 430 | None in 3 checks |
| IELTS introduction | 375 / 390 / 430 | 360 / 375 / 415 | None in 3 checks |

The 15px difference is the desktop browser's vertical scrollbar. The raw
aggregate measurements are in `2026-09-20-mobile-layout.json`.
Visual checks confirmed fully expanded language options, wrapped product
headings/pricing, and usable form layout. This is responsive CSS evidence in a
desktop browser iframe, not evidence of physical-phone behavior or every element
throughout the product.

Current W1 status remains PARTIAL. The public responsive-layout and observed
stale-page recovery gaps above are resolved for this browser. Remaining scope:
- Authenticated mobile dashboard, spirit list/detail and assistant workflows.
- Physical-device Safari, keyboard, touch, dynamic height and safe-area behavior.
- Full-product localization and model language/answer-quality acceptance beyond
  the specific controls and greeting already verified.
- A fresh owner-entered administrator login after the intermittent-login report
  has not been independently repeated during these public mobile checks.

No login credentials were entered and no new account was created during the
mobile checks. No purchase, social publication or user-content operation was
performed. Administrator access was not needed for these public checks.
