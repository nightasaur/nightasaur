// 超簡單登入測試服務器
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur 登入測試",
    version: "1.0.0"
  });
});

// 登入API - 硬編碼測試
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`登入嘗試: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "請提供電子郵件和密碼" 
    });
  }

  // 檢查管理員帳號
  if (email === "admin@nightasaur.com" && password === "admin123") {
    console.log("✅ 管理員登入成功");
    return res.json({
      success: true,
      message: "登入成功",
      user: {
        id: "admin-001",
        email: "admin@nightasaur.com",
        username: "admin",
        role: "ADMIN"
      },
      token: "test-token-admin-123456"
    });
  }

  // 其他用戶
  console.log("❌ 登入失敗");
  res.status(401).json({ 
    success: false, 
    message: "電子郵件或密碼不正確" 
  });
});

// 註冊API
app.post("/api/auth/register", (req, res) => {
  const { email, username, password } = req.body;
  console.log(`註冊嘗試: ${email}, ${username}`);

  if (!email || !username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "請提供電子郵件、用戶名和密碼" 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: "密碼長度至少需要6個字符" 
    });
  }

  console.log("✅ 註冊成功");
  res.json({
    success: true,
    message: "註冊成功",
    user: {
      id: "user-" + Date.now(),
      email,
      username
    },
    token: "test-token-" + Date.now()
  });
});

// 簡單的登入頁面
app.get("/", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🦖 Nightasaur 登入測試</title>
  <style>
    body { font-family: Arial; margin: 20px; background: #f0f0f0; }
    .container { max-width: 400px; margin: 50px auto; background: white; padding: 20px; border-radius: 10px; }
    h1 { color: #667eea; text-align: center; }
    .form-group { margin: 15px 0; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
    button { width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
    .status { margin: 15px 0; padding: 10px; border-radius: 5px; }
    .success { background: #c6f6d5; color: #22543d; }
    .error { background: #fed7d7; color: #742a2a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🦖 Nightasaur 登入測試</h1>
    
    <div class="form-group">
      <label>電子郵件</label>
      <input type="email" id="email" value="admin@nightasaur.com">
    </div>
    
    <div class="form-group">
      <label>密碼</label>
      <input type="password" id="password" value="admin123">
    </div>
    
    <button onclick="login()">登入測試</button>
    
    <div id="status"></div>
    
    <p style="text-align:center; margin-top:20px;">
      <a href="#" onclick="testRegister()">測試註冊</a>
    </p>
  </div>
  
  <script>
    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if(!email || !password) {
        showStatus('請輸入電子郵件和密碼', false);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({email, password})
        });
        
        const data = await res.json();
        
        if(data.success) {
          showStatus('✅ 登入成功！歡迎 ' + data.user.username);
          console.log('用戶資訊:', data.user);
          console.log('令牌:', data.token);
        } else {
          showStatus('❌ ' + data.message, false);
        }
      } catch(error) {
        showStatus('❌ 連線錯誤: ' + error.message, false);
      }
    }
    
    async function testRegister() {
      const testEmail = 'test' + Date.now() + '@nightasaur.com';
      const testUsername = 'testuser' + Date.now();
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            email: testEmail,
            username: testUsername,
            password: 'test123'
          })
        });
        
        const data = await res.json();
        
        if(data.success) {
          showStatus('✅ 測試用戶註冊成功！');
          document.getElementById('email').value = testEmail;
          document.getElementById('password').value = 'test123';
        } else {
          showStatus('❌ ' + data.message, false);
        }
      } catch(error) {
        showStatus('❌ 連線錯誤', false);
      }
    }
    
    function showStatus(msg, isSuccess = true) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'status ' + (isSuccess ? 'success' : 'error');
    }
  </script>
</body>
</html>`);
});

// 啟動服務器
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`
===========================================
🦖 Nightasaur 登入測試服務器 🦖
===========================================
服務器: http://localhost:${PORT}
管理員帳號: admin@nightasaur.com / admin123
===========================================
  `);
});