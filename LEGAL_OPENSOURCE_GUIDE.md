# 📖 Nightasaur 合法開源使用指南

## 核心原則：MIT = 你可以自由使用，但要保留版權

Nightasaur 使用 **MIT License**，您**可以**自由參考、複製、修改其他 **MIT / Apache 2.0** 專案的程式碼，
**只要遵守以下規則**：

---

## ✅ 合法做法（可以安心做）

### 1. 直接使用其他 MIT 專案的程式碼
```bash
# 範例：從一個 MIT 專案複製一個元件到自己專案
# ✅ 合法！只要保留原始版權宣告即可

# 正確做法：
# 1. 在檔案開頭保留原始作者的版權宣告
# 2. 在 CREDITS.md 中記錄來源
```

### 2. 參考架構後自己重寫
```bash
# 閱讀其他專案的架構、設計模式
# 理解後用自己的方式實作
# ✅ 完全合法，不需要註明
```

### 3. 使用 npm / pip 套件
```bash
npm install express    # ✅ MIT，安心用
pip install fastapi   # ✅ MIT，安心用
# 套件管理器會自動處理授權
```

---

## ❌ 不合法做法（不要做）

| ❌ 不要做 | 為什麼 |
|----------|--------|
| 複製 GPL 專案的程式碼 | GPL 會讓 Nightasaur 也變成 GPL |
| 使用有版權的圖片/素材 | 侵犯著作權 |
| 移除 MIT 程式的版權宣告 | 違反 MIT 授權條款 |
| 直接複製別人的 API Key / 環境變數 | 安全問題 |

---

## 🎯 推薦可直接參考的 MIT 開源專案

以下是與 Nightasaur 功能相關、**MIT 授權**、可以直接安心參考的專案：

### 🤖 AI 相關

| 專案 | 授權 | 可以參考什麼 |
|------|------|-------------|
| [Ollama](https://github.com/ollama/ollama) | MIT ✅ | LLM 對話 API 設計 |
| [LangChain](https://github.com/langchain-ai/langchain) | MIT ✅ | AI 對話鏈模式 |
| [Transformer.js](https://github.com/xenova/transformers.js) | Apache 2.0 ✅ | 瀏覽器端 AI 推理 |

### 🌐 前端

| 專案 | 授權 | 可以參考什麼 |
|------|------|-------------|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | MIT ✅ | 元件庫設計 |
| [Cal.com](https://github.com/calcom/cal.com) | MIT ✅ | 全端 React 架構 |
| [Hoppscotch](https://github.com/hoppscotch/hoppscotch) | MIT ✅ | Vue/React API 客戶端 |

### 🔧 後端

| 專案 | 授權 | 可以參考什麼 |
|------|------|-------------|
| [Directus](https://github.com/directus/directus) | GPL ⚠️ | 架構參考（不要複製程式碼） |
| [Standard Notes](https://github.com/standardnotes/app) | AGPL ⚠️ | 加密筆記架構（參考用） |
| [NocoDB](https://github.com/nocodb/nocodb) | AGPL ⚠️ | 資料庫介面設計參考 |

### 🎨 完整專案（直接可學習的）

| 專案 | 授權 | 特點 |
|------|------|------|
| [Lobe Chat](https://github.com/lobehub/lobe-chat) | **MIT ✅** | 現代 AI 聊天介面，React 技術棧 |
| [ChatGPT Next](https://github.com/Yidadaa/ChatGPT-Next-Web) | **MIT ✅** | 跨平台 ChatGPT 客戶端 |
| [Dify](https://github.com/langgenius/dify) | **Apache 2.0 ✅** | AI 應用平台 |

---

## 📝 如何正確保留版權宣告

### 範例：從 Lobe Chat 複製一個元件

```typescript
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team
// Based on Lobe Chat (MIT) - https://github.com/lobehub/lobe-chat
// Copyright (c) 2023 LobeHub

// ... 您的程式碼
```

### 在 CREDITS.md 中記錄

已在 `CREDITS.md` 中記錄所有依賴的授權資訊 ✅

---

## 📊 快速判斷流程圖

```
看到一個想參考的程式碼
        │
        ▼
  它有 License 嗎？
   │        │
  有       沒有（假設有版權）
   │        │
   ▼        ▼
  是什麼授權？
   │
MIT / Apache 2.0 ──→ ✅ 可直接使用，保留版權宣告
   │
BSD ──────────────→ ✅ 可使用，保留版權宣告
   │
GPL / AGPL ───────→ ⚠️ 只能看架構，不能複製程式碼
   │
CC BY-NC ─────────→ ❌ 不能商用
   │
© All Rights Reserved ─ ❌ 不能使用
```

---

## 🚀 建議立即開始

推薦您現在可以瀏覽：

1. **Lobe Chat** → https://github.com/lobehub/lobe-chat
   - MIT ✅，React 技術棧
   - 參考他們的 AI 對話 UI 設計

2. **ChatGPT Next Web** → https://github.com/Yidadaa/ChatGPT-Next-Web
   - MIT ✅
   - 參考他們的提示詞系統

3. **shadcn/ui** → https://ui.shadcn.com
   - MIT ✅
   - 直接複製元件使用

---

**需要我幫您具體參考哪個專案、分析授權並整合到 Nightasaur 嗎？** 🚀