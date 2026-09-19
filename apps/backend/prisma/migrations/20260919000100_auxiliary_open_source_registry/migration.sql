-- Open-source provenance registry. Applying this migration to production is
-- explicitly outside the scope of this PR and requires a separate approval.
CREATE TABLE "open_source_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AUXILIARY_OPEN_SOURCE',
    "sourceUrl" TEXT NOT NULL,
    "version" TEXT,
    "licenseExpression" TEXT NOT NULL DEFAULT 'NOASSERTION',
    "licenseUrl" TEXT,
    "attribution" TEXT,
    "contentSha256" TEXT,
    "contentIncluded" BOOLEAN NOT NULL DEFAULT false,
    "policyReviewStatus" TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "legalReviewStatus" TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
    "ingestionStatus" TEXT NOT NULL DEFAULT 'METADATA_ONLY',
    "decisionReason" TEXT NOT NULL,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "shareAlikeRequired" BOOLEAN NOT NULL DEFAULT false,
    "commercialUseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "redistributionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "modificationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "containsChildData" BOOLEAN NOT NULL DEFAULT false,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT false,
    "provenanceJson" TEXT NOT NULL DEFAULT '{}',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "open_source_resources_role_check"
      CHECK ("role" = 'AUXILIARY_OPEN_SOURCE'),
    CONSTRAINT "open_source_resources_authority_check"
      CHECK ("isAuthoritative" = false),
    CONSTRAINT "open_source_resources_policy_status_check"
      CHECK ("policyReviewStatus" IN ('APPROVED', 'REVIEW_REQUIRED', 'REJECTED')),
    CONSTRAINT "open_source_resources_legal_status_check"
      CHECK ("legalReviewStatus" IN ('APPROVED', 'NOT_REVIEWED')),
    CONSTRAINT "open_source_resources_ingestion_status_check"
      CHECK ("ingestionStatus" IN ('CONTENT_APPROVED', 'METADATA_ONLY', 'REJECTED')),
    CONSTRAINT "open_source_resources_source_url_check"
      CHECK ("sourceUrl" LIKE 'https://%')
);

CREATE TABLE "open_source_content_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AUXILIARY_OPEN_SOURCE',
    "content" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "open_source_content_chunks_role_check"
      CHECK ("role" = 'AUXILIARY_OPEN_SOURCE'),
    CONSTRAINT "open_source_content_chunks_authority_check"
      CHECK ("isAuthoritative" = false),
    CONSTRAINT "open_source_content_chunks_resourceId_fkey"
      FOREIGN KEY ("resourceId") REFERENCES "open_source_resources" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "open_source_resources_canonicalId_key"
  ON "open_source_resources"("canonicalId");
CREATE INDEX "open_source_resources_kind_ingestionStatus_idx"
  ON "open_source_resources"("kind", "ingestionStatus");
CREATE INDEX "open_source_resources_licenseExpression_idx"
  ON "open_source_resources"("licenseExpression");
CREATE UNIQUE INDEX "open_source_content_chunks_resourceId_sequence_key"
  ON "open_source_content_chunks"("resourceId", "sequence");
CREATE INDEX "open_source_content_chunks_resourceId_idx"
  ON "open_source_content_chunks"("resourceId");

CREATE TRIGGER "open_source_content_chunks_approved_insert"
BEFORE INSERT ON "open_source_content_chunks"
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM "open_source_resources"
  WHERE "id" = NEW."resourceId"
    AND "contentIncluded" = true
    AND "policyReviewStatus" = 'APPROVED'
    AND "legalReviewStatus" = 'APPROVED'
    AND "ingestionStatus" = 'CONTENT_APPROVED'
    AND "isAuthoritative" = false
)
BEGIN
  SELECT RAISE(ABORT, 'content requires approved auxiliary resource');
END;
