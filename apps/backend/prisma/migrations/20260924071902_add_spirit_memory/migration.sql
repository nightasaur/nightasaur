-- CreateTable
CREATE TABLE "open_source_resources" (
    "id" TEXT NOT NULL,
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
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_source_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_source_content_chunks" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AUXILIARY_OPEN_SOURCE',
    "content" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "open_source_content_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_audits" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "previousActive" BOOLEAN NOT NULL,
    "resultingActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirit_memories" (
    "id" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'fact',
    "importance" INTEGER NOT NULL DEFAULT 5,
    "sourceConv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "spirit_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "open_source_resources_canonicalId_key" ON "open_source_resources"("canonicalId");

-- CreateIndex
CREATE INDEX "open_source_resources_kind_ingestionStatus_idx" ON "open_source_resources"("kind", "ingestionStatus");

-- CreateIndex
CREATE INDEX "open_source_resources_licenseExpression_idx" ON "open_source_resources"("licenseExpression");

-- CreateIndex
CREATE INDEX "open_source_content_chunks_resourceId_idx" ON "open_source_content_chunks"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "open_source_content_chunks_resourceId_sequence_key" ON "open_source_content_chunks"("resourceId", "sequence");

-- CreateIndex
CREATE INDEX "account_audits_targetId_createdAt_idx" ON "account_audits"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "spirit_memories_spiritId_importance_idx" ON "spirit_memories"("spiritId", "importance");

-- CreateIndex
CREATE INDEX "spirit_memories_userId_idx" ON "spirit_memories"("userId");

-- AddForeignKey
ALTER TABLE "open_source_content_chunks" ADD CONSTRAINT "open_source_content_chunks_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "open_source_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirit_memories" ADD CONSTRAINT "spirit_memories_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
