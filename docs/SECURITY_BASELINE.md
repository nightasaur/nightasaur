# Security baseline checkpoint — PR #25

## Implemented behavior

- Importing the auth service no longer creates accounts or logs credentials.
  Historical standalone servers and shared-account repair scripts are retired.
  Login and registration also reject the four previously published shared
  passwords before any database lookup; existing account records still need review.
- Backend startup requires an explicit independently generated JWT secret of at
  least 32 bytes. Placeholder/weak values are rejected in every environment.
  User tokens are HS256, scoped to issuer/audience and expire in one hour.
  Every token is bound to a hashed, expiring DB session. Logout deletes that
  session, and protected requests require both the live session and current
  account active status/role. Login and registration have per-process throttles.
- Social routes require authentication. Creating a post only saves a draft or
  scheduled record; it cannot publish. Shared platform account publishing requires
  a current active administrator who owns the post, plus explicit
  `SOCIAL_PUBLISH_ENABLED=true`. Default is closed. Linked spirits must be owned.
  An atomic claim prevents concurrent repeat sends. An ambiguous platform failure
  needs manual reconciliation (`REVIEW_REQUIRED`), not automatic retry.
  No schedule worker is implemented for social posts in this checkpoint.
- Local Compose database password must be supplied explicitly; database/cache/
  Ollama published ports bind to loopback. Existing running containers are unchanged.
- AI Engine accepts a separate backend-only `AI_ENGINE_API_KEY` Bearer credential
  before parsing any private request. Missing configuration is 503; invalid
  credentials are 401. Never place this secret in VITE variables or browser code.
  Browser assistant calls use the authenticated backend proxy. Image generation
  requests require spirit ownership; batch generation requires an administrator. Internal client
  requests attach the service key and refuse redirects.
- AI request bodies are bounded to 6 MiB, even without Content-Length, and must
  finish within 15 seconds. Image uploads are limited to 5 MiB / 16 million pixels;
  only actual PNG/JPEG content passes decode/format validation using the
  [Pillow image API](https://pillow.readthedocs.io/en/stable/reference/Image.html). Valid images return
  503 because no reviewed vision provider exists; the old nonexistent-method call
  has been removed. Public health is liveness only and exposes no provider details.
  Wildcard CORS is removed. This shared key is a service credential, not user auth.
- Dependency/model/asset evidence is recorded separately in PROVENANCE.md.
- Reward mutations are server-authoritative: public quest progress/claim routes
  are retired, the game-cycle action is display-only, puzzle solutions are not
  returned, repeat puzzle completion cannot award twice, and owned items are
  consumed atomically. Client-authored squad training/challenge reward routes
  remain closed until verifiable events and cooldowns are implemented.

## Required before deployment — not performed by this PR

1. Generate distinct random JWT and AI service secrets through the approved secret
   manager; configure backend and AI privately and coordinate cutover. Existing
   tokens lacking the new claims are invalid; users need to sign in again.
2. Review any previously created default/demo accounts in an authorized environment,
   disable or securely reset them, and rotate exposed secrets. Removing code does
   not revoke accounts, keys, logs or Git history already published. No production
   database inspection, remediation or credential rotation happened here.
3. Verify private networking/TLS and service limits, ingress rate/concurrency
   controls and abuse protection. Application body limits are per request, not
   a total memory or traffic budget. Keep Ollama/ComfyUI inaccessible publicly.
4. Keep social publishing disabled until platform-account access and end-to-end
   preview tests are approved. Tests use mocks and never post to Facebook/Instagram.
5. Verify provenance and licensing gaps before any commercial release. This is
   not a complete dependency-vulnerability audit or legal sign-off.

## Isolated seed

`prisma/seed.ts` requires explicit `NODE_ENV=test` or `development`,
`ALLOW_ISOLATED_SEED=true`, a `file:` SQLite URL pointing at a disposable local
DB, and explicit `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`
(at least 32 bytes, randomly generated). It creates only that account, never a
shared demo identity, and never updates/elevates an existing user. Production and
non-SQLite seeds are rejected before constructing a DB client. This is an operator
safety guard, not an isolation boundary if an operator supplies an incorrect path.

## Still outside this checkpoint

Distributed/edge login throttling, complete account/data
rights flows, privacy notices, independent penetration testing, the full set of
other API ownership checks, and review of image models/assets are not certified
complete. The authentication limiter intentionally uses the TCP peer address;
Set the exact trusted proxy hop count and add a shared limiter before public
multi-replica traffic. Existing startup/deployment scripts also require a
release audit.
PR stays draft. No main merge, production deployment, database migration or
platform publishing is authorized by this document.

## Persisted session revocation

Registration and login persist a SHA-256 token digest and expiry before returning a JWT. Mandatory and optional authentication require the matching unexpired session and a live active user. Logout deletes only that session; independent random JWT IDs distinguish devices. No plaintext bearer token is stored. See `SESSION_MODEL.md`. Existing JWTs without matching session digests are intentionally rejected after rollout: users must sign in again, without changing their passwords. Expired rows are cleaned during login and each account is capped at 20 sessions; account-wide revocation UI remains separate work.

## Local authentication admission control

Login and registration now share a bounded, per-process fixed-window limiter (60 attempts per TCP peer and 10 per peer/email pair per 10 minutes). Denied requests do not reach authentication controllers. HMAC identifiers avoid retaining raw source addresses/email in the limiter. See `AUTH_RATE_MODEL.md` for capacity, proxy/NAT, window-boundary and multi-replica limitations. This is not verified production ingress protection; reverse-proxy behavior and shared limits remain deployment gates.
