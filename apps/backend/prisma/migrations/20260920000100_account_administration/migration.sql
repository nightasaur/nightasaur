CREATE TABLE "account_audits" (
 "id" TEXT NOT NULL PRIMARY KEY, "actorId" TEXT NOT NULL, "targetId" TEXT NOT NULL,
 "action" TEXT NOT NULL, "reason" TEXT NOT NULL, "previousActive" BOOLEAN NOT NULL,
 "resultingActive" BOOLEAN NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "account_audits_targetId_createdAt_idx" ON "account_audits"("targetId", "createdAt");

CREATE TRIGGER users_no_delete BEFORE DELETE ON users BEGIN SELECT RAISE(ABORT, 'Account removal forbidden'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON account_audits BEGIN SELECT RAISE(ABORT, 'Audit removal forbidden'); END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON account_audits BEGIN SELECT RAISE(ABORT, 'Audit modification forbidden'); END;
