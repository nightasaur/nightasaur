-- 添加命名歷史表
CREATE TABLE "naming_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT 'CLASSIC',
    "language" TEXT NOT NULL DEFAULT 'zh-TW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "naming_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 添加孵化記錄表
CREATE TABLE "hatching_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "initialTemperature" REAL NOT NULL,
    "initialHumidity" REAL NOT NULL,
    "finalProgress" REAL,
    "status" TEXT NOT NULL DEFAULT 'INCUBATING',
    "rewards" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hatching_records_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hatching_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 添加孵化互動表
CREATE TABLE "hatching_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 1,
    "progressBefore" REAL NOT NULL,
    "progressAfter" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "humidity" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hatching_interactions_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 添加精靈外觀表
CREATE TABLE "spirit_appearances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL UNIQUE,
    "baseAnimal" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "bodyParts" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "textures" TEXT NOT NULL,
    "patterns" TEXT NOT NULL,
    "genes" TEXT NOT NULL,
    "specialEffects" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spirit_appearances_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 添加外觀基因表
CREATE TABLE "appearance_genes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appearanceId" TEXT NOT NULL,
    "traitType" TEXT NOT NULL,
    "traitValue" TEXT NOT NULL,
    "isDominant" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "inheritedFrom" TEXT,
    "mutationType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appearance_genes_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "spirit_appearances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 添加外觀變更歷史表
CREATE TABLE "appearance_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "reason" TEXT,
    "cost" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appearance_changes_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appearance_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 創建索引
CREATE INDEX "naming_history_userId_idx" ON "naming_history"("userId");
CREATE INDEX "naming_history_element_idx" ON "naming_history"("element");
CREATE INDEX "hatching_records_spiritId_idx" ON "hatching_records"("spiritId");
CREATE INDEX "hatching_records_userId_idx" ON "hatching_records"("userId");
CREATE INDEX "hatching_records_status_idx" ON "hatching_records"("status");
CREATE INDEX "hatching_interactions_spiritId_idx" ON "hatching_interactions"("spiritId");
CREATE INDEX "hatching_interactions_createdAt_idx" ON "hatching_interactions"("createdAt");
CREATE INDEX "appearance_genes_appearanceId_idx" ON "appearance_genes"("appearanceId");
CREATE INDEX "appearance_genes_traitType_idx" ON "appearance_genes"("traitType");
CREATE INDEX "appearance_changes_spiritId_idx" ON "appearance_changes"("spiritId");
CREATE INDEX "appearance_changes_userId_idx" ON "appearance_changes"("userId");