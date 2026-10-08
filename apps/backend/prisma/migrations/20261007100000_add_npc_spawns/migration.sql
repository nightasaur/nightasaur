-- CreateTable
CREATE TABLE "npc_spawns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "npcKey" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "spawnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "encounterAt" TIMESTAMP(3),

    CONSTRAINT "npc_spawns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "npc_spawns_userId_expiresAt_idx" ON "npc_spawns"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "npc_spawns" ADD CONSTRAINT "npc_spawns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
