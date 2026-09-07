-- CreateTable
CREATE TABLE "puzzle_levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'EASY',
    "type" TEXT NOT NULL,
    "puzzleData" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "unlockLevel" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "spirit_puzzle_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "bestTime" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "spirit_puzzle_progress_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spirit_puzzle_progress_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzle_levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spirit_upgrades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spiritId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" DATETIME,
    CONSTRAINT "spirit_upgrades_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_puzzles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "streakBonus" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "daily_puzzles_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzle_levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "squads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSize" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "squads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "squad_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "squad_members_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "squad_members_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "squad_trainings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "lastTrained" DATETIME,
    CONSTRAINT "squad_trainings_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "squad_trainings_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SquadFormation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SquadFormation_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "location_spawns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "spawnRate" REAL NOT NULL DEFAULT 0.5,
    "radius" INTEGER NOT NULL DEFAULT 100,
    "availableSpirits" TEXT NOT NULL,
    "activeSpawn" TEXT,
    "spawnStartTime" DATETIME,
    "spawnEndTime" DATETIME,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "totalSpawns" INTEGER NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "lastSpawnTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "player_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "accuracy" REAL,
    "altitude" REAL,
    "speed" REAL,
    "heading" REAL,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "location_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distance" REAL NOT NULL,
    "spiritFound" BOOLEAN NOT NULL DEFAULT false,
    "spiritId" TEXT,
    CONSTRAINT "location_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "location_visits_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location_spawns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "location_visits_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ar_captures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "arData" TEXT NOT NULL,
    "captureTime" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "itemsFound" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ar_captures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ar_captures_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "spirits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ar_captures_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location_spawns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hotspots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL DEFAULT 1,
    "spawnTypes" TEXT NOT NULL,
    "bonusRate" REAL NOT NULL DEFAULT 1.2,
    "peakHours" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "language_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "primaryLang" TEXT NOT NULL DEFAULT 'zh-TW',
    "secondaryLang" TEXT,
    "displayMode" TEXT NOT NULL DEFAULT 'SINGLE',
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "theme" TEXT NOT NULL DEFAULT 'LIGHT',
    "autoDetect" BOOLEAN NOT NULL DEFAULT true,
    "showRomanization" BOOLEAN NOT NULL DEFAULT false,
    "showPinyin" BOOLEAN NOT NULL DEFAULT false,
    "showEnglishHint" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "language_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "zhTW" TEXT NOT NULL,
    "zhCN" TEXT NOT NULL,
    "enUS" TEXT NOT NULL,
    "jaJP" TEXT,
    "koKR" TEXT,
    "description" TEXT,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_language_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromLang" TEXT NOT NULL,
    "toLang" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_language_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "musicVolume" INTEGER NOT NULL DEFAULT 70,
    "soundVolume" INTEGER NOT NULL DEFAULT 80,
    "musicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vibrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vibrationStrength" INTEGER NOT NULL DEFAULT 50,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "autoSaveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showTutorials" BOOLEAN NOT NULL DEFAULT true,
    "showDamageNumbers" BOOLEAN NOT NULL DEFAULT true,
    "showFPS" BOOLEAN NOT NULL DEFAULT false,
    "graphicsQuality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "shadowsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "antiAliasingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "touchSensitivity" INTEGER NOT NULL DEFAULT 50,
    "autoAimEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "spirit_puzzle_progress_spiritId_puzzleId_key" ON "spirit_puzzle_progress"("spiritId", "puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "spirit_upgrades_spiritId_upgradeType_key" ON "spirit_upgrades"("spiritId", "upgradeType");

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzles_date_key" ON "daily_puzzles"("date");

-- CreateIndex
CREATE UNIQUE INDEX "squads_userId_key" ON "squads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "squad_members_squadId_spiritId_key" ON "squad_members"("squadId", "spiritId");

-- CreateIndex
CREATE UNIQUE INDEX "squad_members_squadId_position_key" ON "squad_members"("squadId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "squad_trainings_squadId_spiritId_trainingType_key" ON "squad_trainings"("squadId", "spiritId", "trainingType");

-- CreateIndex
CREATE UNIQUE INDEX "SquadFormation_squadId_name_key" ON "SquadFormation"("squadId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "player_locations_userId_key" ON "player_locations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "language_preferences_userId_key" ON "language_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_module_key" ON "translations"("key", "module");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
