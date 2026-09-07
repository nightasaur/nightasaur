/*
  Warnings:

  - You are about to drop the `daily_stories` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "spirits" ADD COLUMN "customization" TEXT;
ALTER TABLE "spirits" ADD COLUMN "species" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "daily_stories";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📋',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quest_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quest_progress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quest_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🏆',
    "category" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "requirement" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "emoji" TEXT NOT NULL DEFAULT '📦',
    "description" TEXT NOT NULL,
    "effect" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PLAYER',
    "trainerXp" INTEGER NOT NULL DEFAULT 0,
    "trainerLevel" INTEGER NOT NULL DEFAULT 1,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatarUrl", "bio", "createdAt", "email", "id", "isActive", "passwordHash", "role", "updatedAt", "username") SELECT "avatarUrl", "bio", "createdAt", "email", "id", "isActive", "passwordHash", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "quest_progress_questId_userId_key" ON "quest_progress"("questId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_items_userId_itemId_key" ON "user_items"("userId", "itemId");
