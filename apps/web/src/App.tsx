// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { authAPI } from "./api/client";
import { SESSION_EXPIRED, clearRejectedSession } from "./utils/authSession";
import Navbar from "./components/Navbar";
import SEO from "./components/SEO";
import Home, { HOME_METADATA } from "./pages/Home";
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
import IeltsLearningHub from "./pages/IeltsLearningHub";
import IeltsAssessment from "./pages/IeltsAssessment";
import Assistant from "./pages/Assistant";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import AccountPage from "./pages/Account";
import ProductPage from "./pages/products/IeltsImmersion";
import CheckoutPage from "./pages/checkout/IeltsImmersion";
import ReceiptPreviewPage from "./pages/receipts/Preview";

const SessionContext = createContext({
  user: null as any,
  loading: true,
  unavailable: false,
  retry: () => {},
});

function SessionStatus({ pending = false }: { pending?: boolean }) {
  const { retry } = useContext(SessionContext);
  return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
    <p role={pending ? "status" : "alert"}>{pending
      ? "正在確認登入狀態… / Checking your session…"
      : "暫時無法確認登入狀態，請重新連線後再試。 / Unable to verify your session. Please retry."}</p>
    {!pending && <button className="btn-primary" onClick={retry}>重新連線 / Retry</button>}
    <Link className="text-teal-300 underline" to="/">返回首頁 / Home</Link>
  </div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, unavailable } = useContext(SessionContext);
  if (loading) return <SessionStatus pending />;
  if (unavailable) return <SessionStatus />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LocalizedHome() {
  const { currentLanguage } = useLanguage();
  const metadata = HOME_METADATA[currentLanguage] ?? HOME_METADATA["zh-TW"];

  return (
    <>
      <SEO
        title={metadata.title}
        description={metadata.description}
        canonical="https://www.nightasaur.com/"
        locale={currentLanguage.replace("-", "_")}
      />
      <Home />
    </>
  );
}

