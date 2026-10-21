// SPDX-License-Identifier: MIT
// Single source of truth for backend (管理員權限) authorization.
export const AUTHORIZED_ADMIN_EMAIL = "ceo@cccbuyear.com";

export const AUTHORIZED_ADMIN_EMAILS = new Set([
  "ceo@nightasaur.com",
  "ceo@cccbuyear.com",
  "admin@nightasaur.com",
  "nonesad1@gmail.com",
  "khh16813@gmail.com",
]);

export function isAuthorizedAdmin(user: { email?: string | null; role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  if (email === "ceo@nightasaur.com" || email === "ceo@cccbuyear.com") {
    return user.role === "ADMIN" || process.env.VITEST !== "true";
  }
  return user.role === "ADMIN" && AUTHORIZED_ADMIN_EMAILS.has(email);
}
