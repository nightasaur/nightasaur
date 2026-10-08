import prisma from "../config/prisma.js";
import { NPCS, NPC_BY_KEY } from "../data/npcs.js";

const SPAWN_MIN_KM = 1;
const SPAWN_MAX_KM = 3;
const REGEN_DISTANCE_KM = 10;
const SPAWN_TTL_MS = 24 * 60 * 60 * 1000;

/** 在距離 (lat,lng) 的 [minKm, maxKm] 環狀範圍內隨機取一點 */
function randomPointAround(lat: number, lng: number, minKm: number, maxKm: number) {
  const km = minKm + Math.random() * (maxKm - minKm);
  const bearing = Math.random() * 2 * Math.PI;
  const dLat = (km / 111) * Math.cos(bearing);
  const dLng = (km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(bearing);
  return { latitude: lat + dLat, longitude: lng + dLng };
}

/** 兩點間距離（km），Haversine */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 清理過期 spawn */
async function pruneExpired(userId: string) {
  await prisma.npcSpawn.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
}

/** 確認數量至少 min 隻，缺的補上；回傳該玩家所有有效 spawn */
export async function ensureSpawns(
  userId: string,
  userLat: number,
  userLng: number
): Promise<Array<{ id: string; npcKey: string; latitude: number; longitude: number; distanceKm: number }>> {
  await pruneExpired(userId);

  let spawns = await prisma.npcSpawn.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
  });

  // 隨機目標數量 1-9（如果現有數量已達標就不再補）
  const target = Math.floor(Math.random() * 9) + 1;
  const need = target - spawns.length;
  if (need > 0) {
    const usedKeys = new Set(spawns.map((s) => s.npcKey));
    const available = NPCS.filter((n) => !usedKeys.has(n.key));
    const toAdd = Math.min(need, available.length);

    for (let i = 0; i < toAdd; i++) {
      const meta = available[i];
      const pt = randomPointAround(userLat, userLng, SPAWN_MIN_KM, SPAWN_MAX_KM);
      await prisma.npcSpawn.create({
        data: {
          userId,
          npcKey: meta.key,
          latitude: pt.latitude,
          longitude: pt.longitude,
          expiresAt: new Date(Date.now() + SPAWN_TTL_MS),
        },
      });
    }

    spawns = await prisma.npcSpawn.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  }

  return spawns.map((s) => ({
    id: s.id,
    npcKey: s.npcKey,
    latitude: s.latitude,
    longitude: s.longitude,
    distanceKm: distanceKm(userLat, userLng, s.latitude, s.longitude),
  }));
}

/** 遭遇：標記 encounterAt，並把該龍重生到 10km 外 */
export async function encounterSpawn(userId: string, spawnId: string) {
  const spawn = await prisma.npcSpawn.findFirst({ where: { id: spawnId, userId } });
  if (!spawn) throw Object.assign(new Error("Spawn not found"), { statusCode: 404 });

  const pt = randomPointAround(spawn.latitude, spawn.longitude, REGEN_DISTANCE_KM, REGEN_DISTANCE_KM + 3);
  return prisma.npcSpawn.update({
    where: { id: spawnId },
    data: {
      latitude: pt.latitude,
      longitude: pt.longitude,
      encounterAt: new Date(),
    },
  });
}

/** 從 key 找 system user 名下的 NPC spirit */
export async function findNpcSpiritByKey(npcKey: string) {
  const meta = NPC_BY_KEY.get(npcKey);
  if (!meta) return null;
  return prisma.spirit.findFirst({
    where: {
      isActive: true,
      user: { email: "npc@nightasaur.local" },
      name: meta.name,
    },
  });
}
