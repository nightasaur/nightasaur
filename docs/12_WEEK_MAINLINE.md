# Nightasaur 12 週主線（整合基準）

> 基準日期：2026-09-18
> 主線原則：IELTS 真實學習閉環 × Nightasaur3070 Agent Runtime（執行環境）。
> 可以在 Draft PR（草稿合併請求）中堆疊施工，但只能依 Gate（驗收閘門）順序
> 合併；未驗證階段不得進 Production（正式環境）或操作正式資料庫。

## 已整合的起點

- LAUNCH-1A：IELTS Learning Hub 與 RWD 已完成並合併（PR #12、#13）。
- LAUNCH-1B 前端：Assessment 入口、Deployment Baseline（部署基準）與五語公開頁
  已合併（PR #14、#15、#16）。
- W2：Nightasaur3070 v0.4 唯讀 Runtime Gate A 已在 Windows 11、RTX 3070
  Laptop、Ollama `qwen2.5:3b` 驗證並合併（PR #17）。
- W3：IELTS Reading Diagnostic 與 Runtime grounding（結果忠實性）已完成；
  GitHub CI、Vercel、隔離 Railway Backend Preview、隔離 SQLite 與 HTTP E2E
  已驗證（PR #18，Draft）。
- W4：`workspace_patch` 限制式文字檔修改、安全測試與稽核軌跡已在隔離環境
  驗證（PR #19，Draft）。

## 12 週交付與目前狀態

| 週次 | 主線交付 | Gate（驗收條件） | 2026-09-18 狀態 |
|---|---|---|---|
| W1 | LAUNCH-1B Closure（上線基準封口） | 前後端 Build、CI、Vercel、Production API/DB/AI 行為一致 | `PARTIAL`：前端與 CI 已合併；Production Backend/AI 完整封口仍欠證據 |
| W2 | Local Runtime Gate A（本機執行環境） | RTX 3070 + Ollama + 唯讀 Tool Loop 不改工作區 | `VERIFIED / MERGED`：PR #17 |
| W3 | Runtime Closure + IELTS Diagnostic | grounding 修正、真實作答、隔離 Backend/DB、HTTP E2E、同候選本機複驗 | `PARTIAL`：PR #18；僅剩目前候選的 Windows/Ollama grounding 複驗 |
| W4 | v0.5 Bounded Edit（限制式修改） | allowlist/denylist、dry-run、hash、防穿越、原子替換 | `VERIFIED / UNMERGED`：PR #19 |
| W5 | Coding Tool Loop（程式工具循環） | inspect → preview → path/before/after hash exact-approved apply；其他 mutation fail-closed | `ACTIVE`：v0.6 候選施工中 |
| W6 | IELTS Learning Loop（學習循環） | 診斷 → 每日任務 → 練習 → 回饋 → Learning Profile 證據 | `PENDING` |
| W7 | Git Safety I（Git 安全一） | 唯讀 status/diff；範圍與敏感資料防護 | `PENDING` |
| W8 | Git Safety II（Git 安全二） | 受限 branch/commit；禁止 force/delete/main 直寫 | `PENDING` |
| W9 | Git Closure（Git 閉環） | PR 流程、CI 證據、rollback（回復）契約 | `PENDING` |
| W10 | Deployment Gate（部署閘門） | Preview 一致性、migration 先行檢查、Production 人工核准 | `PENDING` |
| W11 | Control Center（控制中心） | Runtime/任務/成本/失敗原因/核准狀態可視化 | `PENDING` |
| W12 | v1.0 Closure（閉環驗收） | IELTS 與 Coding 兩條端到端流程、文件、回復演練、發布決策 | `PENDING` |

## 合併與部署順序

1. PR #18 完成目前候選的 Windows/Ollama grounding 複驗後，才可提出合併核准。
2. PR #19 必須保持堆疊在 PR #18；上游未合併前不得改以 main 為基準合併。
3. W5 只建立新 Draft PR 並做隔離測試，不合併 main、不部署 Production。
4. W1 Production Backend/AI 的歷史缺口必須在 W10 Deployment Gate 前封口，
   不能用 Preview 成功取代 Production 證據。

## W5 本輪施工邊界

- 新增 opt-in coding Runtime，不變更正式預設 Runtime。
- `workspace_patch` 預設只預覽；實際套用必須同時符合核准路徑、來源 SHA-256
  與替換內容 SHA-256。
- 不新增 shell、Git、檔案建立/刪除、資料庫或部署工具。
- 僅在 temporary workspace（暫存工作區）驗證寫入，不操作正式資料。
