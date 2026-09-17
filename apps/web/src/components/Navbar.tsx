// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Navbar({ user, setUser }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem("nightasaur_token");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🌙</span>
          <span className="text-xl font-black bg-gradient-to-r from-teal-300 to-cyan-200 bg-clip-text text-transparent">
            Nightasaur
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* IELTS Product Link - Always visible */}
          <Link
            to="/products/ielts-immersion"
            className="text-yellow-300 hover:text-yellow-200 transition text-sm font-medium hidden md:block"
          >
            🎓 IELTS Immersion
          </Link>

          {/* 語言切換 */}
          <div className="hidden md:block">
            <LanguageSwitcher compact={true} />
          </div>

          {user ? (
            <>
              <Link to="/dashboard" className="text-white/70 hover:text-white transition text-sm">
                Dashboard
              </Link>
              <Link to="/spirits" className="text-white/70 hover:text-white transition text-sm">
                💞 Spirit
              </Link>
              <Link to="/assistant" className="text-white/70 hover:text-white transition text-sm">
                🤖 Assistant
              </Link>
              <Link to="/academy" className="text-white/70 hover:text-white transition text-sm">
                📚 Learning
              </Link>
              <Link to="/social" className="text-white/70 hover:text-white transition text-sm">
                🌍 Social
              </Link>
              <Link to="/account" className="text-white/70 hover:text-white transition text-sm">
                Account
              </Link>
              <Link to="/settings/language" className="text-white/70 hover:text-white transition text-sm">
                Language
              </Link>
              <button
                onClick={handleLogout}
                className="text-white/50 hover:text-white/80 transition text-sm"
              >
                Logout
              </button>
              <span className="text-white/40">|</span>
              <span className="text-white/60 text-sm">{user.username}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white/70 hover:text-white transition">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
