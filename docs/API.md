# 📡 Nightasaur API 完整文檔

> 版本：1.0.0 | 更新日期：2026-09-07

## 基礎資訊

| 項目 | 值 |
|------|-----|
| Base URL (後端) | `http://localhost:3002/api` |
| Base URL (AI Engine) | `http://localhost:8000/api` |
| 格式 | JSON |
| 認證 | JWT Bearer Token |
| 生產環境 | `https://nightasaur-api.up.railway.app/api` |

### 認證方式

所有需要登入的端點需在 Header 帶入：
```
Authorization: Bearer <token>
```
Token 取得方式：呼叫 `POST /auth/login`。

---

## 一、認證模組 (Auth)

### `POST /auth/register`
註冊新帳戶，成功後自動生成初始精靈。

**Request:**
```json
{
  "email": "demo@nightasaur.com",
  "username": "訓練家小明",
  "password": "demo1234"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "clx...", "email": "demo@nightasaur.com", "username": "訓練家小明" },
  "spirit": { "id": "clx...", "name": "小火龍", "element": "FIRE", "stage": "EGG", "level": 1 }
}
```

### `POST /auth/login`
登入取得 JWT Token。

**Request:**
```json
{ "email": "demo@nightasaur.com", "password": "demo1234" }
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "clx...", "email": "demo@nightasaur.com", "username": "訓練家小明" }
}
```

### `GET /auth/me`
取得當前登入使用者資訊。**需要 Token。**

### `POST /auth/logout`
登出（清除伺服器端 session）。

---

## 二、精靈模組 (Spirits)

### `POST /spirits`
創建新精靈。**需要 Token。**

```json
{
  "name": "烈焰龍", "element": "FIRE",
  "personality": "勇敢活潑", "appearance": "紅色鱗片，金色角"
}
```

**屬性 (Element) 可選值：**
| 值 | 屬性 | 圖示 |
|----|------|------|
| FIRE | 火焰 | 🔥 |
| WATER | 水流 | 💧 |
| LIGHT | 光 | ✨ |
| SHADOW | 暗影 | 🌑 |
| STAR | 星辰 | ⭐ |
| ILLUSION | 幻象 | 🦊 |
| MOON | 月光 | 🌙 |
| NATURE | 自然 | 🌿 |
| THUNDER | 雷電 | ⚡ |
| ICE | 冰霜 | ❄️ |

### `GET /spirits`
取得使用者所有精靈列表。**需要 Token。**

### `GET /spirits/:id`
取得單一精靈詳細資訊。**需要 Token。**

### `POST /spirits/:id/evolve`
進化精靈到下一階段。**需要 Token。**

### `PATCH /spirits/:id/rename`
重新命名精靈。**需要 Token。**

### `PATCH /spirits/:id/customization`
自訂精靈外觀。**需要 Token。**

```json
{
  "customization": { "outfit": "🔥火焰披風", "accessory": "💍勇氣戒指" }
}
```

**進化階段：**
| 階段 | 等級需求 |
|------|---------|
| 🥚 蛋 | Lv.1 |
| 🐣 幼体 | Lv.5 |
| 🦎 少年体 | Lv.15 |
| 🐉 成年体 | Lv.30 |
| 🦖 究极体 | Lv.60 |
| 👑 传说体 | Lv.100 |
---

## 三、AI 對話模組 (Dialogue)

### `POST /api/dialogue/chat`
與精靈對話（由前端代理到 AI Engine）。**需要 Token。**

```json
{
  "spiritId": "clx...",
  "message": "今天過得怎麼樣？"
}
```

**Response:**
```json
{
  "response": "🔥 今天在火山口發現了發光的石頭！感覺蘊含著強大的力量呢～"
}
```

### `POST /api/dialogue/story`
生成精靈背景故事。**需要 Token。**

```json
{ "prompt": "一隻在月光下誕生的幻象屬性精靈" }
```

---

## 四、AI 助手模組 (Assistant)

### `POST /api/assistant/chat`
通用 AI 問答。**需要 Token。**

```json
{
  "message": "什麼是機器學習？",
  "history": []
}
```

