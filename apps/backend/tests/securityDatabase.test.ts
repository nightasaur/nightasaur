import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("isolated SQLite enforces draft ownership and atomic publish; auth import creates no users", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightasaur-security-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"], { env: process.env, stdio: "pipe" });
  const { default: prisma } = await import("../src/config/prisma.js");
  const { socialService } = await import("../src/services/social.js");
  const original = (socialService as any).publishToFacebook;
  try {
    await import("../src/services/auth.js");
    assert.equal(await prisma.user.count(), 0);
    const owner = await prisma.user.create({ data: { email: "owner@example.invalid", username: "owner", passwordHash: "not-a-login-hash", role: "ADMIN" } });
    const other = await prisma.user.create({ data: { email: "other@example.invalid", username: "other", passwordHash: "not-a-login-hash", role: "ADMIN" } });
    const post = await socialService.createPost({ userId: owner.id, content: "fixture", platform: "FACEBOOK" });
    assert.equal(post.status, "DRAFT");
    process.env.SOCIAL_PUBLISH_ENABLED = "true";
    let sent = 0;
    (socialService as any).publishToFacebook = async () => { sent++; return "mock-id"; };
    await assert.rejects(socialService.publishPost(post.id, other.id), { statusCode: 404 });
    const results = await Promise.allSettled([socialService.publishPost(post.id, owner.id), socialService.publishPost(post.id, owner.id)]);
    assert.equal(sent, 1);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal((await prisma.socialPost.findUniqueOrThrow({ where: { id: post.id } })).status, "PUBLISHED");
    await assert.rejects(socialService.publishPost(post.id, owner.id), { statusCode: 409 });
    await prisma.user.update({ where: { id: owner.id }, data: { isActive: false } });
    await assert.rejects(socialService.publishPost(post.id, owner.id), { statusCode: 403 });
  } finally {
    (socialService as any).publishToFacebook = original;
    await prisma.$disconnect(); await rm(dir, { recursive: true, force: true });
  }
});

test("seed refuses production before creating a database", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
    env: { ...process.env, NODE_ENV: "production", DATABASE_URL: "file:/nonexistent/never-created.db", ALLOW_ISOLATED_SEED: "true" }, encoding: "utf8",
  });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Seed refused/);
});
