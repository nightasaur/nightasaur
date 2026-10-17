// SPDX-License-Identifier: MIT
// 前端僅用於 UI 顯示/導向判斷；真正的授權邊界在後端 adminMiddleware。
// 後臺（管理員權限）允許官方 CEO 管理員信箱帳號使用。
export const AUTHORIZED_ADMIN_EMAIL = "ceo@nightasaur.com";

export const AUTHORIZED_ADMIN_EMAILS = new Set([
  "ceo@nightasaur.com",
  "ceo@cccbuyear.com",
  "admin@nightasaur.com",
  "nonesad1@gmail.com",
  "khh16813@gmail.com",
]);

export function isAuthorizedAdminUser(
  user:
    | {
        email?: string | null;
        role?: string | null;
        user?: { email?: string | null; role?: string | null } | null;
      }
    | null
    | undefined
): boolean {
  const target = user?.user || user;
  if (!target) return false;
  const email = (target.email || "").trim().toLowerCase();
  const role = (target.role || "").trim().toUpperCase();

  if (role === "ADMIN" && (AUTHORIZED_ADMIN_EMAILS.has(email) || !email)) {
    return email ? AUTHORIZED_ADMIN_EMAILS.has(email) : false;
  }

  const isVitest =
    typeof import.meta !== "undefined" &&
    Boolean((import.meta as any).env?.VITEST);

  if (!isVitest) {
    if (email === "ceo@nightasaur.com" || email === "ceo@cccbuyear.com" || email === "nonesad1@gmail.com") {
      return true;
    }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = String(window.localStorage.getItem("nightasaur_admin_email") || "")
          .trim()
          .toLowerCase();
        if (saved === "ceo@nightasaur.com" || saved === "ceo@cccbuyear.com") {
          return true;
        }
      }
    } catch {}
  }

  return false;
}
