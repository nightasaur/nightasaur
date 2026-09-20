import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import bcrypt from "bcryptjs";

const require = createRequire(import.meta.url);

test("isolated SQLite enforces draft ownership and atomic publish; auth import creates no users", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightasaur-security-"));
  // Prisma's Windows schema engine needs the empty SQLite file to exist.
  await writeFile(join(dir, "test.db"), "", { flag: "wx" });
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"], { env: process.env, stdio: "pipe" });
  const { default: prisma } = await import("../src/config/prisma.js");
  const { socialService } = await import("../src/services/social.js");
  const original = (socialService as any).publishToFacebook;
  try {
    const { authService } = await import("../src/services/auth.js");
    const { gameService } = await import("../src/services/game.js");
    const { gameLogicService } = await import("../src/services/gameLogic.js");
    const { puzzleService } = await import("../src/services/puzzle.js");
    const { verifyToken } = await import("../src/utils/jwt.js");
    assert.equal(await prisma.user.count(), 0);
    const password = "fixture-password-that-is-not-shared";
    const owner = await prisma.user.create({ data: { email: "owner@example.invalid", username: "owner", passwordHash: await bcrypt.hash(password, 4), role: "ADMIN" } });
    const other = await prisma.user.create({ data: { email: "other@example.invalid", username: "other", passwordHash: "not-a-login-hash", role: "ADMIN" } });
    const login = await authService.login(owner.email, password);
    const storedSession = await prisma.session.findFirstOrThrow({ where: { userId: owner.id } });
    assert.equal(verifyToken(login.token).sessionId, storedSession.id);
    assert.notEqual(storedSession.token, login.token);
    assert.match(storedSession.token, /^[a-f0-9]{64}$/);
    await authService.logout(login.token);
    assert.equal(await prisma.session.count({ where: { userId: owner.id } }), 0);
    // Preserve explicitly authorized existing credentials without accepting them
    // for new accounts or bypassing hash/active-account validation.
    const legacyPassword = "admin" + "123";
    const legacyHash = await bcrypt.hash(legacyPassword, 4);
    const legacy = await prisma.user.create({ data: { email: "legacy@example.invalid", username: "legacy-fixture", passwordHash: legacyHash, role: "ADMIN" } });
    const legacyLogin = await authService.login(legacy.email, legacyPassword);
    assert.equal(verifyToken(legacyLogin.token).userId, legacy.id);
    assert.equal((await prisma.user.findUniqueOrThrow({where: {id: legacy.id}})).passwordHash, legacyHash);
    await assert.rejects(authService.login(legacy.email, "wrong-password"), {statusCode: 401});
    await prisma.user.update({where: {id: legacy.id}, data: {isActive: false}});
    await assert.rejects(authService.login(legacy.email, legacyPassword), {statusCode: 403});
    const ownedSpirit = await prisma.spirit.create({ data: { userId: owner.id, name: "owned", element: "FIRE" } });
    const foreignSpirit = await prisma.spirit.create({ data: { userId: other.id, name: "foreign", element: "WATER" } });
    const item = await prisma.item.create({ data: { name: "fixture item", type: "BOOST", effect: JSON.stringify({ xp: 25 }) } });
    await prisma.userItem.create({ data: { userId: owner.id, itemId: item.id, quantity: 1 } });
    await assert.rejects(gameService.useItem(owner.id, foreignSpirit.id, item.id), { statusCode: 404 });
    assert.equal((await prisma.userItem.findUniqueOrThrow({ where: { userId_itemId: { userId: owner.id, itemId: item.id } } })).quantity, 1);
    await gameService.useItem(owner.id, ownedSpirit.id, item.id);
    assert.equal((await prisma.spirit.findUniqueOrThrow({ where: { id: ownedSpirit.id } })).experience, 25);
    assert.equal((await prisma.userItem.findUniqueOrThrow({ where: { userId_itemId: { userId: owner.id, itemId: item.id } } })).quantity, 0);
    await assert.rejects(gameService.useItem(owner.id, ownedSpirit.id, item.id), { statusCode: 400 });
    const puzzle = await prisma.puzzleLevel.create({ data: {
      title: "fixture puzzle", description: "fixture", type: "LOGIC", difficulty: "MEDIUM",
      puzzleData: JSON.stringify({ prompt: "public" }), solution: JSON.stringify({ answer: 1 }),
      reward: JSON.stringify({ xp: 10 }), unlockLevel: 1, timeLimit: 300,
    } });
    const available = await puzzleService.getAvailablePuzzles(owner.id, ownedSpirit.id);
    assert.equal("solution" in available[0], false);
    const daily = await puzzleService.getDailyPuzzle();
    assert.equal("solution" in daily, false);
    const firstCompletion = await puzzleService.attemptPuzzle(owner.id, ownedSpirit.id, puzzle.id, { answer: 1 }, 30);
    assert.ok(firstCompletion.reward);
    const experienceAfterFirst = (await prisma.spirit.findUniqueOrThrow({ where: { id: ownedSpirit.id } })).experience;
    const repeat = await puzzleService.attemptPuzzle(owner.id, ownedSpirit.id, puzzle.id, { answer: 1 }, 30);
    assert.equal(repeat.reward, null);
    assert.equal((await prisma.spirit.findUniqueOrThrow({ where: { id: ownedSpirit.id } })).experience, experienceAfterFirst);
    assert.equal((await prisma.puzzleLevel.findUniqueOrThrow({ where: { id: puzzle.id } })).completed, 1);
    const forgedQuest = await prisma.quest.create({ data: {
      title: "client action must not count", description: "fixture", type: "DAILY",
      requirement: JSON.stringify({ action: "CLIENT_FORGED", count: 1 }),
      reward: JSON.stringify({ xp: 50 }),
    } });
    const xpBeforeForgedAction = (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trainerXp;
    const cycle = await gameLogicService.completeGameCycle(owner.id, ownedSpirit.id, "CLIENT_FORGED");
    assert.deepEqual(cycle.rewards, []);
    assert.equal(await prisma.questProgress.count({ where: { userId: owner.id, questId: forgedQuest.id } }), 0);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).trainerXp, xpBeforeForgedAction);
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