**Response:** `{ "response": "機器學習是人工智慧的一個分支..." }`

### `POST /api/assistant/code`
程式碼協助。**需要 Token。**

```json
{
  "code": "def hello(): print('hello')",
  "language": "python",
  "task": "explain"
}
```

**task 可選值：** `explain`(解釋)、`debug`(除錯)、`optimize`(優化)、`rewrite`(重寫)

**支援語言：** python, javascript, typescript, java, cpp, go, rust, html, css

### `POST /api/assistant/translate`
多語言翻譯。**需要 Token。**

```json
{
  "text": "Hello, how are you?",
  "source_lang": "auto",
  "target_lang": "zh-TW"
}
```

**支援語言：** `zh-TW`、`zh-CN`、`en-US`、`ja-JP`、`ko-KR`、`fr`、`de`、`es`

### `POST /api/assistant/document`
文件分析。**需要 Token。**

```json
{
  "content": "這是一篇關於人工智慧的文章...",
  "doc_type": "text",
  "task": "summarize"
}
```

**task 可選值：** `summarize`(摘要)、`analyze`(分析)、`extract`(提取)

---

## 五、AI 生成模組 (Generation)

### `POST /api/generate/image`
生成精靈圖片。**需要 Token。**

```json
{
  "name": "烈焰龍", "element": "FIRE", "stage": "ADULT",
  "personality": "勇敢", "prompt": "自訂提示詞(可選)", "seed": -1
}
```

### `GET /api/generate/status`
檢查 ComfyUI 連線狀態。

---

## 六、社群模組 (Social)

### `POST /api/social/posts`
創建社群貼文。**需要 Token。**

```json
{
  "title": "我的精靈進化了！",
  "content": "今天烈焰龍進化到成年體了！",
  "spiritId": "clx...",
  "imageUrl": "..."
}
```

### `POST /api/social/posts/:id/publish`
發布貼文到 Facebook/Instagram。**需要 Token。**

### `GET /api/social/posts`
取得使用者貼文列表。**需要 Token。**

### `GET /api/social/posts/admin/posts`
管理員取得所有貼文。**需要 Token + 管理員權限。**
---

## 七、語言模組 (Language)

### `GET /api/language/preference`
取得使用者語言偏好。**需要 Token。**

### `PATCH /api/language/preference`
更新語言偏好。**需要 Token。**

```json
{ "primaryLang": "zh-TW", "secondaryLang": "en-US" }
```

### `POST /api/language/auto-detect`
自動偵測使用者語言。**需要 Token。**

### `GET /api/language/translation/:module/:key`
取得特定翻譯。**需要 Token。**

### `POST /api/language/translations/:module/batch`
批量取得翻譯。**需要 Token。**

```json
{ "keys": ["welcome", "login"], "language": "zh-TW" }
```

### `GET /api/language/interface-translations`
取得所有介面翻譯。**需要 Token。**

### `GET /api/language/settings-menu`
取得語言設定選單。**需要 Token。**

---

## 八、健康檢查 (Health)

### `GET /api/health` (後端)
```json
{ "status": "ok", "service": "Nightasaur Backend", "version": "1.0.0" }
```

### `GET /api/health` (AI Engine)
```json
{
  "status": "ok",
  "service": "Nightasaur AI Engine",
  "version": "3.0.0",
  "ollama": { "status": "ok", "model": "qwen2.5:3b", "model_available": true },
  "comfyui": { "status": "ok" }
}
```

---

## 錯誤碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 創建成功 |
| 400 | 請求參數錯誤 |
| 401 | 未認證 (Token 缺失) |
| 403 | 無權限 |
| 404 | 資源不存在 |
| 409 | 衝突 (如 Email 已註冊) |
| 429 | 請求過於頻繁 |
| 500 | 伺服器內部錯誤 |

### 錯誤回應格式
```json
{ "error": "錯誤訊息", "code": "ERROR_CODE", "details": {} }
```

### 速率限制
| 類型 | 限制 |
|------|------|
| 未認證 | 60 次/分鐘 |
| 已認證 | 120 次/分鐘 |
| AI 生成 | 10 次/分鐘 |