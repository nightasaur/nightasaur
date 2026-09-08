// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

// Nightasaur 遊戲後台系統 - 繁體中文主要版本
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 首頁路由
app.get("/", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦖 Nightasaur 遊戲後台系統</title>
    <style>
        body { font-family: 'Microsoft JhengHei', sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .lang-btns { display: flex; gap: 10px; margin: 20px 0; }
        .lang-btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; }
        .lang-btn.active { background: #667eea; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦖 Nightasaur 遊戲後台系統</h1>
            <p>AR探索 × 多語言設定 × 精靈小隊 - 繁體中文主要版本</p>
        </div>
        
        <div class="card">
            <h2>📊 系統狀態</h2>
            <p>✅ 服務器運行中 | 版本: 1.0.0 | 主要語言: 繁體中文</p>
        </div>
        
        <div class="card">
            <h2>🌐 語言選擇</h2>
            <div class="lang-btns">
                <button class="lang-btn active" onclick="switchLang('zh-TW')">繁體中文</button>
                <button class="lang-btn" onclick="switchLang('zh-CN')">簡體中文</button>
                <button class="lang-btn" onclick="switchLang('en-US')">English</button>
            </div>
            <p>主要使用繁體中文，可切換至其他語言界面</p>
        </div>
        
        <div class="card">
            <h2>🔗 API 接口</h2>
            <p><a href="/api/health">/api/health</a> - 健康檢查</p>
            <p><a href="/api/ar/spawns/nearby">/api/ar/spawns/nearby</a> - AR位置探索</p>
            <p><a href="/api/language/languages">/api/language/languages</a> - 多語言設定</p>
        </div>
    </div>
    
    <script>
        function switchLang(lang) {
            fetch('/api/language/switch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({language: lang})
            }).then(res => res.json()).then(data => {
                if(data.success) alert('已切換至: ' + data.languageName);
            });
        }
    </script>
</body>
</html>
  `);
});

// API 路由
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend",
    version: "1.0.0",
    primaryLanguage: "zh-TW",
    languageDescription: "繁體中文 (主要語言)"
  });
});

app.get("/api/ar/spawns/nearby", (_req, res) => {
  res.json({
    success: true,
    message: "AR位置系統運作正常",
    hotspots: [
      { 
        id: "1", 
        name: "台北101", 
        name_en: "Taipei 101",
        name_zh_cn: "台北101",
        latitude: 25.0339, 
        longitude: 121.5644, 
        type: "地標"
      },
      { 
        id: "2", 
        name: "大安森林公園", 
        name_en: "Daan Forest Park",
        name_zh_cn: "大安森林公园",
        latitude: 25.0260, 
        longitude: 121.5348, 
        type: "公園"
      },
    ]
  });
});

app.get("/api/language/languages", (_req, res) => {
  res.json({
    success: true,
    message: "多語言系統運作正常",
    primaryLanguage: "zh-TW",
    languages: [
      { code: "zh-TW", name: "繁體中文", isPrimary: true },
      { code: "zh-CN", name: "簡體中文", isPrimary: false },
      { code: "en-US", name: "English", isPrimary: false },
    ]
  });
});

app.post("/api/language/switch", (req, res) => {
  const { language } = req.body;
  const languages = {
    "zh-TW": "繁體中文",
    "zh-CN": "簡體中文",
    "en-US": "English"
  };
  
  if (!languages[language]) {
    return res.status(400).json({ success: false, message: "不支援的語言代碼" });
  }
  
  res.json({
    success: true,
    message: `語言已切換至 ${languages[language]}`,
    language: language,
    languageName: languages[language]
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
===========================================
🦖 Nightasaur 遊戲後台系統 🦖
===========================================
服務器: http://localhost:${PORT}
主要語言: 繁體中文
===========================================
  `);
});