// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Navbar({ user, setUser }: NavbarProps) {
  const navigate = useNavigate();
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
            🎓 IELTS Immersion
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
              <Link to="/login" className="text-white/70 hover:text-white transition">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">Register</Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="lg:hidden shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xl text-white"
          aria-label={mobileOpen ? "關閉選單" : "開啟選單"}
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
              🎓 IELTS Immersion
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
                <Link to="/login" onClick={closeMobile} className="px-4 py-3 rounded-xl border border-white/10 text-center text-white/80">Login</Link>
                <Link to="/register" onClick={closeMobile} className="btn-primary px-4 py-3 text-center">Register</Link>
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
