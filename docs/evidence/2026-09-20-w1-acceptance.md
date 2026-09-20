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
