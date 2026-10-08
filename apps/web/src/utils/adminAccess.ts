// SPDX-License-Identifier: MIT
// 前端僅用於 UI 顯示/導向判斷；真正的授權邊界在後端 adminMiddleware。
// 後臺（管理員權限）僅允許此信箱帳號使用。
export const AUTHORIZED_ADMIN_EMAIL = "ceo@cccbuyear.com";

export function isAuthorizedAdminUser(user: { email?: string | null; role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" && (user.email || "").toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
}
