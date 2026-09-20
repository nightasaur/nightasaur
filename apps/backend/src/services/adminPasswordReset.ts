// SPDX-License-Identifier: MIT
import {createHash, timingSafeEqual} from 'node:crypto';
import bcrypt from 'bcryptjs';
import type {PrismaClient} from '@prisma/client';
import {isRetiredPassword} from '../utils/passwordPolicy.js';

const denied = () => Object.assign(new Error('重設碼無效、已使用或已過期'), {statusCode: 400});
export async function resetAdministratorPassword(db: PrismaClient, code: string, password: string) {
  const expected = process.env.ADMIN_PASSWORD_RESET_CODE || '';
  const expires = Date.parse(process.env.ADMIN_PASSWORD_RESET_EXPIRES_AT || '');
  if (expected.length < 43 || code.length > 128 || !Number.isFinite(expires) || Date.now() >= expires) throw denied();
  const digest = (s:string) => createHash('sha256').update(s).digest();
  if (!timingSafeEqual(digest(code),digest(expected))) throw denied();
  if (password.length < 12 || Buffer.byteLength(password,'utf8') > 72 || isRetiredPassword(password)) {
    throw Object.assign(new Error('請設定至少 12 個字元、最多 72 位元組且未公開使用的新密碼'), {statusCode:400});
  }
  const user = await db.user.findUnique({where:{email:'admin@nightasaur.com'},select:{id:true,role:true}});
  if (!user || user.role !== 'ADMIN') throw denied();
  const receipt = 'password-reset-used:' + digest(code).toString('hex');
  const hash = await bcrypt.hash(password,12);
  try {
    await db.$transaction(async tx => {
      // Unique durable receipt prevents concurrent/replayed resets. Never a login session.
      await tx.generationTask.create({data:{id:receipt,userId:user.id,taskType:"ADMIN_PASSWORD_RESET",inputPrompt:"Owner-authorized password recovery",status:"COMPLETED",completedAt:new Date()}});
      await tx.user.update({where:{id:user.id},data:{passwordHash:hash}});
      await tx.session.deleteMany({where:{userId:user.id}});
    });
  } catch (error:any) {
    if (error?.code === 'P2002') throw denied();
    throw error;
  }
}
