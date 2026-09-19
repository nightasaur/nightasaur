import assert from "node:assert/strict";
import test from "node:test";
import { AuthAttemptLimiter, makeAuthRateLimit } from "../src/middleware/authRateLimit.js";
import express from "express";
import { authController } from "../src/controllers/auth.js";
import authRoutes from "../src/routes/auth.js";

test("pair and peer budgets expire without extending on denial", () => {
  let now = 0;
  const limiter = new AuthAttemptLimiter(() => now);
  for (let i = 0; i < 10; i++) assert.equal(limiter.attempt("peer", " User@Example.invalid ").allowed, true);
  assert.deepEqual(limiter.attempt("peer", "user@example.invalid"), { allowed: false, status: 429, retryAfter: 600 });
  now = 599_000;
  assert.deepEqual(limiter.attempt("peer", "user@example.invalid"), { allowed: false, status: 429, retryAfter: 1 });
  for (let i = 0; i < 50; i++) assert.equal(limiter.attempt("peer", `other${i}`).allowed, true);
  assert.equal(limiter.attempt("peer", "another").allowed, false);
  assert.equal(limiter.attempt("different-peer", "another").allowed, true);
  now = 600_000;
  assert.equal(limiter.attempt("peer", "user@example.invalid").allowed, true);
});

test("bounded storage rejects new identities until capacity expires", () => {
  let now = 0;
  const limiter = new AuthAttemptLimiter(() => now, 2);
  assert.equal(limiter.attempt("peer", "one").allowed, true);
  assert.deepEqual(limiter.attempt("peer", "two"), { allowed: false, status: 503, retryAfter: 60 });
  assert.equal(limiter.attempt("peer", "one").allowed, true);
  now = 600_000;
  assert.equal(limiter.attempt("new-peer", "two").allowed, true);
});

test("real auth routes share limits and do not trust forwarded identity", async () => {
  const originalLogin = authController.login;
  const originalRegister = authController.register;
  let calls = 0;
  authController.login = authController.register = async (_req, res) => { calls++; res.json({ fixture: true }); };
  const app = express(); app.use(express.json()); app.use(authRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  try {
    for (let i = 0; i < 11; i++) {
      const response = await fetch(`http://127.0.0.1:${port}/${i % 2 ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `198.51.100.${i}` },
        body: JSON.stringify({ email: "fixture@example.invalid" }),
      });
      assert.equal(response.status, i < 10 ? 200 : 429);
      if (i === 10) assert.ok(Number(response.headers.get("Retry-After")) > 0);
    }
    assert.equal(calls, 10);
  } finally {
    authController.login = originalLogin; authController.register = originalRegister;
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});


test("capacity exhaustion rejects before downstream authentication", () => {
  const middleware = makeAuthRateLimit(new AuthAttemptLimiter(() => 0, 0));
  let status = 0;
  let forwarded = false;
  const headers: Record<string, string> = {};
  const res = { status(code: number) { status = code; return this; },
    set(key: string, value: string) { headers[key] = value; return this; },
    json() { return this; } };
  middleware({ socket: { remoteAddress: "fixture-peer" }, body: { email: "fixture" } } as any,
    res as any, () => { forwarded = true; });
  assert.equal(status, 503);
  assert.equal(headers["Retry-After"], "60");
  assert.equal(forwarded, false);
});
