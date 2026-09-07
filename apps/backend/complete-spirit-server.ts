// Nightasaur 完整遊戲後台系統 - 包含新命名、孵化、外觀系統
import express from "express";
import cors from "cors";
import spiritSystemsRouter from "./src/routes/spiritSystems.js";

const app = express();

// 中間件
app.use(cors());
app.use(express.json());

// 健康檢查
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Nightasaur 遊戲後台系統運行正常",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    features: [
      "命名系統 (重新設定)",
      "孵化系統 (重新設定)", 
      "精靈外觀系統 (動物園主題)",
      "多語言支持",
      "AR探索系統"
    ]
  });
});

// 系統狀態
app.get("/api/system/status", (_req, res) => {
  res.json({
    success: true,
    system: "Nightasaur 精靈養成系統",
    version: "2.0.0",
    subsystems: {
      naming: { status: "ACTIVE", version: "1.0.0" },
      hatching: { status: "ACTIVE", version: "1.0.0" },
      appearance: { status: "DEVELOPMENT", version: "0.9.0" },
      spirit: { status: "ACTIVE", version: "1.5.0" }
    },
    languages: ["zh-TW", "zh-CN", "en-US", "ja-JP", "ko-KR"],
    primaryLanguage: "zh-TW"
  });
});

// 精靈系統路由
app.use("/api/spirit-systems", spiritSystemsRouter);