// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useEffect, useState } from "react";
import { authAPI } from "./api/client";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Spirits from "./pages/Spirits";
import CreateSpirit from "./pages/CreateSpirit";
import SpiritDetail from "./pages/SpiritDetail";
import Social from "./pages/Social";
import APISettings from "./pages/APISettings";
import Privacy from "./pages/Privacy";
import Academy from "./pages/Academy";
import AcademyLearn from "./pages/AcademyLearn";
import LanguageSettings from "./pages/LanguageSettings";
import AcademyCategories from "./pages/AcademyCategories";
import { LanguageProvider } from "./contexts/LanguageContext";

// 簡單的 SEO 元資料組件
function SEO() {
  return (
    <>
      <title>Nightasaur - AI 數位精靈夥伴</title>
      <meta name="description" content="每人註冊即可生成專屬 AI 精靈，像數碼寶貝一樣成長進化，陪你對話冒險！支援多語言、夜間主題、PWA 安裝。" />
      <meta name="keywords" content="AI精靈,數位寵物,虛擬夥伴,中文AI,夜間主題,PWA,多語言" />
      <meta name="author" content="Nightasaur Team" />
      <meta name="theme-color" content="#0a0d14" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="zh-TW" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Nightasaur - AI 數位精靈夥伴" />
      <meta property="og:description" content="每人註冊即可生成專屬 AI 精靈，像數碼寶貝一樣成長進化，陪你對話冒險！" />
      <meta property="og:image" content="/nightasaur-og.png" />
      <meta property="og:url" content="https://nightasaur.com" />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Nightasaur - AI 數位精靈夥伴" />
      <meta name="twitter:description" content="每人註冊即可生成專屬 AI 精靈，像數碼寶貝一樣成長進化，陪你對話冒險！" />
      <meta name="twitter:image" content="/nightasaur-og.png" />
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("nightasaur_token");
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nightasaur_token");
    if (token) {
      authAPI
        .me()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("nightasaur_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen gradient-night flex items-center justify-center">
        <SEO />
        <div className="text-4xl animate-float">🌙</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <SEO />
      <Navbar user={user} setUser={setUser} />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/spirits"
            element={<ProtectedRoute><Spirits /></ProtectedRoute>}
          />
          <Route
            path="/spirits/new"
            element={<ProtectedRoute><CreateSpirit /></ProtectedRoute>}
          />
          <Route
            path="/spirits/:id"
            element={<ProtectedRoute><SpiritDetail /></ProtectedRoute>}
          />
          <Route
            path="/social"
            element={<ProtectedRoute><Social /></ProtectedRoute>}
          />
          <Route
            path="/settings/api"
            element={<ProtectedRoute><APISettings /></ProtectedRoute>}
          />
          <Route
            path="/settings/language"
            element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>}
          />
          
          <Route
            path="/academy"
            element={<ProtectedRoute><Academy /></ProtectedRoute>}
          />
          <Route
            path="/academy/learn/:sessionId"
            element={<ProtectedRoute><AcademyLearn /></ProtectedRoute>}
          />
          <Route
            path="/academy/categories"
            element={<ProtectedRoute><AcademyCategories /></ProtectedRoute>}
          />
          <Route
            path="/academy/category/:categoryId"
            element={<ProtectedRoute><AcademyCategories /></ProtectedRoute>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}