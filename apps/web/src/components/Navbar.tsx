// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../contexts/LanguageContext";

interface NavbarProps {
  user: any;
  setUser: (user: any) => void;
}

const PUBLIC_NAV_COPY: Record<string, {
  ielts: string;
  login: string;
  register: string;
  openMenu: string;
  closeMenu: string;
}> = {
  "zh-TW": { ielts: "IELTS 深度沉浸", login: "登入", register: "註冊", openMenu: "開啟選單", closeMenu: "關閉選單" },
  "zh-CN": { ielts: "IELTS 深度沉浸", login: "登录", register: "注册", openMenu: "打开菜单", closeMenu: "关闭菜单" },
  "en-US": { ielts: "IELTS Immersion", login: "Login", register: "Register", openMenu: "Open menu", closeMenu: "Close menu" },
  "ja-JP": { ielts: "IELTS 深度イマージョン", login: "ログイン", register: "登録", openMenu: "メニューを開く", closeMenu: "メニューを閉じる" },
  "ko-KR": { ielts: "IELTS 심층 몰입", login: "로그인", register: "가입", openMenu: "메뉴 열기", closeMenu: "메뉴 닫기" },
};

export default function Navbar({ user, setUser }: NavbarProps) {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const publicCopy = PUBLIC_NAV_COPY[currentLanguage] ?? PUBLIC_NAV_COPY["zh-TW"];
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem("nightasaur_token");
    setUser(null);
    closeMobile();
    navigate("/");
  };

  const userLinks = (
    <>
      <Link to="/dashboard" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">Dashboard</Link>
      <Link to="/spirits" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">💞 Spirit</Link>
      <Link to="/assistant" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">🤖 Assistant</Link>
      <Link to="/academy" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">📚 Learning</Link>
      <Link to="/social" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">🌍 Social</Link>
      <Link to="/account" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">Account</Link>
      <Link to="/settings/language" onClick={closeMobile} className="text-white/70 hover:text-white transition text-sm">Language</Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" onClick={closeMobile} className="flex min-w-0 items-center gap-2 group">
          <span className="text-2xl shrink-0">🌙</span>
          <span className="truncate text-lg sm:text-xl font-black bg-gradient-to-r from-teal-300 to-cyan-200 bg-clip-text text-transparent">
            Nightasaur
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-4 min-w-0">
          <Link
            to="/products/ielts-immersion"
            className="text-yellow-300 hover:text-yellow-200 transition text-sm font-medium whitespace-nowrap"
          >
            🎓 {publicCopy.ielts}
          </Link>

          <div className="shrink-0">
            <LanguageSwitcher compact={true} />
          </div>

          {user ? (
            <>
              {userLinks}
              <button onClick={handleLogout} className="text-white/50 hover:text-white/80 transition text-sm">Logout</button>
              <span className="text-white/40">|</span>
              <span className="max-w-28 truncate text-white/60 text-sm" title={user.username}>{user.username}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white/70 hover:text-white transition">{publicCopy.login}</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">{publicCopy.register}</Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="lg:hidden shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xl text-white"
          aria-label={mobileOpen ? publicCopy.closeMenu : publicCopy.openMenu}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
            <Link
              to="/products/ielts-immersion"
              onClick={closeMobile}
              className="px-3 py-3 rounded-lg text-yellow-300 hover:bg-white/5 transition text-sm font-medium"
            >
              🎓 {publicCopy.ielts}
            </Link>

            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-white/40 truncate">登入：{user.username}</div>
                <div className="flex flex-col gap-1 [&_a]:px-3 [&_a]:py-3 [&_a]:rounded-lg [&_a]:hover:bg-white/5">
                  {userLinks}
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 px-3 py-3 rounded-lg text-left text-white/60 hover:text-white hover:bg-white/5 transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Link to="/login" onClick={closeMobile} className="px-4 py-3 rounded-xl border border-white/10 text-center text-white/80">{publicCopy.login}</Link>
                <Link to="/register" onClick={closeMobile} className="btn-primary px-4 py-3 text-center">{publicCopy.register}</Link>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/10">
              <LanguageSwitcher compact={true} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
