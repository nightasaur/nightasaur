// SPDX-License-Identifier: MIT
// Single source of truth for backend (管理員權限) authorization.
// Only this exact email may hold administrator privileges, regardless of
// what the `role` column says — defends against a stray DB write or bug
// elevating any other account to ADMIN.
export const AUTHORIZED_ADMIN_EMAIL = "ceo@cccbuyear.com";

export function isAuthorizedAdmin(user: { email?: string | null; role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" && (user.email || "").toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
}
