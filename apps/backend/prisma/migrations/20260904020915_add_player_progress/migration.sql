-- CreateTable
CREATE TABLE "PlayerProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "questsCompleted" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProgress_userId_key" ON "PlayerProgress"("userId");
