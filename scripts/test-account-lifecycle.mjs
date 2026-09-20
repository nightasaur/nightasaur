// SPDX-License-Identifier: MIT
// Operator-only tool. Never mounted as an HTTP route.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

function keyCheck(key) {
  if (typeof key !== 'string' || key.length < 64) throw new Error('cleanup_key_required');
}
function mac(payload, key, target) {
  keyCheck(key);
  if (!target) throw new Error('database_target_required');
  return createHmac('sha256', key).update(target).update('\0').update(JSON.stringify(payload)).digest('hex');
}
export function makeReceipt(key, target) {
  const nonce = randomBytes(16).toString('hex');
  const payload = { version: 1, id: `qa_${nonce}`, email: `qa-${nonce}@acceptance.invalid`,
    username: `qa_${nonce.slice(0, 16)}`, createdAt: new Date().toISOString() };
  return { payload, signature: mac(payload, key, target) };
}
function verify(receipt, key, target) {
  const p = receipt?.payload;
  if (!p || p.version !== 1 || !/^qa_[a-f0-9]{32}$/.test(p.id) ||
      p.email !== `qa-${p.id.slice(3)}@acceptance.invalid` ||
      p.username !== `qa_${p.id.slice(3, 19)}` || !Number.isFinite(Date.parse(p.createdAt)) ||
      typeof receipt.signature !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.signature)) {
    throw new Error('invalid_receipt');
  }
  if (!timingSafeEqual(Buffer.from(receipt.signature, 'hex'), Buffer.from(mac(p, key, target), 'hex'))) {
    throw new Error('invalid_receipt');
  }
  return p;
}
export async function provision(db, receipt, key, target, password) {
  const p = verify(receipt, key, target);
  if (typeof password !== 'string' || password.length < 24) throw new Error('strong_test_password_required');
  const passwordHash = await bcrypt.hash(password, 12);
  // No adoption of existing accounts. User and initial synthetic spirit are atomic.
  await db.user.create({ data: { id: p.id, email: p.email, username: p.username, createdAt: new Date(p.createdAt),
    passwordHash, role: 'USER', Spirits: { create: { name: 'Acceptance fixture', element: 'LIGHT' } } } });
  return { userId: p.id, email: p.email };
}

// These are the complete current ownership graph. New owned models require review.
const direct = ['LanguagePreference', 'UserSettings', 'PasswordResetToken', 'Session', 'Squad',
  'Spirit', 'UserItem', 'QuestProgress', 'GenerationTask', 'LearningSession', 'UserAchievement',
  'UserLanguageHistory', 'LearningProgress', 'HatchingRecord', 'SocialPost', 'PlayerLocation',
  'LocationVisit', 'ARCapture'];
