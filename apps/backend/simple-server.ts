// Nightasaur 完整後台系統 - 簡化版本
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 首頁
app.get("/", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>🦖 Nightasaur 後台</title></head>
<body>
<h1>🦖 Nightasaur 完整後台系統 v2.0</h1>
<p>服務器運行中 | 主要語言: 繁體中文</p>
<p>帳號: admin@nightasaur.com / admin123</p>
<p>測試帳號: test@nightasaur.com / test123</p>
</body>
</html>`);
});

// 健康檢查
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend v2.0",
    version: "2.0.0",
    features: ["註冊/登入系統", "多語言設定", "音效/震動設定"]
  });
});

// 語言列表
app.get("/api/language/languages", (_req, res) => {
  res.json({
    success: true,
    languages: [
      { code: "zh-TW", name: "繁體中文", isPrimary: true },
      { code: "zh-CN", name: "簡體中文", isPrimary: false },
      { code: "en-US", name: "English", isPrimary: false }
    ]
  });
});

// 模擬註冊
app.post("/api/auth/register", (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ success: false, message: "請提供電子郵件、用戶名和密碼" });
  }
  
  res.json({
    success: true,
    message: "註冊成功（模擬）",
    user: { email, username },
    token: "simulated-jwt-token"
  });
});

// 模擬登入
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "請提供電子郵件和密碼" });
  }
  
  res.json({
    success: true,
    message: "登入成功（模擬）",
    user: { email, username: email.split('@')[0] },
    languagePreference: { primaryLang: "zh-TW", fontSize: 16, theme: "LIGHT" },
    userSettings: { musicVolume: 70, soundVolume: 80, vibrationEnabled: true, vibrationStrength: 50 },
    token: "simulated-jwt-token"
  });
});

// 模擬設定
app.get("/api/settings", (req, res) => {
  res.json({
    success: true,
    settings: {
      language: { primaryLang: "zh-TW", fontSize: 16, theme: "LIGHT" },
      audio: { musicVolume: 70, soundVolume: 80, musicEnabled: true, soundEnabled: true },
      vibration: { vibrationEnabled: true, vibrationStrength: 50 }
    }
  });
});

// 模擬更新語言設定
app.put("/api/settings/language", (req, res) => {
  const { primaryLang, fontSize, theme } = req.body;
  res.json({
    success: true,
    message: "語言設定已更新（模擬）",
    languagePreference: { primaryLang: primaryLang || "zh-TW", fontSize: fontSize || 16, theme: theme || "LIGHT" }
  });
});

// 模擬更新音效設定
app.put("/api/settings/audio", (req, res) => {
  const { musicVolume, soundVolume, musicEnabled, soundEnabled } = req.body;
  res.json({
    success: true,
    message: "音效設定已更新（模擬）",
    audioSettings: { 
      musicVolume: musicVolume || 70, 
      soundVolume: soundVolume || 80, 
      musicEnabled: musicEnabled !== undefined ? musicEnabled : true, 
      soundEnabled: soundEnabled !== undefined ? soundEnabled : true 
    }
  });
});

// 模擬更新震動設定
app.put("/api/settings/vibration", (req, res) => {
  const { vibrationEnabled, vibrationStrength } = req.body;
  res.json({
    success: true,
    message: "震動設定已更新（模擬）",
    vibrationSettings: { 
      vibrationEnabled: vibrationEnabled !== undefined ? vibrationEnabled : true, 
      vibrationStrength: vibrationStrength || 50 
    }
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
===========================================
🦖 Nightasaur 完整後台系統 v2.0 🦖
===========================================
服務器: http://localhost:${PORT}
功能:
  ✅ 用戶註冊/登入系統（模擬）
  ✅ 多語言設定管理（模擬）
  ✅ 音效/震動設定（模擬）
===========================================
  `);
});