import { Link } from "react-router-dom";

const categories = [
  { id: "element", name: "元素知識", icon: "🔥", desc: "學習元素相剋和屬性", count: 150 },
  { id: "spirit", name: "精靈研究", icon: "🦎", desc: "精靈種類、進化和技能", count: 120 },
  { id: "math", name: "數學基礎", icon: "🧮", desc: "基礎數學運算和邏輯", count: 200 },
  { id: "logic", name: "邏輯推理", icon: "🧠", desc: "邏輯思維和問題解決", count: 180 },
  { id: "species", name: "物種分類", icon: "🐾", desc: "生物分類和生態知識", count: 100 },
  { id: "ielts", name: "英語學習", icon: "🌍", desc: "雅思詞彙和閱讀理解", count: 250 },
];

export default function AcademyCategories() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">🗂️ 分類題庫</h1>
        <p className="text-white/60">按類別學習，專注提升特定領域知識</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/academy/category/${cat.id}`}
            className="glass-card p-6 text-center hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">{cat.icon}</div>
            <div className="font-medium mb-1">{cat.name}</div>
            <div className="text-xs text-white/50">{cat.count} 題</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">🏆 學習排行榜</h3>
          <div className="space-y-3">
            {["玩家A", "玩家B", "玩家C", "玩家D", "玩家E"].map((name, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx === 0 ? "bg-yellow-500/20 text-yellow-300" :
                    idx === 1 ? "bg-gray-400/20 text-gray-300" :
                    idx === 2 ? "bg-orange-500/20 text-orange-300" :
                    "bg-white/10 text-white/60"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="font-medium">{name}</div>
                </div>
                <div className="text-teal-300">{95 - idx}% 正確率</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">📈 學習建議</h3>
          <div className="space-y-3">
            <div>
              <div className="font-medium text-teal-300">每日目標</div>
              <div className="text-sm text-white/60">建議每天完成 20 題練習</div>
            </div>
            <div>
              <div className="font-medium text-teal-300">弱項加強</div>
              <div className="text-sm text-white/60">建議加強「邏輯推理」類別</div>
            </div>
            <div>
              <div className="font-medium text-teal-300">學習時間</div>
              <div className="text-sm text-white/60">最佳學習時段：晚上 7-9 點</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}