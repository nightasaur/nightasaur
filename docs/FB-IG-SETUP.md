# 🔌 Nightasaur FB/IG API 設定完整指南

## 概述

Nightasaur 需要透過 Facebook Graph API 來自動發布貼文到：
- 📘 Facebook 粉絲專頁
- 📸 Instagram 商業帳號（透過 FB Page 連結）

---

## 📋 前置需求

| 需求 | 說明 |
|------|------|
| Facebook 個人帳號 | 你的 FB 帳號 |
| Facebook 粉絲專頁 | Nightasaur 的粉專 |
| Instagram 商業帳號 | 需轉為專業帳號並連結粉專 |
| Meta 開發者帳號 | [developers.facebook.com](https://developers.facebook.com) |

---

## 🪜 步驟 1：建立 Facebook App

1. 前往 https://developers.facebook.com
2. 點「我的應用程式」→「建立應用程式」
3. 選擇「其他」→「消費者」
4. 輸入名稱：`Nightasaur`，建立

---

## 🪜 步驟 2：取得 Page Access Token（最關鍵！）

### 方法 A：Graph API Explorer（快速，適合開發）

1. 前往 https://developers.facebook.com/tools/explorer
2. 右上角選擇你的 Nightasaur App
3. 點「Get Token」→「Get User Access Token」
4. 勾選權限：
   ```
   pages_show_list
   pages_read_engagement
   pages_manage_posts
   instagram_basic
   instagram_content_publish
   ```
5. 取得 User Token 後，傳送 `GET /me/accounts`
6. 從回傳中找到你的粉專，複製 `access_token` → 這就是 Page Access Token！
7. 同時記下粉專的 `id` → 這就是 PAGE_ID

### 方法 B：長期 Token（生產環境用）

```bash
# 先取得短期 User Token（透過 FB Login 或 Explorer）
# 交換為長期 User Token
curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_USER_TOKEN}"

# 用長期 User Token 取得 Page Token（永久有效）
curl -X GET "https://graph.facebook.com/v19.0/{PAGE_ID}?fields=access_token&access_token={LONG_USER_TOKEN}"
```

---

## 🪜 步驟 3：連結 Instagram 商業帳號

1. FB 粉專 → 設定 → Instagram
2. 連結你的 IG 帳號（需先轉為專業帳號）
3. 在 Graph API Explorer 執行：
   ```
   GET /{PAGE_ID}?fields=instagram_business_account
   ```
4. 回傳的 `instagram_business_account.id` 就是 `INSTAGRAM_BUSINESS_ACCOUNT_ID`

---

## 🪜 步驟 4：設定 .env

在 `c:\Nightasaur\apps\backend\.env` 設定：

```env
FACEBOOK_PAGE_ID=你的粉專ID
FACEBOOK_PAGE_ACCESS_TOKEN=你的PageToken
INSTAGRAM_BUSINESS_ACCOUNT_ID=你的IG商業帳號ID
```

---

## 🧪 步驟 5：測試連線

### 用 API 測試：
```powershell
# 測試 FB
Invoke-RestMethod http://localhost:3000/api/social/posts/test/fb `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}

# 測試 IG
Invoke-RestMethod http://localhost:3000/api/social/posts/test/ig `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

### 用 Web 後台：
1. 登入 `http://localhost:5173`
2. 前往 `/settings/api`
3. 點「測試連線」

---

## 📝 發布貼文 API

```powershell
# 發布到 FB
$body = @{
  content = "🌙 暗影丸今晚在夜光谷發現了新的秘境！#Nightasaur"
  platform = "FACEBOOK"
  imageUrl = "https://你的圖片網址.jpg"
} | ConvertTo-Json

Invoke-RestMethod http://localhost:3000/api/social/posts `
  -Method Post -Body $body -ContentType 'application/json' `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}

# 發布到 IG
$body.platform = "INSTAGRAM"
Invoke-RestMethod http://localhost:3000/api/social/posts `
  -Method Post -Body $body -ContentType 'application/json' `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

---

## 🔐 權限審核注意事項

上線前需要在 FB App 設定中：
1. 填入隱私政策網址（`https://你的網域/privacy`）
2. 上傳 App 圖示
3. 選擇「發佈」模式（從開發模式切換）
4. 提交 `pages_manage_posts` 和 `instagram_content_publish` 權限審核

---

## 🚇 ngrok 開發測試（不需部署就能測）

```powershell
# 安裝 ngrok (choco install ngrok 或從 ngrok.com 下載)
ngrok http 3000

# 會得到類似 https://abc123.ngrok.io 的公開網址
# 把這個網址填入 FB App 的 OAuth 重新導向 URI
```

---

## 📊 權限對照表

| 權限 | 用途 | 審核難度 |
|------|------|---------|
| `pages_show_list` | 列出粉專 | 🟢 不需審核 |
| `pages_read_engagement` | 讀取貼文數據 | 🟢 不需審核 |
| `pages_manage_posts` | 發布貼文 | 🟡 需審核 |
| `instagram_basic` | 讀取 IG 資料 | 🟢 不需審核 |
| `instagram_content_publish` | 發布 IG 貼文 | 🟡 需審核 |
| `instagram_manage_comments` | 管理留言 | 🟡 需審核 |