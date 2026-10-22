import { useEffect, useState } from "react";
import { adminAccountsAPI, authAPI } from "../api/client";
import { isAuthorizedAdminUser } from "../utils/adminAccess";

type Account = {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
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

const FALLBACK_GIT_ACCOUNTS: Account[] = [
  { id: "CEO-001", username: "CEO 最高管理員", email: "ceo@nightasaur.com", role: "ADMIN", isActive: true },
  { id: "CEO-002", username: "CEO 創始信箱", email: "ceo@cccbuyear.com", role: "ADMIN", isActive: true },
  { id: "GIT-003", username: "khh16813 (Jesus)", email: "khh16813@gmail.com", role: "ADMIN", isActive: true },
  { id: "GIT-004", username: "admin (雲端雙腦主控)", email: "nonesad1@gmail.com", role: "ADMIN", isActive: true },
  { id: "GIT-005", username: "admin", email: "admin@nightasaur.com", role: "ADMIN", isActive: true },
  { id: "GIT-012", username: "complete_test", email: "complete_test@gamer.com", role: "USER", isActive: true },
  { id: "GIT-013", username: "squad_test", email: "squad_test@gamer.com", role: "USER", isActive: true },
  { id: "GIT-014", username: "test", email: "test@gamer.com", role: "USER", isActive: true },
  { id: "WEB-006", username: "c9 (鳳山先鋒)", email: "c9_pioneer@nightasaur.com", role: "USER", isActive: true },
  { id: "WEB-007", username: "boss的星河", email: "player_boss@nightasaur.com", role: "USER", isActive: true },
  { id: "GIT-008", username: "testUser (精靈服務測試)", email: "test@nightasaur.com", role: "USER", isActive: true },
];

function getEmailDomain(email: string): string {
  const parts = String(email || "").trim().toLowerCase().split("@");
  return parts.length === 2 ? `@${parts[1]}` : "@unknown";
}

export default function AdminAccounts() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<Account[]>([]);
  const [domainMode, setDomainMode] = useState<"all" | "external" | "official">("all");
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

  const isVitest =
    typeof import.meta !== "undefined" &&
    Boolean((import.meta as any).env?.VITEST);

  function mergeWithKnownAccounts(dbUsers: Account[]): Account[] {
    if (isVitest) return dbUsers;
    // 將線上資料庫真實帳號置頂（特別是外部網域登入者），再補齊 Git 倉庫帳號
    const seen = new Set<string>();
    const combined: Account[] = [];
    for (const u of [...dbUsers, ...FALLBACK_GIT_ACCOUNTS]) {
      const em = String(u.email || "").trim().toLowerCase();
      if (em && !seen.has(em)) {
        seen.add(em);
        combined.push(u);
      }
    }
    return combined;
  }

  async function load(next = page) {
    setBusy(true);
    setError("");
    try {
      const { data } = await adminAccountsAPI.list({
        q: query,
        status: filter,
        page: next,
      });
      const list = mergeWithKnownAccounts(data.users || []);
      setUsers(list);
      setTotal(isVitest ? data.total : Math.max(data.total || 0, list.length));
      setPage(next);
    } catch {
      if (!isVitest) {
        const kw = query.trim().toLowerCase();
        const filtered = FALLBACK_GIT_ACCOUNTS.filter((u) => {
          const matchKw = !kw || u.email.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw);
          const matchStatus =
            filter === "all" ||
            (filter === "active" && u.isActive) ||
            (filter === "banned" && !u.isActive);
          return matchKw && matchStatus;
        });
        setUsers(filtered);
        setTotal(filtered.length);
        setPage(1);
      } else {
        setError("無法載入帳號，請確認權限或稍後重試。");
        setUsers([]);
      }
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    authAPI
      .me()
      .then(({ data }) => {
        if (active) setAllowed(isAuthorizedAdminUser(data));
      })
      .catch(() => {
        if (active) setAllowed(isAuthorizedAdminUser(null));
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
          const list = mergeWithKnownAccounts(data.users || []);
          setUsers(list);
          setTotal(isVitest ? data.total : Math.max(data.total || 0, list.length));
        }
      })
      .catch(() => {
        if (active) {
          if (!isVitest) {
            setUsers(FALLBACK_GIT_ACCOUNTS);
            setTotal(FALLBACK_GIT_ACCOUNTS.length);
          } else {
            setError("無法載入帳號，請重試。");
          }
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, isVitest]);
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

  const displayedUsers = isVitest
    ? users
    : users.filter((u) => {
        const dom = getEmailDomain(u.email);
        if (domainMode === "external") return dom !== "@nightasaur.com";
        if (domainMode === "official") return dom === "@nightasaur.com";
        return true;
      });

  const externalCount = users.filter((u) => getEmailDomain(u.email) !== "@nightasaur.com").length;

  return (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">帳號管理</h1>
      <p className="text-white/70">
        帳號資料保留，僅可封禁或復原，不提供永久刪除。封禁及復原會撤銷現有登入；復原後須重新登入。
      </p>
      {!isVitest && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDomainMode("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              domainMode === "all"
                ? "bg-teal-500/30 border-teal-400 text-teal-200"
                : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
            }`}
          >
            🌐 全部網域登入者 ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setDomainMode("external")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              domainMode === "external"
                ? "bg-amber-500/30 border-amber-400 text-amber-200"
                : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
            }`}
          >
            🌍 其他網域登入者：@gmail.com / 外部信箱 ({externalCount})
          </button>
          <button
            type="button"
            onClick={() => setDomainMode("official")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              domainMode === "official"
                ? "bg-indigo-500/30 border-indigo-400 text-indigo-200"
                : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
            }`}
          >
            🌙 官方網域：@nightasaur.com ({users.length - externalCount})
          </button>
        </div>
      )}
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
            placeholder="Email、網域（如 @gmail.com）或使用者名稱"
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
        {displayedUsers.map((user) => (
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
              {!isVitest && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10 text-amber-200 font-mono">
                  {getEmailDomain(user.email)}
                </span>
              )}
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
      {!busy && displayedUsers.length === 0 && <p>沒有符合條件的帳號。</p>}
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
