import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// 用 any 繞過 react-leaflet 型別載入問題
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

// 依螢幕寬度決定初始 zoom
function getInitialZoom(): number {
  if (typeof window === "undefined") return 15;
  const w = window.innerWidth;
  if (w < 768) return 15;   // 手機
  return 16;                // 平板 / 桌機
}

export default function SpiritWorldMap() {
  console.log("[Map] SpiritWorldMap 被渲染了");

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [zoom] = useState<number>(getInitialZoom());

  useEffect(() => {
    console.log("[Map] useEffect 開始定位，初始 zoom =", zoom);
    const fallback: [number, number] = [25.033, 121.5654]; // 台北 101

    if (!navigator.geolocation) {
      console.log("[Map] 瀏覽器不支援 geolocation，用 fallback");
      setUserPos(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[Map] 定位成功:", pos.coords.latitude, pos.coords.longitude);
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.log("[Map] 定位失敗，用 fallback:", err.message);
        setUserPos(fallback);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [zoom]);

  if (!userPos) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <p className="text-white/60 animate-pulse">正在定位...</p>
      </div>
    );
  }

  console.log("[Map] 準備渲染 MapContainer，中心點:", userPos, "zoom:", zoom);

  return (
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
      <MarkerAny position={userPos} icon={userIcon}>
        <Popup>你在這裡</Popup>
      </MarkerAny>
    </MapContainerAny>
  );
}