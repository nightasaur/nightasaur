import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Academy() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      const response = await fetch("/api/academy/courses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}`,
        },
      });
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("加載學院數據失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const startCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/academy/courses/${courseId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}`,
        },
        body: JSON.stringify({ spiritId: null }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/academy/learn/${data.sessionId}`;
      } else {
        alert("開始課程失敗");
      }
    } catch (error) {
      console.error("開始課程失敗:", error);
      alert("開始課程失敗");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-white/50">加載學院數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">🦉 夜龍學院</h1>
        <p className="text-white/60">學習知識，提升精靈能力，成為最強訓練家！</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="glass-card p-6 hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{course.icon}</div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                course.difficulty === "初級" ? "bg-green-500/20 text-green-300" :
                course.difficulty === "中級" ? "bg-yellow-500/20 text-yellow-300" :
                "bg-red-500/20 text-red-300"
              }`}>
                {course.difficulty}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            <p className="text-white/60 text-sm mb-4">{course.description}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">分類:</span>
                <span className="text-white/80">{course.categories.join(", ")}</span>
              </div>
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">時間:</span>
                <span className="text-white/80">{course.estimatedTime}</span>
              </div>
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">獎勵:</span>
                <span className="text-white/80">
                  🎯 {course.reward.xp} XP • 🪙 {course.reward.coins} 金幣
                </span>
              </div>
            </div>

            <button
              onClick={() => course.unlocked && startCourse(course.id)}
              disabled={!course.unlocked}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                course.unlocked
                  ? "btn-primary bg-gradient-to-r from-teal-500 to-blue-500"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {course.unlocked ? "開始學習 🚀" : "🔒 尚未解鎖"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 glass-card p-6">
        <h3 className="text-xl font-bold mb-4">📚 學院說明</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-teal-300">🎯 學習好處</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 提升精靈對戰時的知識加成</li>
              <li>• 獲得額外經驗和金幣獎勵</li>
              <li>• 解鎖高階課程和特殊能力</li>
              <li>• 增加訓練家等級和聲望</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-teal-300">🏆 獎勵系統</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 每完成一個課程獲得 XP 和金幣</li>
              <li>• 高正確率獲得額外獎勵</li>
              <li>• 連續學習獲得成就和稱號</li>
              <li>• 排名系統與其他玩家競爭</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}