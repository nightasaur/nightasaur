// Nightasaur 完整後台系統 - 簡化版本
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
// 用戶註冊
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "請提供電子郵件、用戶名和密碼"
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "電子郵件或用戶名已被使用"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff`,
        bio: "Nightasaur 新玩家"
      }
    });

    await prisma.languagePreference.create({
      data: {
        userId: user.id,
        primaryLang: "zh-TW",
        displayMode: "SINGLE",
        fontSize: 16,
        theme: "LIGHT",
        autoDetect: true
      }
    });

    await prisma.userSettings.create({
      data: {
        userId: user.id,
        musicVolume: 70,
        soundVolume: 80,
        musicEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        vibrationStrength: 50
      }
    });

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
        avatarUrl: user.avatarUrl
      },
      token
    });

  } catch (error) {
    console.error("註冊錯誤:", error);
    res.status(500).json({
      success: false,
      message: "註冊失敗"
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        LanguagePreference: true,
// 取得設定
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      settings: {
        language: user.LanguagePreference,
        audio: {
          musicVolume: user.UserSettings?.musicVolume || 70,
          soundVolume: user.UserSettings?.soundVolume || 80,
          musicEnabled: user.UserSettings?.musicEnabled || true,
          soundEnabled: user.UserSettings?.soundEnabled || true
        },
        vibration: {
          vibrationEnabled: user.UserSettings?.vibrationEnabled || true,
          vibrationStrength: user.UserSettings?.vibrationStrength || 50
        }
      }
    });

  } catch (error) {
    console.error("取得設定錯誤:", error);
    res.status(500).json({
      success: false,
      message: "取得設定失敗"
    });
  }
});

// 更新語言設定
app.put("/api/settings/language", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { primaryLang, fontSize, theme } = req.body;

    const validLanguages = ["zh-TW", "zh-CN", "en-US"];
    if (primaryLang && !validLanguages.includes(primaryLang)) {
      return res.status(400).json({
        success: false,
        message: "不支援的語言代碼"
      });
    }

    const languagePreference = await prisma.languagePreference.upsert({
      where: { userId: user.id },
      update: {
        primaryLang: primaryLang || undefined,
        fontSize: fontSize || undefined,
        theme: theme || undefined
      },
      create: {
        userId: user.id,
        primaryLang: primaryLang || "zh-TW",
        fontSize: fontSize || 16,
        theme: theme || "LIGHT"
      }
    });

    res.json({
      success: true,
      message: "語言設定已更新",
      languagePreference
    });

  } catch (error) {
    console.error("更新語言設定錯誤:", error);
    res.status(500).json({
      success: false,
      message: "更新語言設定失敗"
    });
  }
});

// 更新音效設定
app.put("/api/settings/audio", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { musicVolume, soundVolume, musicEnabled, soundEnabled } = req.body;

    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        musicVolume: musicVolume !== undefined ? musicVolume : undefined,
        soundVolume: soundVolume !== undefined ? soundVolume : undefined,
        musicEnabled: musicEnabled !== undefined ? musicEnabled : undefined,
        soundEnabled: soundEnabled !== undefined ? soundEnabled : undefined
      },
      create: {
        userId: user.id,
        musicVolume: musicVolume || 70,
        soundVolume: soundVolume || 80,
        musicEnabled: musicEnabled !== undefined ? musicEnabled : true,
        soundEnabled: soundEnabled !== undefined ? soundEnabled : true
      }
    });

    res.json({
      success: true,
      message: "音效設定已更新",
      audioSettings: {
        musicVolume: userSettings.musicVolume,
        soundVolume: userSettings.soundVolume,
        musicEnabled: userSettings.musicEnabled,
        soundEnabled: userSettings.soundEnabled
      }
    });

  } catch (error) {
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

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
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
===========================================
  `);
});
    console.error("更新音效設定錯誤:", error);
    res.status(500).json({
      success: false,
      message: "更新音效設定失敗"
    });
  }
});

// 更新震動設定
app.put("/api/settings/vibration", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { vibrationEnabled, vibrationStrength } = req.body;

    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        vibrationEnabled: vibrationEnabled !== undefined ? vibrationEnabled : undefined,
        vibrationStrength: vibrationStrength !== undefined ? vibrationStrength : undefined
      },
      create: {
        userId: user.id,
        vibrationEnabled: vibrationEnabled !== undefined ? vibrationEnabled : true,
        vibrationStrength: vibrationStrength || 50
      }
    });

    res.json({
      success: true,
      message: "震動設定已更新",
      vibrationSettings: {
        vibrationEnabled: userSettings.vibrationEnabled,
        vibrationStrength: userSettings.vibrationStrength
      }
    });

  } catch (error) {
    console.error("更新震動設定錯誤:", error);
    res.status(500).json({
      success: false,
      message: "更新震動設定失敗"
    });
  }
});
        UserSettings: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "電子郵件或密碼錯誤"
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "電子郵件或密碼錯誤"
      });
    }

    const token = jwt.sign(
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
        avatarUrl: user.avatarUrl
      },
      languagePreference: user.LanguagePreference,
      userSettings: user.UserSettings,
      token
    });

  } catch (error) {
    console.error("登入錯誤:", error);
    res.status(500).json({
      success: false,
      message: "登入失敗"
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
        gems: user.gems,
        coins: user.coins
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
            <p>✅ 服務器運行中 | 版本: 2.0.0 | 主要語言: 繁體中文</p>
            <p>📦 數據庫: Prisma + SQLite | 🔐 認證: JWT</p>
            <p>🎵 音效設定: 音樂/音效/震動 | 🌐 語言設定: 繁體/簡體/英文</p>
        </div>
        
        <div class="card">
            <h2>🔧 默認帳號</h2>
            <p>系統自動創建的管理員帳號:</p>
            <ul>
                <li><strong>電子郵件:</strong> admin@nightasaur.com</li>
                <li><strong>密碼:</strong> admin123</li>
            </ul>
            <p>測試帳號:</p>
            <ul>
                <li><strong>電子郵件:</strong> test@nightasaur.com</li>
                <li><strong>密碼:</strong> test123</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `);
});