// Nightasaur 完整後台系統 - 包含忘記密碼功能
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "nightasaur-secret-key-2026";
const RESET_TOKEN_EXPIRY = 3600000; // 1小時

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

// 首頁
app.get("/", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>🦖 Nightasaur 後台</title></head>
<body>
<h1>🦖 Nightasaur 完整後台系統 v2.1</h1>
<p>服務器運行中 | 主要語言: 繁體中文</p>
<p>帳號: admin@nightasaur.com / admin123</p>
<p>支援服務: service@nightasaur.com</p>
<p><a href="/forgot-password">忘記密碼？</a></p>
</html>`);
});

// 用戶註冊
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: "請提供電子郵件、用戶名和密碼" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "電子郵件或用戶名已被使用" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, passwordHash, bio: "Nightasaur 新玩家" }
    });

    await prisma.languagePreference.create({
      data: { userId: user.id, primaryLang: "zh-TW", fontSize: 16, theme: "LIGHT" }
    });

    await prisma.userSettings.create({
      data: { 
        userId: user.id, 
        musicVolume: 70, soundVolume: 80, musicEnabled: true, soundEnabled: true,
        vibrationEnabled: true, vibrationStrength: 50 
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true, message: "註冊成功",
      user: { id: user.id, email: user.email, username: user.username },
      token
    });
  } catch (error) {
    console.error("註冊錯誤:", error);
    res.status(500).json({ success: false, message: "註冊失敗" });
  }
});

// 用戶登入
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "請提供電子郵件和密碼" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        LanguagePreference: true,
        UserSettings: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "電子郵件或密碼錯誤" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "電子郵件或密碼錯誤" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true, message: "登入成功",
      user: { id: user.id, email: user.email, username: user.username },
      token
    });
  } catch (error) {
    console.error("登入錯誤:", error);
    res.status(500).json({ success: false, message: "登入失敗" });
  }
});

// ==================== 忘記密碼功能 ====================

// 請求密碼重置
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "請提供電子郵件" });
    }

    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // 為了安全，即使找不到用戶也返回成功訊息
    if (!user) {
      return res.json({
        success: true,
        message: "如果該電子郵件存在，重置連結將發送到您的信箱",
        supportEmail: "service@nightasaur.com"
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    // 保存重置令牌
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false
      }
    });

    // 模擬發送郵件
    console.log(`📧 密碼重置連結已發送到: ${email}`);
    console.log(`🔗 重置連結: http://localhost:3002/reset-password?token=${resetToken}`);
    console.log(`📧 支援信箱: service@nightasaur.com`);

    res.json({
      success: true,
      message: "密碼重置連結已發送到您的電子郵件",
      supportEmail: "service@nightasaur.com",
      note: "在實際環境中，此連結將通過電子郵件發送",
      resetLink: `http://localhost:3002/reset-password?token=${resetToken}`
    });

  } catch (error) {
    console.error("忘記密碼錯誤:", error);
    res.status(500).json({ success: false, message: "請求失敗，請稍後再試" });
  }
});

// 驗證重置令牌
app.get("/api/auth/validate-reset-token", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: "缺少重置令牌" });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token as string },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(404).json({ success: false, message: "無效的重置連結" });
    }

    if (resetToken.used) {
      return res.status(400).json({ success: false, message: "此連結已被使用" });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "此連結已過期" });
    }

    res.json({
      success: true,
      message: "令牌有效",
      email: resetToken.user.email,
      expiresAt: resetToken.expiresAt
    });

  } catch (error) {
    console.error("驗證令牌錯誤:", error);
    res.status(500).json({ success: false, message: "驗證失敗" });
  }
});

// 重置密碼
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "請提供重置令牌和新密碼" 
      });
    }

    if (newPassword.length < 6) {
// ==================== 其他功能 ====================

// 取得用戶資料
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
      languagePreference: user.LanguagePreference,
      userSettings: user.UserSettings
    });
  } catch (error) {
    console.error("取得資料錯誤:", error);
    res.status(500).json({ success: false, message: "取得資料失敗" });
  }
});

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
    res.status(500).json({ success: false, message: "取得設定失敗" });
  }
});

// 更新語言設定
app.put("/api/settings/language", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { primaryLang, fontSize, theme } = req.body;
    const validLanguages = ["zh-TW", "zh-CN", "en-US"];
    if (primaryLang && !validLanguages.includes(primaryLang)) {
      return res.status(400).json({ success: false, message: "不支援的語言代碼" });
    }

    const languagePreference = await prisma.languagePreference.upsert({
      where: { userId: user.id },
      update: { primaryLang, fontSize, theme },
      create: { userId: user.id, primaryLang: primaryLang || "zh-TW", fontSize: fontSize || 16, theme: theme || "LIGHT" }
    });

    res.json({ success: true, message: "語言設定已更新", languagePreference });
  } catch (error) {
    console.error("更新語言設定錯誤:", error);
    res.status(500).json({ success: false, message: "更新語言設定失敗" });
  }
});