function AppContent() {
  const [user, setUserState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authUnavailable, setAuthUnavailable] = useState(false);
  const verification = useRef(0);
  const { pathname } = useLocation();
  const publicPage = ["/", "/login", "/register", "/privacy", "/products/ielts-immersion"].includes(pathname);

  const setUser = useCallback((nextUser: any) => {
    verification.current += 1;
    setUserState(nextUser);
    setLoading(false);
    setAuthUnavailable(false);
  }, []);

  const verifySession = useCallback(async () => {
    const attempt = ++verification.current;
    const token = localStorage.getItem("nightasaur_token");
    setAuthUnavailable(false);
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const stillCurrent = () => attempt === verification.current && token === localStorage.getItem("nightasaur_token");
    try {
      const res = await authAPI.me();
      if (stillCurrent()) setUserState(res.data);
    } catch (error: any) {
      if (!stillCurrent()) return;
      if (error.response?.status === 401) clearRejectedSession(`Bearer ${token}`);
      else setAuthUnavailable(true);
    } finally {
      if (stillCurrent()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED, expired);
    void verifySession();
    return () => {
      verification.current += 1;
      window.removeEventListener(SESSION_EXPIRED, expired);
    };
  }, [setUser, verifySession]);

  return (
    <SessionContext.Provider value={{ user, loading, unavailable: authUnavailable, retry: verifySession }}>
    <div className="min-h-screen relative z-10">
      <Navbar user={user} setUser={setUser} />
      <main className="pt-20">
        {publicPage && loading && <p role="status" className="px-6 py-2 text-center text-white/60 text-sm">正在確認登入狀態，你可以繼續瀏覽。 / Checking your session; browsing remains available.</p>}
        {publicPage && authUnavailable && <div className="px-6 py-3 text-center text-sm">
          <p role="alert">暫時無法確認登入狀態，公開頁面仍可使用。 / Session verification is unavailable; public pages remain available.</p>
          <button className="text-teal-300 underline mt-2" onClick={verifySession}>重新連線 / Retry</button>
        </div>}
        <Routes>
          <Route path="/" element={<LocalizedHome />} />
          <Route path="/privacy" element={<><SEO title="Privacy Policy | Nightasaur" canonical="https://www.nightasaur.com/privacy" /><Privacy /></>} />
          <Route path="/login" element={<><SEO title="Login | Nightasaur" canonical="https://www.nightasaur.com/login" /><Login setUser={setUser} /></>} />
          <Route path="/register" element={<><SEO title="Create Your Spirit | Nightasaur" canonical="https://www.nightasaur.com/register" /><Register setUser={setUser} /></>} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><><SEO title="Dashboard | Nightasaur" canonical="https://www.nightasaur.com/dashboard" /><Dashboard /></></ProtectedRoute>}
          />
          <Route
            path="/spirits"
            element={<ProtectedRoute><><SEO title="My Spirits | Nightasaur" canonical="https://www.nightasaur.com/spirits" /><Spirits /></></ProtectedRoute>}
          />
          <Route
            path="/spirits/new"
            element={<ProtectedRoute><><SEO title="Create New Spirit | Nightasaur" canonical="https://www.nightasaur.com/spirits/new" /><CreateSpirit /></></ProtectedRoute>}
          />
          <Route
            path="/spirits/:id"
            element={<ProtectedRoute><><SEO title="Spirit Details | Nightasaur" canonical="https://www.nightasaur.com/spirits" /><SpiritDetail /></></ProtectedRoute>}
          />
          <Route
            path="/social"
            element={<ProtectedRoute><><SEO title="Community | Nightasaur" canonical="https://www.nightasaur.com/social" /><Social /></></ProtectedRoute>}
          />
          <Route
            path="/assistant"
            element={<ProtectedRoute><><SEO title="AI Assistant | Nightasaur" canonical="https://www.nightasaur.com/assistant" /><Assistant /></></ProtectedRoute>}
          />
          <Route
            path="/settings/language"
            element={<ProtectedRoute><><SEO title="Language Settings | Nightasaur" canonical="https://www.nightasaur.com/settings/language" /><LanguageSettings /></></ProtectedRoute>}
          />

          <Route
            path="/academy"
            element={<ProtectedRoute><><SEO title="Learning Academy | Nightasaur" canonical="https://www.nightasaur.com/academy" /><Academy /></></ProtectedRoute>}
          />
          <Route
            path="/academy/learn/:sessionId"
            element={<ProtectedRoute><><SEO title="Learning Session | Nightasaur" canonical="https://www.nightasaur.com/academy/learn" /><AcademyLearn /></></ProtectedRoute>}
          />
          <Route
            path="/academy/categories"
            element={<ProtectedRoute><><SEO title="Learning Categories | Nightasaur" canonical="https://www.nightasaur.com/academy/categories" /><AcademyCategories /></></ProtectedRoute>}
          />
          <Route
            path="/academy/category/ielts"
            element={<ProtectedRoute><><SEO title="IELTS Companion Learning | Nightasaur" canonical="https://www.nightasaur.com/academy/category/ielts" /><IeltsLearningHub /></></ProtectedRoute>}
          />
          <Route
            path="/academy/category/ielts/assessment"
            element={<ProtectedRoute><><SEO title="IELTS Assessment | Nightasaur" canonical="https://www.nightasaur.com/academy/category/ielts/assessment" /><IeltsAssessment /></></ProtectedRoute>}
          />
          <Route
            path="/academy/category/:categoryId"
            element={<ProtectedRoute><><SEO title="Learning Category | Nightasaur" canonical="https://www.nightasaur.com/academy/categories" /><AcademyCategories /></></ProtectedRoute>}
          />

          {/* Front Office Routes */}
          <Route path="/account" element={<ProtectedRoute><><SEO title="Account Settings | Nightasaur" canonical="https://www.nightasaur.com/account" /><AccountPage /></></ProtectedRoute>} />
          <Route path="/products/ielts-immersion" element={<><SEO title="Nightasaur Deep IELTS Immersion Experience — 1 Month" canonical="https://www.nightasaur.com/products/ielts-immersion" /><ProductPage /></>} />
          <Route path="/checkout/ielts-immersion" element={<ProtectedRoute><><SEO title="Checkout | Nightasaur" canonical="https://www.nightasaur.com/checkout/ielts-immersion" /><CheckoutPage /></></ProtectedRoute>} />
          <Route path="/receipts/preview" element={<ProtectedRoute><><SEO title="Receipt Preview | Nightasaur" canonical="https://www.nightasaur.com/receipts/preview" /><ReceiptPreviewPage /></></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}
