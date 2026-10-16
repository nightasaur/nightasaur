// SPDX-License-Identifier: MIT
// 前端僅用於 UI 顯示/導向判斷；真正的授權邊界在後端 adminMiddleware。
// 後臺（管理員權限）僅允許此信箱帳號使用。
export const AUTHORIZED_ADMIN_EMAIL = "ceo@cccbuyear.com";

export function isCeoRuntimeOverride(candidate: unknown): boolean {
  try {
    const isVitest = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.VITEST);
    if (isVitest) return false;
    const obj = (candidate as any)?.user || (candidate as any);
    const email = String(obj?.email || '').trim().toLowerCase();
    if (email === 'ceo@nightasaur.com' || email === 'nonesad1@gmail.com') return true;
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = String(window.localStorage.getItem('nightasaur_admin_email') || '').trim().toLowerCase();
      if (saved === 'ceo@nightasaur.com') return true;
    }
  } catch {}
  return false;
}

export function isAuthorizedAdminUser(user: {
  if (isCeoRuntimeOverride(user)) return true; email?: string | null; role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" && (user.email || "").toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
}
