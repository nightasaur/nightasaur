// Simple server to test the system
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend",
    version: "1.0.0",
  });
});

// AR Location API
app.get("/api/ar/spawns/nearby", (_req, res) => {
  res.json({
    success: true,
    message: "AR Location System is working",
    hotspots: [
      { id: "1", name: "Taipei 101", latitude: 25.0339, longitude: 121.5644, type: "LANDMARK" },
      { id: "2", name: "Daan Forest Park", latitude: 25.0260, longitude: 121.5348, type: "PARK" },
    ]
  });
});

// Language API
app.get("/api/language/languages", (_req, res) => {
  res.json({
    success: true,
    message: "Language System is working",
    languages: [
      { code: "zh-TW", name: "Traditional Chinese" },
      { code: "zh-CN", name: "Simplified Chinese" },
      { code: "en-US", name: "English" },
      { code: "ja-JP", name: "Japanese" },
      { code: "ko-KR", name: "Korean" },
    ]
  });
});

// Game API
app.get("/api/game/status", (_req, res) => {
  res.json({
    success: true,
    message: "Game System is working",
    features: ["AR Exploration", "Multi-language", "Spirit Squad", "Puzzle System"]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│       🦖 Nightasaur Backend 🦖         │
│       AR & Language System Demo         │
├─────────────────────────────────────────┤
│ Server : http://localhost:${PORT}       │
│ API    : http://localhost:${PORT}/api   │
│ Env    : DEMO                           │
└─────────────────────────────────────────┘
  `);
});