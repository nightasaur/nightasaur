// Nightasaur 完整後台系統 - 包含註冊/登入/設定功能
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "nightasaur-secret-key-2026";

// 中間件：驗證JWT令牌
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "需要身份驗證" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        LanguagePreference: true,
        UserSettings: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "用戶不存在" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "無效的令牌" });
  }
};

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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦖 Nightasaur 完整後台系統 v2.0</h1>
            <p>註冊/登入/設定管理 - 繁體中文主要界面</p>
        </div>
        
        <div class="card">
            <h2>📊 系統狀態</h2>
            <p>✅ 服務器運行中 | 版本: 2.0.0 | 主要語言: 繁體中文</p>
            <p>📦 數據庫: Prisma + SQLite | 🔐 認證: JWT</p>
            <p>🎵 音效設定: 音樂/音效/震動 | 🌐 語言設定: 繁體/簡體/英文</p>
        </div>
        
        <div class="card">
            <h2>🔗 API 接口列表</h2>
            <div class="api-list">
                <div class="api-item">
                    <h3>POST /api/auth/register</h3>
                    <p>用戶註冊 - 創建新帳號</p>
                </div>
                <div class="api-item">
                    <h3>POST /api/auth/login</h3>
                    <p>用戶登入 - 獲取JWT令牌</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/auth/profile</h3>
                    <p>取得個人資料 - 需要認證</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/settings</h3>
                    <p>取得所有用戶設定</p>
                </div>
                <div class="api-item">
                    <h3>PUT /api/settings/language</h3>
                    <p>更新語言設定</p>
                </div>
                <div class="api-item">
                    <h3>PUT /api/settings/audio</h3>
                    <p>更新音效設定 (音樂/音效)</p>
                </div>
                <div class="api-item">
                    <h3>PUT /api/settings/vibration</h3>
                    <p>更新震動設定</p>
                </div>
                <div class="api-item">
                    <h3>PUT /api/settings/game</h3>
                    <p>更新遊戲設定</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/health</h3>
                    <p>健康檢查</p>
                </div>
                <div class="api-item">
                    <h3>GET /api/language/languages</h3>
                    <p>獲取支持語言列表</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>📝 使用說明</h2>
            <h3>1. 註冊新帳號</h3>
            <pre>curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","username":"player1","password":"password123"}'</pre>
            
            <h3>2. 登入獲取令牌</h3>
            <pre>curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password123"}'</pre>
            
            <h3>3. 使用令牌訪問受保護API</h3>
            <pre>curl http://localhost:3000/api/auth/profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"</pre>
            
            <h3>4. 更新語言設定</h3>
// ==================== 認證API ====================

// 用戶註冊
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 驗證輸入
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "請提供電子郵件、用戶名和密碼"
      });
    }

    // 檢查用戶是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "電子郵件或用戶名已被使用"
      });
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(password, 10);

    // 創建用戶
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff`,
        bio: "Nightasaur 新玩家"
      }
    });

    // 創建默認語言設定
    await prisma.languagePreference.create({
      data: {
        userId: user.id,
        primaryLang: "zh-TW",
        displayMode: "SINGLE",
        fontSize: 16,
        theme: "LIGHT",
        autoDetect: true,
        showEnglishHint: true
      }
    });

    // 創建默認用戶設定
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        musicVolume: 70,
        soundVolume: 80,
        musicEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        vibrationStrength: 50,
        notificationsEnabled: true,
        pushNotifications: true,
        autoSaveEnabled: true,
        showTutorials: true,
        graphicsQuality: "MEDIUM",
        shadowsEnabled: true,
        touchSensitivity: 50,
        autoAimEnabled: true
      }
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "註冊成功",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        trainerLevel: user.trainerLevel,
        gems: user.gems,
        coins: user.coins
      },
      token
    });

  } catch (error) {
    console.error("註冊錯誤:", error);
    res.status(500).json({
      success: false,
      message: "註冊失敗，請稍後再試"
    });
  }
});

// 用戶登入
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "請提供電子郵件和密碼"
      });
    }

    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        LanguagePreference: true,
        UserSettings: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "電子郵件或密碼錯誤"
      });
    }

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "電子郵件或密碼錯誤"
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
// ==================== 其他API ====================

// 健康檢查
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend v2.0",
    version: "2.0.0",
    features: ["註冊/登入系統", "多語言設定", "音效/震動設定", "遊戲設定管理"]
  });
});

// 語言列表
app.get("/api/language/languages", (_req, res) => {
  res.json({
    success: true,
    languages: [
      { code: "zh-TW", name: "繁體中文", isPrimary: true },
      { code: "zh-CN", name: "簡體中文", isPrimary: false },
      { code: "en-US", name: "English", isPrimary: false },
      { code: "ja-JP", name: "日本語", isPrimary: false },
      { code: "ko-KR", name: "한국어", isPrimary: false }
    ]
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`
===========================================
🦖 Nightasaur 完整後台系統 v2.0 🦖
===========================================
服務器: http://localhost:${PORT}
功能:
  ✅ 用戶註冊/登入系統
  ✅ JWT身份驗證
  ✅ 多語言設定管理
  ✅ 音效/震動設定
  ✅ 遊戲設定管理
  ✅ 圖形/控制設定
===========================================
  `);

  try {
    // 測試數據庫連接
    await prisma.$connect();
    console.log("✅ 數據庫連接成功");
    
    // 創建默認管理員帳號（如果不存在）
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@nightasaur.com" }
    });
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          email: "admin@nightasaur.com",
          username: "admin",
          passwordHash,
          avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff",
          bio: "系統管理員",
          role: "ADMIN",
          trainerLevel: 100,
          gems: 9999,
          coins: 9999
        }
      });
      console.log("✅ 創建默認管理員帳號: admin@nightasaur.com / admin123");
    }
    
  } catch (error) {
    console.error("❌ 數據庫連接失敗:", error.message);
  }
});
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "登入成功",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        trainerLevel: user.trainerLevel,
        gems: user.gems,
        coins: user.coins
      },
      token
    });

  } catch (error) {
    console.error("登入錯誤:", error);
    res.status(500).json({
      success: false,
      message: "登入失敗，請稍後再試"
    });
  }
});

// 取得用戶資料
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        trainerLevel: user.trainerLevel,
        trainerXp: user.trainerXp,
        gems: user.gems,
        coins: user.coins,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      languagePreference: user.LanguagePreference,
      userSettings: user.UserSettings
    });

  } catch (error) {
    console.error("取得資料錯誤:", error);
    res.status(500).json({
      success: false,
      message: "取得資料失敗"
    });
  }
});
            <pre>curl -X PUT http://localhost:3000/api/settings/language \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"primaryLang":"zh-TW","fontSize":18,"theme":"DARK"}'</pre>
            
            <h3>5. 更新音效設定</h3>
            <pre>curl -X PUT http://localhost:3000/api/settings/audio \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"musicVolume":80,"soundVolume":90,"musicEnabled":true}'</pre>
        </div>
        
        <div class="card">
            <h2>🔧 默認帳號</h2>
            <p>系統自動創建的管理員帳號:</p>
            <ul>
                <li><strong>電子郵件:</strong> admin@nightasaur.com</li>
                <li><strong>密碼:</strong> admin123</li>
                <li><strong>權限:</strong> ADMIN</li>
            </ul>
            <p>您可以使用此帳號進行測試。</p>
        </div>
    </div>
</body>
</html>
  `);
});