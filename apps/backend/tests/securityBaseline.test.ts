import assert from "node:assert/strict";
import test, { afterEach, beforeEach, mock } from "node:test";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import express from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "../src/config/prisma.js";
import { config } from "../src/config/index.js";
import { requireSecret } from "../src/config/secrets.js";
import { signToken, verifyToken } from "../src/utils/jwt.js";
import { socialRouter } from "../src/routes/social.js";
import generateRouter from "../src/routes/generate.js";
import assistantRouter from "../src/routes/assistant.js";
import { socialService } from "../src/services/social.js";
import { aiRequestOptions } from "../src/services/aiClient.js";

const restores: Array<() => void> = [];
function mockDb(target: any, key: string, implementation: any) {
  const original = target[key]; const replacement = mock.fn(implementation);
  target[key] = replacement; restores.push(() => { target[key] = original; }); return replacement;
}
beforeEach(() => { mockDb(prisma.session, "count", async () => 1); });
afterEach(() => { restores.splice(0).reverse().forEach(restore => restore()); mock.restoreAll(); process.env.SOCIAL_PUBLISH_ENABLED = "false"; });
const user = { id: "owner", email: "fixture@example.invalid", role: "ADMIN", isActive: true };
const token = () => signToken({ userId: user.id, email: user.email, role: "ADMIN" });
const post = { id: "post", userId: "owner", status: "DRAFT", content: '__NIGHTASAUR_SOCIAL_V1__:{"content":"unit","platform":"FACEBOOK"}' };

