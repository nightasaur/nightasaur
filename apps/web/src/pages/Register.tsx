import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Register({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await authAPI.register(form);
      localStorage.setItem("nightasaur_token", res.data.token);
      setUser(res.data.user);
      nav("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "註冊失敗");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md">
        <h2 className="text-3xl font-black text-center mb-2">孵化你的精靈 🥚</h2>
        <p className="text-white/50 text-center mb-8">註冊即可生成屬於你的 AI 精靈夥伴！</p>

        {error && <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input-field" type="email" placeholder="Email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input-field" type="text" placeholder="使用者名稱" required
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className="input-field" type="password" placeholder="密碼 (至少8字)" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn-primary w-full" type="submit">孵化精靈 🥚</button>
        </form>
        <p className="text-center text-white/40 mt-6">
          已經有帳號？{" "}
          <Link to="/login" className="text-purple-400 hover:text-purple-300">登入</Link>
        </p>
      </div>
    </div>
  );
}