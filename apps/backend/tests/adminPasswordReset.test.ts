import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {resetAdministratorPassword} from '../src/services/adminPasswordReset.js';
const require=createRequire(import.meta.url);
test('administrator reset expires, is one-use, revokes sessions and leaves other accounts unchanged',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nightasaur-reset-'));
 process.env.DATABASE_URL=`file:${join(dir,'test.db')}`;
 execFileSync(process.execPath,[require.resolve('prisma/build/index.js'),'db','push','--skip-generate','--schema','prisma/schema.prisma'],{env:process.env,stdio:'pipe'});
 const {PrismaClient}=await import('@prisma/client');const db=new PrismaClient();
 try {
  const oldHash=await bcrypt.hash('old-isolated-fixture',4);
  const user=await db.user.create({data:{email:'admin@nightasaur.com',username:'admin-fixture',role:'ADMIN',passwordHash:oldHash}});
  const other=await db.user.create({data:{email:'other@example.invalid',username:'other-fixture',passwordHash:oldHash}});
  await db.session.create({data:{userId:user.id,token:'isolated-session-fixture',expiresAt:new Date(Date.now()+3600000)}});
  const code=randomBytes(32).toString('base64url');process.env.ADMIN_PASSWORD_RESET_CODE=code;
  process.env.ADMIN_PASSWORD_RESET_EXPIRES_AT=new Date(Date.now()-1000).toISOString();
  await assert.rejects(resetAdministratorPassword(db,code,'new-isolated-password'),{statusCode:400});
  process.env.ADMIN_PASSWORD_RESET_EXPIRES_AT=new Date(Date.now()+60000).toISOString();
  await assert.rejects(resetAdministratorPassword(db,'wrong','new-isolated-password'),{statusCode:400});
  await assert.rejects(resetAdministratorPassword(db,code,'short'),{statusCode:400});
  await resetAdministratorPassword(db,code,'new-isolated-password');
  assert.ok(await bcrypt.compare('new-isolated-password',(await db.user.findUniqueOrThrow({where:{id:user.id}})).passwordHash));
  assert.equal(await db.session.count({where:{userId:user.id}}),0);
  assert.equal((await db.user.findUniqueOrThrow({where:{id:other.id}})).passwordHash,oldHash);
  await assert.rejects(resetAdministratorPassword(db,code,'another-isolated-password'),{statusCode:400});
  assert.ok(await bcrypt.compare('new-isolated-password',(await db.user.findUniqueOrThrow({where:{id:user.id}})).passwordHash));
 }finally{await db.$disconnect();await rm(dir,{recursive:true,force:true});}
});
