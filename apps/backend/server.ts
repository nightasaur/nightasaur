// Nightasaur 遊戲後台系統 - 繁體中文主要版本
import express from "express";
import cors from "cors";

const app = express();
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
        .api-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .api-item { border-left: 4px solid #667eea; padding-left: 15px; }
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
                <button class="lang-btn" onclick="switchLang('ja-JP')">日本語</button>
                <button class="lang-btn" onclick="switchLang('ko-KR')">한국어</button>
            </div>
            <p>主要使用繁體中文，可切換至其他語言界面</p>
        </div>
        
        <div class="card">
            <h2>🔗 API 接口</h2>
            <div class="api-list">
                <div class="api-item">
                    <h3>GET /api/health</h3>
                    <p>健康檢查</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/ar/spawns/nearby</h3>
                    <p>AR位置探索</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/language/languages</h3>
                    <p>多語言設定</p>
                </div>
                <div class="api-item">
                    <h3>POST /api/language/switch</h3>
                    <p>切換語言</p>
                </div>
            </div>
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
app.use(cors());
app.use(express.json());

// 健康檢查
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

// AR位置系統
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
        type: "地標",
        description: "台灣著名地標建築"
      },
      { 
        id: "2", 
        name: "大安森林公園", 
        name_en: "Daan Forest Park",
        name_zh_cn: "大安森林公园",
        latitude: 25.0260, 
        longitude: 121.5348, 
        type: "公園",
        description: "台北市中心的城市綠洲"
      },
    ]
  });
});

// 多語言系統
app.get("/api/language/languages", (_req, res) => {
  res.json({
    success: true,
    message: "多語言系統運作正常",
    primaryLanguage: "zh-TW",
    languages: [
      { 
        code: "zh-TW", 
        name: "繁體中文",
        name_en: "Traditional Chinese",
        name_zh_cn: "繁体中文",
        isPrimary: true,
        displayOrder: 1
      },
      { 
        code: "zh-CN", 
        name: "簡體中文",
        name_en: "Simplified Chinese",
        name_zh_cn: "简体中文",
        isPrimary: false,
        displayOrder: 2
      },
      { 
        code: "en-US", 
        name: "English",
        name_en: "English",
        name_zh_cn: "英语",
        isPrimary: false,
        displayOrder: 3
      },
      { 
        code: "ja-JP", 
        name: "日本語",
        name_en: "Japanese",
        name_zh_cn: "日语",
        isPrimary: false,
        displayOrder: 4
      },
      { 
        code: "ko-KR", 
        name: "한국어",
        name_en: "Korean",
        name_zh_cn: "韩语",
        isPrimary: false,
        displayOrder: 5
      },
    ]
  });
});

// 語言切換
app.post("/api/language/switch", (req, res) => {
  const { language } = req.body;
  
  const languages = {
    "zh-TW": { code: "zh-TW", name: "繁體中文" },
    "zh-CN": { code: "zh-CN", name: "簡體中文" },
    "en-US": { code: "en-US", name: "English" },
    "ja-JP": { code: "ja-JP", name: "日本語" },
    "ko-KR": { code: "ko-KR", name: "한국어" },
  };
  
  const lang = languages[language];
  
  if (!lang) {
    return res.status(400).json({
      success: false,
      message: "不支援的語言代碼"
    });
  }
  
  res.json({
    success: true,
    message: `語言已切換至 ${lang.name}`,
    language: lang.code,
    languageName: lang.name
  });
});

// 遊戲系統狀態
app.get("/api/game/status", (_req, res) => {
  res.json({
    success: true,
    message: "遊戲系統運作正常",
    features: [
      "AR探索系統 (繁體中文界面)",
      "多語言設定 (繁體/簡體中文分離)",
      "精靈小隊管理",
      "益智關卡系統"
    ],
    stats: {
      totalUsers: 1234,
      activeToday: 567,
      spiritsCaught: 8901
    }
  });
});

// 繁體中文專用功能
app.get("/api/zh-tw/features", (_req, res) => {
  res.json({
    success: true,
    message: "繁體中文專用功能",
    features: [
      "正體中文顯示界面",
      "台灣地區內容本地化",
      "注音學習輔助功能",
      "繁體字形優化"
    ]
  });
});

// 簡體中文專用功能
app.get("/api/zh-cn/features", (_req, res) => {
  res.json({
    success: true,
    message: "简体中文专用功能",
    features: [
      "简体中文显示界面",
      "大陆地区内容本地化",
      "拼音学习辅助功能",
      "简体字形优化"
    ]
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
API接口: http://localhost:${PORT}/api
主要語言: 繁體中文
支持語言: 繁體中文、簡體中文、English、日本語、한국어
===========================================
  `);
});