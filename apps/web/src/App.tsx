// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { authAPI } from "./api/client";
import Navbar from "./components/Navbar";
import SEO from "./components/SEO";
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
import IeltsLearningHub from "./pages/IeltsLearningHub";
import IeltsAssessment from "./pages/IeltsAssessment";
import Assistant from "./pages/Assistant";
import { LanguageProvider } from "./contexts/LanguageContext";
import AccountPage from "./pages/Account";
import ProductPage from "./pages/products/IeltsImmersion";
import CheckoutPage from "./pages/checkout/IeltsImmersion";
import ReceiptPreviewPage from "./pages/receipts/Preview";

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
      <Navbar user={user} setUser={setUser} />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<><SEO title="Nightasaur — 陪你學習、創作與現實成長的 AI Spirit" canonical="https://www.nightasaur.com/" /><Home /></>} />
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
