# 語言設定系統 - 完整使用指南

## 🎯 系統概述

本系統為遊戲提供完整的語言設定功能，讓玩家可以：
- 選擇中文、英文及雙語顯示模式
- 自動偵測系統語言
- 切換淺色/深色主題
- 調整字體大小
- 開啟學習輔助功能（拼音、羅馬拼音、英文提示）

## 🌍 支援語言

### 主要語言
1. **繁體中文** 🇹🇼 `zh-TW`
2. **簡體中文** 🇨🇳 `zh-CN`
3. **英文（美國）** 🇺🇸 `en-US`
4. **日文** 🇯🇵 `ja-JP`
5. **韓文** 🇰🇷 `ko-KR`

### 顯示模式
1. **單一語言** - 只顯示主要語言
2. **雙語顯示** - 同時顯示兩種語言（主要+次要）
3. **自動切換** - 根據上下文自動切換語言

### 主題
1. **淺色主題** - 明亮界面，適合白天使用
2. **深色主題** - 暗色界面，適合夜晚使用
3. **自動主題** - 跟隨系統設定

## 📡 API 端點

### 語言設定相關
```http
GET /api/language/preference
```
獲取當前用戶的語言偏好設定。

```http
PUT /api/language/preference
```
更新語言偏好設定。

**請求體範例：**
```json
{
  "primaryLang": "zh-TW",
  "secondaryLang": "en-US",
  "displayMode": "BILINGUAL",
  "theme": "DARK",
  "fontSize": 18,
  "autoDetect": true,
  "showRomanization": false,
  "showPinyin": true,
  "showEnglishHint": true
}
```

### 設定菜單
```http
GET /api/language/settings-menu
```
獲取完整的設定菜單結構，包括所有可選項和當前選擇。

### 語言選項
```http
GET /api/language/languages
```
獲取支援的語言列表。

```http
GET /api/language/display-modes
```
獲取顯示模式列表。

```http
GET /api/language/themes
```
獲取主題列表。

### 翻譯相關
```http
GET /api/language/translation/:module/:key?language=zh-TW
```
獲取單一翻譯。

```http
POST /api/language/translations/:module/batch
```
批量獲取翻譯。

**請求體範例：**
```json
{
  "keys": ["app_name", "loading", "save", "cancel"],
  "language": "zh-TW"
}
```

```http
GET /api/language/interface-translations?language=zh-TW
```
獲取完整的遊戲界面翻譯。

### 其他功能
```http
POST /api/language/auto-detect
```
自動偵測語言（根據瀏覽器設定）。

```http
GET /api/language/history?limit=20
```
獲取用戶語言變更歷史。

```http
POST /api/language/reset
```
重置語言設定為預設值。