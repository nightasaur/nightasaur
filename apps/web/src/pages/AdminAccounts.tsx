import { useEffect, useState } from "react";
import { adminAccountsAPI, authAPI } from "../api/client";

type Account = {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
};
type Audit = {
  id: string;
  actorId: string;
  action: string;
  reason: string;
  createdAt: string;
};
type Action = "BAN" | "RESTORE" | "REVOKE_SESSIONS";
const labels = {
  BAN: "封禁帳號",
  RESTORE: "復原帳號",
  REVOKE_SESSIONS: "登出所有裝置",
};
export default function AdminAccounts() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<{
    user: Account;
    action: Action;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<Audit[] | null>(null);
  const [historyName, setHistoryName] = useState("");
  async function load(next = page) {
    setBusy(true);
    setError("");
    try {
      const { data } = await adminAccountsAPI.list({
        q: query,
        status: filter,
        page: next,
      });
      setUsers(data.users);
      setTotal(data.total);
      setPage(next);
    } catch {
      setError("無法載入帳號，請確認權限或稍後重試。");
      setUsers([]);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    authAPI
      .me()
      .then(({ data }) => {
        if (active) setAllowed(data.role === "ADMIN");
      })
      .catch(() => {
        if (active) setAllowed(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setBusy(true);
    adminAccountsAPI
      .list({ q: "", status: "all", page: 1 })
      .then(({ data }) => {
        if (active) {
          setUsers(data.users);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (active) setError("無法載入帳號，請重試。");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [allowed]);
  async function confirm() {
    if (!selection) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminAccountsAPI.action(selection.user.id, {
        action: selection.action,
        reason,
      });
      setNotice(`${selection.user.username}：${labels[selection.action]}完成`);
      setSelection(null);
      setReason("");
      setHistory(null);
      await load();
    } catch {
      setError("操作未確認成功，請重新整理帳號狀態後再試。管理員帳號受保護。");
    } finally {
      setBusy(false);
    }
  }
  async function showHistory(user: Account) {
    setBusy(true);
    setError("");
    setHistory(null);
    try {
      const { data } = await adminAccountsAPI.history(user.id);
      setHistory(data);
      setHistoryName(user.username);
    } catch {
      setError("無法載入操作紀錄。");
    } finally {
      setBusy(false);
    }
  }
  if (allowed === null)
    return (
      <p role="status" className="p-6">
        確認管理員權限中…
      </p>
    );
  if (!allowed)
    return (
      <p role="alert" className="p-6">
        此頁僅限管理員使用。
      </p>
    );
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">帳號管理</h1>
      <p className="text-white/70">
        帳號資料保留，僅可封禁或復原，不提供永久刪除。封禁及復原會撤銷現有登入；復原後須重新登入。
      </p>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-300">
          {notice}
        </p>
      )}
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load(1);
        }}
      >
        <label>
          搜尋帳號
          <input
            className="block bg-slate-900 border rounded p-2"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email 或使用者名稱"
          />
        </label>
        <label>
          帳號狀態
          <select
            className="block bg-slate-900 border rounded p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="active">正常</option>
            <option value="banned">已封禁</option>
          </select>
        </label>
        <button disabled={busy} className="btn-primary self-end" type="submit">
          查詢
        </button>
      </form>
      <p role="status">
        共 {total} 個帳號 · 第 {page} 頁{busy ? " · 處理中…" : ""}
      </p>
      <div className="space-y-3">
        {users.map((user) => (
          <article
            key={user.id}
            className="glass-card p-4 space-y-3 break-words"
          >
            <h2 className="font-bold">
              {user.username}{" "}
              <span className="text-sm text-teal-300">
                {user.role === "ADMIN"
                  ? "管理員 · 受保護"
                  : user.isActive
                    ? "正常"
                    : "已封禁"}
              </span>
            </h2>
            <p className="break-all">{user.email}</p>
            <div className="flex flex-wrap gap-3">
              {user.role !== "ADMIN" && (
                <>
                  <button
                    disabled={busy}
                    className="btn-secondary"
                    onClick={() => {
                      setSelection({
                        user,
                        action: user.isActive ? "BAN" : "RESTORE",
                      });
                      setReason("");
                    }}
                  >
                    {user.isActive ? "封禁" : "復原"}
                  </button>
                  <button
                    disabled={busy}
                    className="btn-secondary"
                    onClick={() => {
                      setSelection({ user, action: "REVOKE_SESSIONS" });
                      setReason("");
                    }}
                  >
                    登出所有裝置
                  </button>
                </>
              )}
              <button
                disabled={busy}
                className="btn-secondary"
                onClick={() => void showHistory(user)}
              >
                操作紀錄
              </button>
            </div>
          </article>
        ))}
      </div>
      {!busy && users.length === 0 && <p>沒有符合條件的帳號。</p>}
      <div className="flex gap-4">
        <button
          disabled={busy || page <= 1}
          onClick={() => void load(page - 1)}
        >
          上一頁
        </button>
        <button
          disabled={busy || page * 20 >= total}
          onClick={() => void load(page + 1)}
        >
          下一頁
        </button>
      </div>
      {selection && (
        <section
          aria-label="確認帳號操作"
          className="glass-card border border-amber-400 p-4 space-y-3"
        >
          <h2 className="font-bold">
            確認{labels[selection.action]}：{selection.user.username}
          </h2>
          <p className="break-all">{selection.user.email}</p>
          <label className="block">
            操作原因（3–500 字）
            <textarea
              className="block w-full bg-slate-900 border rounded p-2"
              value={reason}
              minLength={3}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            disabled={busy || reason.trim().length < 3}
            className="btn-primary mr-3"
            onClick={() => void confirm()}
          >
            確認執行
          </button>
          <button disabled={busy} onClick={() => setSelection(null)}>
            取消
          </button>
        </section>
      )}
      {history && (
        <section className="glass-card p-4 space-y-3">
          <h2 className="font-bold">{historyName} · 最近 50 筆操作</h2>
          {history.length === 0 ? (
            <p>尚無紀錄</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="border-b border-white/10 py-2 break-words"
              >
                <p>
                  {labels[item.action as Action] || item.action} ·{" "}
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <p>{item.reason}</p>
                <p className="text-xs break-all">操作員 ID：{item.actorId}</p>
              </div>
            ))
          )}
        </section>
      )}
    </section>
  );
}