const spiritOnly = ['Evolution', 'Conversation', 'SpiritUpgrade', 'SpiritPuzzleProgress', 'HatchingInteraction'];
const delegate = (name) => name[0].toLowerCase() + name.slice(1);
function assertSchema() {
  for (const model of Prisma.dmmf.datamodel.models) {
    for (const f of model.fields.filter(f => f.kind === 'object' && f.relationFromFields?.length)) {
      if (f.type === 'User' && (!direct.includes(model.name) || f.relationOnDelete !== 'Cascade')) {
        throw new Error('ownership_schema_requires_review');
      }
      if (f.type === 'Spirit' && ![...direct, ...spiritOnly, 'SquadMember'].includes(model.name)) {
        throw new Error('ownership_schema_requires_review');
      }
      if (['Spirit', 'Squad', 'SquadMember'].includes(f.type) &&
          !['Cascade', 'SetNull'].includes(f.relationOnDelete)) throw new Error('ownership_schema_requires_review');
      if (f.type === 'Squad' && model.name !== 'SquadMember' ||
          f.type === 'SquadMember' && model.name !== 'SquadTraining') throw new Error('ownership_schema_requires_review');
    }
  }
}
export async function cleanup(db, receipt, key, target, confirmation) {
  const p = verify(receipt, key, target);
  assertSchema();
  const apply = confirmation !== undefined;
  if (apply && confirmation !== p.id) throw new Error('exact_user_id_confirmation_required');
  return db.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: p.id } });
    if (!user) return { status: 'already_absent', userId: p.id };
    if (user.email !== p.email || user.username !== p.username || user.role !== 'USER' ||
        user.createdAt.toISOString() !== p.createdAt) throw new Error('identity_mismatch');
    // Lock the row before inspecting/deleting; any failure rolls this change back.
    if (apply) await tx.user.update({ where: { id: p.id }, data: { isActive: false } });
    const ownedSpirit = { userId: p.id };
    const spiritIds = (await tx.spirit.findMany({ where: ownedSpirit, select: { id: true } })).map(s => s.id);
    const squadIds = (await tx.squad.findMany({ where: { userId: p.id }, select: { id: true } })).map(s => s.id);
    const memberIds = (await tx.squadMember.findMany({ where: { squadId: { in: squadIds } }, select: { id: true } })).map(s => s.id);
    if (await tx.user.count({ where: { id: { not: p.id }, activeSpiritId: {
      in: spiritIds } } })) {
      throw new Error('cross_owner_reference');
    }
    for (const name of direct) {
      const model = Prisma.dmmf.datamodel.models.find(m => m.name === name);
      if (!model?.fields.some(f => f.name === 'spiritId')) continue;
      if (await tx[delegate(name)].count({ where: { OR: [
        { userId: { not: p.id }, spirit: ownedSpirit },
        { userId: p.id, spirit: { userId: { not: p.id } } },
      ] } })) throw new Error('cross_owner_reference');
    }
    if (await tx.squadMember.count({ where: { OR: [
      { squad: { userId: p.id }, spirit: { userId: { not: p.id } } },
      { squad: { userId: { not: p.id } }, spirit: ownedSpirit },
    ] } })) throw new Error('cross_owner_reference');
    if (await tx.socialPost.count({ where: { userId: p.id, OR: [
      { status: { not: 'DRAFT' } }, { publishedAt: { not: null } }, { scheduledAt: { not: null } },
    ] } })) throw new Error('external_publication_requires_cleanup');
    const tasks = await tx.generationTask.findMany({ where: { userId: p.id },
      select: { status: true, queueJobId: true, resultUrl: true } });
    if (tasks.some(t => !['COMPLETED', 'FAILED'].includes(t.status) || t.queueJobId ||
        t.resultUrl && !t.resultUrl.startsWith('data:image/png;base64,'))) {
      throw new Error('generation_or_external_asset_requires_cleanup');
    }
    const counts = {};
    for (const name of direct) counts[name] = await tx[delegate(name)].count({ where: { userId: p.id } });
    for (const name of spiritOnly) counts[name] = await tx[delegate(name)].count({ where: { spirit: ownedSpirit } });
    counts.SquadMember = await tx.squadMember.count({ where: { squad: { userId: p.id } } });
    counts.SquadTraining = await tx.squadTraining.count({ where: { member: { squad: { userId: p.id } } } });
    if (apply) {
      await tx.user.delete({ where: { id: p.id } });
      for (const name of direct) if (await tx[delegate(name)].count({ where: { userId: p.id } })) {
        throw new Error('cleanup_incomplete');
      }
      for (const name of spiritOnly) if (await tx[delegate(name)].count({ where: { spiritId: { in: spiritIds } } })) {
        throw new Error('cleanup_incomplete');
      }
      if (await tx.squadMember.count({ where: { squadId: { in: squadIds } } }) ||
          await tx.squadTraining.count({ where: { memberId: { in: memberIds } } })) throw new Error('cleanup_incomplete');
    }
    return { status: apply ? 'deleted' : 'preview', userId: p.id, counts };
  }, { isolationLevel: 'Serializable', timeout: 30000 });
}

async function main() {
  const [action, path, confirmation, ...extra] = process.argv.slice(2);
  if (!['create', 'preview', 'delete'].includes(action) || !path || extra.length ||
      (action !== 'delete' && confirmation) || (action === 'delete' && !confirmation)) throw new Error('invalid_arguments');
  const target = process.env.DATABASE_URL;
  const key = process.env.TEST_ACCOUNT_CLEANUP_KEY;
  keyCheck(key);
  if (!target) throw new Error('database_target_required');
  // Separate explicit operational opt-in; code delivery does not authorize production execution.
  if (process.env.TEST_ACCOUNT_OPERATIONS_ENABLED !== 'true') throw new Error('operator_opt_in_required');
  const db = new PrismaClient();
  try {
    if (action === 'create') {
      const receipt = makeReceipt(key, target);
      // Durable receipt exists before creation. Never overwrite or follow an existing symlink.
      writeFileSync(path, JSON.stringify(receipt), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify(await provision(db, receipt, key, target, process.env.TEST_ACCOUNT_PASSWORD)));
    } else {
      const receipt = JSON.parse(readFileSync(path, 'utf8'));
      console.log(JSON.stringify(await cleanup(db, receipt, key, target, action === 'delete' ? confirmation : undefined)));
    }
  } finally { await db.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Test-account operation refused or failed; no success claimed.'); process.exitCode = 1; });
}
