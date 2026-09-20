CREATE TABLE "account_audits" (
 "id" TEXT NOT NULL PRIMARY KEY, "actorId" TEXT NOT NULL, "targetId" TEXT NOT NULL,
 "action" TEXT NOT NULL, "reason" TEXT NOT NULL, "previousActive" BOOLEAN NOT NULL,
 "resultingActive" BOOLEAN NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "account_audits_targetId_createdAt_idx" ON "account_audits"("targetId", "createdAt");

CREATE FUNCTION deny_account_removal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Accounts may only be suspended or restored; permanent removal is forbidden'; END;
$$;
CREATE TRIGGER users_no_delete BEFORE DELETE ON "users" FOR EACH ROW EXECUTE FUNCTION deny_account_removal();
CREATE TRIGGER users_no_truncate BEFORE TRUNCATE ON "users" FOR EACH STATEMENT EXECUTE FUNCTION deny_account_removal();
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON "account_audits" FOR EACH ROW EXECUTE FUNCTION deny_account_removal();
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON "account_audits" FOR EACH STATEMENT EXECUTE FUNCTION deny_account_removal();