async function http(path: string, init: RequestInit = {}) {
  const app = express();
  app.use(express.json()); app.use("/social", socialRouter); app.use("/assistant", assistantRouter); app.use("/generate", generateRouter);
  app.use((err: any, _req: any, res: any, _next: any) => res.status(err.statusCode || 500).json({ error: "test" }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  try {
    const addr = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${addr.port}${path}`, init);
    return { status: response.status, body: await response.json() };
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

test("secrets reject absent, weak and placeholder values; random values work", () => {
  for (const value of [undefined, "", "short", "x".repeat(64), "change-me-to-a-random-secret-in-production"]) {
    assert.throws(() => requireSecret("JWT_SECRET", value));
  }
  assert.equal(requireSecret("JWT_SECRET", config.jwt.secret), config.jwt.secret);
});

test("backend startup config refuses missing JWT in production", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", "await import('./src/config/index.ts')"], {
    env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "" }, encoding: "utf8",
  });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /JWT_SECRET/);
});

test("JWT verifies correct claims and rejects foreign audience, algorithm, expiry and secret", () => {
  const signed = token(); assert.equal(verifyToken(signed).userId, "owner");
  const decoded = jwt.decode(signed) as jwt.JwtPayload;
  assert.equal(decoded.exp! - decoded.iat!, 3600);
  for (const options of [{ audience: "other" }, { algorithm: "HS384" as const }, { expiresIn: -1 }]) {
    const wrong = jwt.sign({ userId: "owner", email: user.email, role: "ADMIN" }, config.jwt.secret,
      { algorithm: "HS256", issuer: "nightasaur-backend", audience: "nightasaur-user", expiresIn: 60, ...options });
    assert.throws(() => verifyToken(wrong));
  }
  assert.throws(() => verifyToken(jwt.sign({ userId: "owner" }, randomBytes(48).toString("hex"))));
});

test("all social routes reject anonymous access without database or outbound calls", async () => {
  mockDb(prisma.user, "findUnique", () => { throw new Error("unexpected database access"); });
  for (const [path, method] of [["/social", "GET"], ["/social", "POST"], ["/social/post/publish", "POST"], ["/social/admin/posts", "GET"], ["/social/test/fb", "GET"], ["/social/test/ig", "GET"]]) {
    assert.equal((await http(path, { method })).status, 401);
  }
});

test("live account status and role override stale admin token", async () => {
  const lookup = mockDb(prisma.user, "findUnique", async () => ({ ...user, role: "USER" }));
  assert.equal((await http("/social/post/publish", { method: "POST", headers: { Authorization: `Bearer ${token()}` } })).status, 403);
  lookup.mock.mockImplementation(async () => ({ ...user, isActive: false }));
  assert.equal((await http("/social", { headers: { Authorization: `Bearer ${token()}` } })).status, 401);
});

test("cross-owner publish rejects before platform calls or updates", async () => {
  mockDb(prisma.user, "findUnique", async () => user);
  mockDb(prisma.socialPost, "findFirst", async (args: any) => { assert.equal(args.where.userId, "owner"); return null; });
  const publish = mock.method(axios, "post", async () => { throw new Error("must not publish"); });
  await assert.rejects(socialService.publishPost("someone-elses-post", "owner"), { statusCode: 404 });
  assert.equal(publish.mock.callCount(), 0);
});

test("draft creation does not publish and rejects someone else's spirit", async () => {
  mockDb(prisma.socialPost, "create", async () => post);
  const publish = mock.method(axios, "post", async () => { throw new Error("must not publish"); });
  assert.equal((await socialService.createPost({ userId: "owner", content: "unit", platform: "FACEBOOK" })).status, "DRAFT");
  mockDb(prisma.spirit, "findFirst", async () => null);
  await assert.rejects(socialService.createPost({ userId: "owner", spiritId: "other", content: "unit", platform: "FACEBOOK" }), { statusCode: 404 });
  assert.equal(publish.mock.callCount(), 0);
});

test("publishing defaults closed and atomically claims before one mocked send", async () => {
  mockDb(prisma.user, "findUnique", async () => user);
  mockDb(prisma.socialPost, "findFirst", async () => post);
  await assert.rejects(socialService.publishPost("post", "owner"), { statusCode: 503 });
  process.env.SOCIAL_PUBLISH_ENABLED = "true";
  let claimed = false;
  mockDb(prisma.socialPost, "updateMany", async () => { const count = claimed ? 0 : 1; claimed = true; return { count }; });
  mockDb(prisma.socialPost, "update", async () => post);
  const send = mock.method(socialService as any, "publishToFacebook", async () => "mock-external-id");
  const results = await Promise.allSettled([socialService.publishPost("post", "owner"), socialService.publishPost("post", "owner")]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(send.mock.callCount(), 1);
});

test("uncertain platform failure is not automatically retryable", async () => {
  process.env.SOCIAL_PUBLISH_ENABLED = "true";
  mockDb(prisma.user, "findUnique", async () => user);
  mockDb(prisma.socialPost, "findFirst", async () => post);
  mockDb(prisma.socialPost, "updateMany", async () => ({ count: 1 }));
  mock.method(socialService as any, "publishToFacebook", async () => { throw new Error("mock timeout"); });
  const update = mockDb(prisma.socialPost, "update", async (args: any) => args);
  await assert.rejects(socialService.publishPost("post", "owner"));
  assert.equal((update.mock.calls[0].arguments[0] as any).data.status, "REVIEW_REQUIRED");
});

test("assistant proxy authenticates users and substitutes service credential", async () => {
  assert.equal((await http("/assistant/chat", { method: "POST" })).status, 401);
  mockDb(prisma.user, "findUnique", async () => user);
  const call = mock.method(axios, "post", async (_url: any, _body: any, options: any) => {
    assert.equal(options.headers.Authorization, `Bearer ${config.ai.apiKey}`);
    assert.equal(options.maxRedirects, 0); return { data: { response: "mock" } };
  });
  const result = await http("/assistant/chat", { method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: "unit" }) });
  assert.equal(result.status, 200); assert.equal(call.mock.callCount(), 1);
  assert.equal(aiRequestOptions(5000).maxBodyLength, 6 * 1024 * 1024);
});


test("retired shared passwords cannot register or log in before DB access", async () => {
  const { authService } = await import("../src/services/auth.js");
  for (const password of ["admin" + "123", "admin" + "123!", "demo" + "123", "demo" + "1234"]) {
    await assert.rejects(authService.register("fixture@example.invalid", "fixture", password), { statusCode: 400 });
    await assert.rejects(authService.login("fixture@example.invalid", password), { statusCode: 401 });
  }
});


test("AI generation gateway rejects other owners and non-admin batch access", async () => {
  mockDb(prisma.user, "findUnique", async () => ({ ...user, role: "USER" }));
  mockDb(prisma.spirit, "findFirst", async (args: any) => { assert.equal(args.where.userId, "owner"); return null; });
  const headers = { Authorization: `Bearer ${token()}` };
  assert.equal((await http("/generate/spirit/other", { method: "POST", headers })).status, 404);
  assert.equal((await http("/generate/process", { method: "POST", headers })).status, 403);
});
