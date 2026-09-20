import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { makeReceipt, provision, cleanup } from '../../../scripts/test-account-lifecycle.mjs';

test('signed fixture cleanup: full cascade, isolation, refusal and rollback', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nightasaur-cleanup-'));
  const target = `file:${join(dir, 'fixture.db')}`;
  const require = createRequire(import.meta.url);
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate',
    '--schema', 'prisma/schema.prisma'], { env: { ...process.env, DATABASE_URL: target }, stdio: 'pipe' });
  const db = new PrismaClient({ datasources: { db: { url: target } } });
  const key = randomBytes(48).toString('hex');
  const receipt = makeReceipt(key, target);
  const id = receipt.payload.id;
  // Generate scalar-only fixtures for every model in the actual schema; relations are explicit.
  async function row(name: string, values: Record<string, unknown> = {}) {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === name)!;
    const data: Record<string, unknown> = {};
    for (const f of model.fields) {
      if (f.kind !== 'scalar' || !f.isRequired || f.hasDefaultValue || f.isUpdatedAt) continue;
      data[f.name] = f.type === 'DateTime' ? new Date() : f.type === 'Boolean' ? false :
        ['Int', 'Float'].includes(f.type) ? 1 : `fixture-${randomBytes(6).toString('hex')}`;
    }
    return (db as any)[name[0].toLowerCase() + name.slice(1)].create({ data: { ...data, ...values } });
  }
  try {
    await provision(db, receipt, key, target, randomBytes(32).toString('hex'));
    await assert.rejects(provision(db, receipt, key, target, randomBytes(32).toString('hex')));
    const other = await row('User', { role: 'ADMIN', email: 'admin@example.invalid' });
    const spirit = await db.spirit.findFirstOrThrow({ where: { userId: id } });
    const otherSpirit = await row('Spirit', { userId: other.id });
    const item = await row('Item'); const quest = await row('Quest');
    const achievement = await row('Achievement'); const puzzle = await row('PuzzleLevel');
    const location = await row('LocationSpawn');
    const refs = { userId: id, spiritId: spirit.id, itemId: item.id, questId: quest.id,
      achievementId: achievement.id, puzzleId: puzzle.id, locationId: location.id };
    const related = ['LanguagePreference', 'UserSettings', 'PasswordResetToken', 'Session', 'Squad',
      'UserItem', 'QuestProgress', 'GenerationTask', 'LearningSession', 'UserAchievement',
      'UserLanguageHistory', 'LearningProgress', 'HatchingRecord', 'SocialPost', 'PlayerLocation',
      'LocationVisit', 'ARCapture', 'Evolution', 'Conversation', 'SpiritUpgrade', 'SpiritPuzzleProgress', 'HatchingInteraction'];
    for (const name of related) {
      const fields = Prisma.dmmf.datamodel.models.find(m => m.name === name)!.fields;
      const values = Object.fromEntries(Object.entries(refs).filter(([k]) => fields.some(f => f.name === k)));
      if (name === 'GenerationTask') Object.assign(values, { status: 'COMPLETED', resultUrl: 'data:image/png;base64,Zml4dHVyZQ==' });
      await row(name, values);
    }
    const squad = await db.squad.findUniqueOrThrow({ where: { userId: id } });
    const member = await row('SquadMember', { squadId: squad.id, spiritId: spirit.id });
    await row('SquadTraining', { memberId: member.id });
    const before = await db.user.count();
    assert.equal((await cleanup(db, receipt, key, target)).status, 'preview');
    assert.equal(await db.user.count(), before);
    await assert.rejects(cleanup(db, receipt, key, target, other.id), /confirmation/);
    await assert.rejects(cleanup(db, receipt, key, target + 'wrong', id), /invalid_receipt/);
    await assert.rejects(cleanup(db, { ...receipt, payload: { ...receipt.payload, id: other.id } }, key, target, other.id));
    await db.user.update({ where: { id }, data: { role: 'ADMIN' } });
    await assert.rejects(cleanup(db, receipt, key, target, id), /identity_mismatch/);
    await db.user.update({ where: { id }, data: { role: 'USER' } });
    const crossed = await row('LearningSession', { userId: other.id, spiritId: spirit.id });
    await assert.rejects(cleanup(db, receipt, key, target, id), /cross_owner/);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id } })).isActive, true);
    await db.learningSession.delete({ where: { id: crossed.id } });
    await db.generationTask.updateMany({ where: { userId: id }, data: { status: 'PROCESSING' } });
    await assert.rejects(cleanup(db, receipt, key, target, id), /generation/);
    await db.generationTask.updateMany({ where: { userId: id }, data: { status: 'COMPLETED', resultUrl: 'https://example.invalid/asset.png' } });
    await assert.rejects(cleanup(db, receipt, key, target, id), /external_asset/);
    await db.generationTask.updateMany({ where: { userId: id }, data: { resultUrl: null } });
    await db.socialPost.updateMany({ where: { userId: id }, data: { status: 'PUBLISHED' } });
    await assert.rejects(cleanup(db, receipt, key, target, id), /publication/);
    await db.socialPost.updateMany({ where: { userId: id }, data: { status: 'DRAFT' } });
    assert.equal((await cleanup(db, receipt, key, target, id)).status, 'deleted');
    assert.equal((await cleanup(db, receipt, key, target, id)).status, 'already_absent');
    for (const name of [...related, 'SquadMember', 'SquadTraining']) {
      assert.equal(await (db as any)[name[0].toLowerCase() + name.slice(1)].count(), 0, name);
    }
    assert.deepEqual(await db.user.findUnique({ where: { id: other.id } }), other);
    assert.deepEqual(await db.spirit.findUnique({ where: { id: otherSpirit.id } }), otherSpirit);
    for (const name of ['Item', 'Quest', 'Achievement', 'PuzzleLevel', 'LocationSpawn']) {
      assert.equal(await (db as any)[name[0].toLowerCase() + name.slice(1)].count(), 1);
    }
  } finally { await db.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});
