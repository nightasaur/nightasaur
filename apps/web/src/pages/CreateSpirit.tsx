import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { spiritsAPI } from "../api/client";

export default function CreateSpirit() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [element, setElement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!element) { setError("請選擇屬性！"); return; }
    if (!name.trim()) { setError("請輸入精靈名字！"); return; }
    setLoading(true); setError("");
    try {
      const res = await spiritsAPI.create({
        name: name.trim(),
        element,
      });
      nav(`/spirits/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "孵化失敗");
    } finally { setLoading(false); }
  };

  const elements = [
    { v: "FIRE", l: "🔥", n: "火" },
    { v: "WATER", l: "💧", n: "水" },
    { v: "LIGHT", l: "✨", n: "光" },
    { v: "SHADOW", l: "🌑", n: "暗" },
    { v: "STAR", l: "⭐", n: "星" },
    { v: "ILLUSION", l: "🦊", n: "幻" },
    { v: "MOON", l: "🌙", n: "月" },
    { v: "NATURE", l: "🌿", n: "自然" },
    { v: "THUNDER", l: "⚡", n: "雷" },
    { v: "ICE", l: "❄️", n: "冰" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-8 text-center">🥚 孵化你的精靈</h1>
      
      {error && <div className="glass-card text-center text-red-400 mb-4 py-3">{error}</div>}

      <div className="glass-card text-center py-8">
        <h2 className="text-2xl font-bold mb-6">為你的精靈取名字</h2>
        <input value={name} onChange={e=>setName(e.target.value)}
          placeholder="例如：小烈焰、水靈靈..."
          className="input-field text-center text-2xl font-bold mb-8 max-w-sm mx-auto" />
        
        <h2 className="text-2xl font-bold mb-6">選擇元素屬性</h2>
        <p className="text-white/40 text-sm mb-6">屬性會影響精靈的技能與成長方向</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {elements.map(e=>(
            <button key={e.v} onClick={()=>setElement(e.v)}
              className={`p-4 rounded-xl text-center transition-all ${
                element===e.v?"bg-teal-500/40 border border-teal-400 scale-105 shadow-lg":"bg-white/5 hover:bg-white/10"
              }`}>
              <div className="text-4xl mb-2">{e.l}</div>
              <div className="font-bold text-lg">{e.n}</div>
              <div className="text-xs text-white/40">{e.v}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={()=>nav("/spirits")} className="glass px-6 py-2 rounded-lg">取消</button>
          <button onClick={handleSubmit} disabled={loading || !name.trim() || !element}
            className="btn-primary px-12 disabled:opacity-50">
            {loading?"孵化中...":"✨ 孵化精靈"}
          </button>
        </div>
      </div>
    </div>
  );
}