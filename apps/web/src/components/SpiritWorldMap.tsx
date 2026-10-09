import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { npcAPI } from "../api/client";
import NpcEncounterDialog from "./NpcEncounterDialog";

// 用 any 繞過 react-leaflet 型別載入問題
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;
const PopupAny = Popup as any;
const useMapAny = useMap as any;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ENCOUNTER_M = 50;
const DEBUG_FALLBACK: [number, number] = [25.033, 121.5654];

// 玩家位置：發光青色圓點
const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 20px; height: 20px;
    background: #22d3ee;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 20px #22d3ee, 0 0 40px #22d3ee;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// 龍 marker：圓形裁圖 + 元素色邊框
function npcIcon(image: string, element: string): L.DivIcon {
  const colors: Record<string, string> = {
    FIRE: "#f97316", WATER: "#06b6d4", LIGHT: "#fbbf24",
    SHADOW: "#8b5cf6", STAR: "#a855f7", ILLUSION: "#ec4899",
    MOON: "#94a3b8", NATURE: "#10b981", THUNDER: "#eab308", ICE: "#38bdf8",
  };
  const c = colors[element] || "#14b8a6";
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 48px; height: 48px;
      border-radius: 50%;
      border: 3px solid ${c};
      box-shadow: 0 0 12px ${c}, 0 0 24px ${c}80;
      background-image: url('${image}');
      background-size: cover;
      background-position: center;
    "></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function getInitialZoom(): number {
  if (typeof window === "undefined") return 15;
  return window.innerWidth < 768 ? 15 : 16;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

// 讓地圖跟隨玩家位置
function FollowUser({ pos }: { pos: [number, number] | null }) {
  const map = useMapAny();
  useEffect(() => {
    if (!pos) return;
    map.flyTo(pos, map.getZoom(), { duration: 1 });
  }, [pos, map]);
  return null;
}

interface Spawn {
  id: string;
  npcKey: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  meta?: { key: string; name: string; element: string; image: string; personality: string };
}

export default function SpiritWorldMap() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [encounter, setEncounter] = useState<Spawn | null>(null);
  const [gpsError, setGpsError] = useState(false);
  const [zoom] = useState<number>(getInitialZoom());
  const triggeredRef = useRef<Set<string>>(new Set());
  const userPosRef = useRef<[number, number] | null>(null);
  const initialFetchDone = useRef(false);
  const lastPosRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  // 定位（持續追蹤）
  useEffect(() => {
    if (!navigator.geolocation) {
      if (import.meta.env.DEV) setUserPos(DEBUG_FALLBACK);
      else setGpsError(true);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setGpsError(false);
      const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      const last = lastPosRef.current;
      if (last) {
        const d = haversineKm(last[0], last[1], next[0], next[1]);
        if (d < 0.01) return; // 移動 <10m 不更新，避免手機卡死
      }
      lastPosRef.current = next;
      setUserPos(next);
    };
    const onError = () => {
      if (import.meta.env.DEV) {
        setUserPos(DEBUG_FALLBACK);
      } else {
        setGpsError(true);
      }
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 首次拿到位置 → 拉 nearby；之後每 30 分鐘重拉一次
  useEffect(() => {
    if (!userPos || initialFetchDone.current) return;
    initialFetchDone.current = true;

    const fetchNearby = () => {
      const p = userPosRef.current;
      if (!p) return;
      npcAPI.nearby(p[0], p[1])
        .then((r) => setSpawns(r.data))
        .catch((e) => console.warn("[NPC] nearby failed:", e));
    };

    fetchNearby();
    const interval = setInterval(fetchNearby, 30 * 60 * 1000); // 30 分鐘
    return () => clearInterval(interval);
  }, [userPos]);

  // 玩家位置變動 → 重算距離 → 檢查遭遇
  useEffect(() => {
    if (!userPos || spawns.length === 0) return;
    const [lat, lng] = userPos;

    setSpawns((prev) =>
      prev.map((s) => ({
        ...s,
        distanceKm: haversineKm(lat, lng, s.latitude, s.longitude),
      }))
    );

    const hit = spawns.find(
      (s) =>
        !triggeredRef.current.has(s.id) &&
        haversineKm(lat, lng, s.latitude, s.longitude) * 1000 < ENCOUNTER_M
    );
    if (hit) {
      triggeredRef.current.add(hit.id);
      setEncounter(hit);
    }
  }, [userPos, spawns.length]);

  // DEV-only：按 T 立刻觸發最近一隻龍的遭遇
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t") return;
      if (spawns.length === 0) return;
      const nearest = [...spawns].sort((a, b) => a.distanceKm - b.distanceKm)[0];
      triggeredRef.current.add(nearest.id);
      setEncounter(nearest);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spawns]);

  const handleEncountered = async (spawnId: string) => {
    try {
      await npcAPI.encounter(spawnId);
    } catch (e) {
      console.warn("[NPC] encounter report failed:", e);
    }
    // 從本地移除該 spawn（後端已重生到 10km 外）
    setSpawns((prev) => prev.filter((s) => s.id !== spawnId));
  };

  if (gpsError && !import.meta.env.DEV) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-white/60">請開啟定位以探索精靈世界</p>
        </div>
      </div>
    );
  }

  if (!userPos) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <p className="text-white/60 animate-pulse">正在定位...</p>
      </div>
    );
  }

  return (
    <>
      <MapContainerAny
        center={userPos}
        zoom={zoom}
        maxZoom={19}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayerAny
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={16}
          maxZoom={19}
        />
        <FollowUser pos={userPos} />
        <MarkerAny position={userPos} icon={userIcon}>
          <PopupAny>你在這裡</PopupAny>
        </MarkerAny>

        {spawns.map((s) => (
          <MarkerAny
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={npcIcon(s.meta?.image || "", s.meta?.element || "FIRE")}
          >
            <PopupAny>
              <div className="text-center">
                <strong>{s.meta?.name}</strong>
                <br />
                {s.distanceKm.toFixed(2)} km
              </div>
            </PopupAny>
          </MarkerAny>
        ))}
      </MapContainerAny>

      {encounter && (
        <NpcEncounterDialog
          spawn={encounter as any}
          onClose={() => setEncounter(null)}
          onEncountered={handleEncountered}
        />
      )}
    </>
  );
}