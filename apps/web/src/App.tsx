import { Routes, Route, Navigate } from "react-router-dom";
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
import LanguageSettings from "./pages/LanguageSettings";
import { LanguageProvider } from "./contexts/LanguageContext";

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
        <div className="text-4xl animate-float">🌙</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
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