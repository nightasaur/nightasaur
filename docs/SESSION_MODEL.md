# 工作階段撤銷模型（實作前規格）

定義：T 為 JWT（登入權杖），H(T) 為 SHA-256，U 為權杖使用者，t 為伺服器時間。

接受條件 A(T,t) = 簽章與 issuer/audience 有效 AND JWT 未到期 AND 存在 sessions 記錄，其 token=H(T)、userId=U、expiresAt>t AND U 目前啟用。

狀態：ABSENT → ACTIVE → REVOKED 或 EXPIRED。登入必須先持久化 ACTIVE 記錄才回傳權杖；登出刪除該權杖雜湊的記錄。每次簽發帶獨立隨機 jti，避免同秒登入得到相同權杖。資料庫只儲存雜湊，不儲存可重播的權杖原文。

不變量：撤銷後開始認證的請求不得通過；同帳號另一工作階段不受影響；到期、帳號停用或 session 查詢失敗皆不得取得登入身分。選擇性認證在驗證失敗時僅作匿名處理。角色仍以即時帳號資料為準。

限制：已完成認證並在執行中的請求不會倒退取消。現有未登錄 sessions 的舊 JWT 將失效，需要重新登入；不改帳號密碼。現有 Session schema 可儲存雜湊，毋須新增欄位；本次不執行正式 DB 操作。過期記錄清理及登入限速另行處理。

驗收：隔離 SQLite 驗證兩次簽發不同、無原文儲存、登出冪等、另一工作階段仍有效、到期/停用/未登錄拒絕；HTTP middleware 驗證登出後 protected route 回覆 401，optional auth 為匿名。