// 更新音效設定
app.put("/api/settings/audio", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { musicVolume, soundVolume, musicEnabled, soundEnabled } = req.body;
    
    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { musicVolume, soundVolume, musicEnabled, soundEnabled },
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
    console.error("更新音效設定錯誤:", error);
    res.status(500).json({ success: false, message: "更新音效設定失敗" });
  }
});

// 更新震動設定
app.put("/api/settings/vibration", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { vibrationEnabled, vibrationStrength } = req.body;
    
    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { vibrationEnabled, vibrationStrength },
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
    res.status(500).json({ success: false, message: "更新震動設定失敗" });
  }
});
// 忘記密碼頁面
app.get("/forgot-password", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>忘記密碼</title></head>
<body>
<h1>🔐 忘記密碼</h1>
<p>請輸入您的電子郵件地址</p>
<p>支援信箱: <strong>service@nightasaur.com</strong></p>
<input type="email" id="email" placeholder="your@email.com"><br>
<button onclick="requestReset()">發送重置連結</button>
<div id="status"></div>
<script>
async function requestReset() {
const email = document.getElementById('email').value;
const res = await fetch('/api/auth/forgot-password', {
method: 'POST',
headers: {'Content-Type':'application/json'},
body: JSON.stringify({email})
});
const data = await res.json();
document.getElementById('status').innerHTML = data.message;
if(data.resetLink) {
console.log('重置連結:', data.resetLink);
}
}
</script>
</body>
</html>`);
});

// 重置密碼頁面
app.get("/reset-password", (req, res) => {
  const token = req.query.token || '';
  
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>重置密碼</title></head>
<body>
<h1>🔄 重置密碼</h1>
<p>支援信箱: <strong>service@nightasaur.com</strong></p>
<input type="hidden" id="token" value="${token}">
新密碼: <input type="password" id="newPassword"><br>
確認密碼: <input type="password" id="confirmPassword"><br>
<button onclick="resetPassword()">重置密碼</button>
<div id="status"></div>
<script>
async function resetPassword() {
const token = document.getElementById('token').value;
const newPassword = document.getElementById('newPassword').value;
const confirmPassword = document.getElementById('confirmPassword').value;

if(newPassword !== confirmPassword) {
document.getElementById('status').innerHTML = '密碼不一致';
return;
}

const res = await fetch('/api/auth/reset-password', {
method: 'POST',
headers: {'Content-Type':'application/json'},
body: JSON.stringify({token, newPassword})
});
const data = await res.json();
document.getElementById('status').innerHTML = data.message;
}
</script>
</body>
</html>`);
});

// 啟動服務器
const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`
===========================================
🦖 Nightasaur 完整後台系統 v2.1 🦖
===========================================
服務器: http://localhost:${PORT}
功能:
  ✅ 用戶註冊/登入系統
  ✅ 忘記密碼功能
  ✅ 密碼重置流程
  ✅ JWT身份驗證
  ✅ 多語言設定管理
  ✅ 音效/震動設定
支援信箱: service@nightasaur.com
===========================================
  `);

  try {
    await prisma.$connect();
    console.log("✅ 數據庫連接成功");
    
  } catch (error) {
    console.error("❌ 數據庫連接失敗:", error.message);
  }
});

// 健康檢查
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend v2.1",
    version: "2.1.0",
    features: ["註冊/登入系統", "忘記密碼功能", "多語言設定", "音效/震動設定"],
    supportEmail: "service@nightasaur.com"
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
      return res.status(400).json({ 
        success: false, 
        message: "密碼長度至少需要6個字符" 
      });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(404).json({ success: false, message: "無效的重置連結" });
    }

    if (resetToken.used) {
      return res.status(400).json({ success: false, message: "此連結已被使用" });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "此連結已過期" });
    }

    // 更新密碼
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });

    // 標記令牌為已使用
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    res.json({
      success: true,
      message: "密碼重置成功，請使用新密碼登入"
    });

  } catch (error) {
    console.error("重置密碼錯誤:", error);
    res.status(500).json({ success: false, message: "重置失敗，請稍後再試" });
  }
});
      token
    });
  } catch (error) {
    console.error("登入錯誤:", error);
    res.status(500).json({ success: false, message: "登入失敗" });
  }
});
</html>`);
});