import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type SkillId = "listening" | "reading" | "writing" | "speaking";

type SkillProfile = {
  id: SkillId;
  label: string;
  zh: string;
  status: "not-assessed" | "pending-objective" | "pending-rubric";
  note: string;
};

const targetBands = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const dailyMinutes = [30, 45, 60, 90];

const initialSkills: SkillProfile[] = [
  {
    id: "listening",
    label: "Listening",
    zh: "聽力",
    status: "pending-objective",
    note: "下一步接入客觀題與答題紀錄後，再建立能力基線。",
  },
  {
    id: "reading",
    label: "Reading",
    zh: "閱讀",
    status: "pending-objective",
    note: "下一步接入客觀題與答題紀錄後，再建立能力基線。",
  },
  {
    id: "writing",
    label: "Writing",
    zh: "寫作",
    status: "pending-rubric",
    note: "等待 Writing rubric（寫作評分規準）與 AI Feedback（AI 回饋）管線。",
  },
  {
    id: "speaking",
    label: "Speaking",
    zh: "口說",
    status: "pending-rubric",
    note: "等待錄音／轉寫與 Speaking rubric（口說評分規準）管線。",
  },
];

export default function IeltsAssessment() {
  const navigate = useNavigate();
  const [targetBand, setTargetBand] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [examDate, setExamDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const dailyPlanBoundary = useMemo(() => {
    if (!targetBand || !minutes) return null;
    return {
      targetBand,
      minutes,
      examDate: examDate || null,
      status: "waiting-for-diagnostic" as const,
    };
  }, [targetBand, minutes, examDate]);

  const canConfirm = targetBand !== null && minutes !== null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate("/academy/category/ielts")}
          className="text-left text-sm text-white/55 hover:text-white transition-colors w-fit"
        >
          ← 返回 IELTS Companion
        </button>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 text-sky-200 text-sm mb-3">
            LAUNCH-1B · Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">IELTS 起始評量設定</h1>
          <p className="text-white/60 max-w-3xl leading-relaxed">
            先建立目標 Band 與每日可投入時間。這一頁只建立 Assessment（評量）與 Learning Profile（學習檔案）的資料邊界，不會把尚未做過的測驗結果偽裝成 IELTS 分數。
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <section className="glass-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-5">1. 設定學習目標</h2>

          <div className="mb-6">
            <div className="text-sm text-white/55 mb-3">目標 IELTS Band</div>
            <div className="flex flex-wrap gap-2">
              {targetBands.map((band) => (
                <button
                  type="button"
                  key={band}
                  onClick={() => setTargetBand(band)}
                  className={`px-4 py-2 rounded-xl border transition-colors ${
                    targetBand === band
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-100"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {band.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-white/55 mb-3">每天可投入時間</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dailyMinutes.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setMinutes(value)}
                  className={`px-4 py-3 rounded-xl border transition-colors ${
                    minutes === value
                      ? "bg-sky-500/20 border-sky-400/50 text-sky-100"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {value} 分鐘
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block text-sm text-white/55 mb-2">預計考試日期（選填）</span>
            <input
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>

          <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => setConfirmed(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                canConfirm
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-white/10 text-white/35 cursor-not-allowed"
              }`}
            >
              建立評量設定
            </button>
            <span className="text-xs text-white/40">目前不寫入伺服器；離開頁面後不保留。</span>
          </div>
        </section>

        <aside className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Assessment Contract</h2>
          <div className="space-y-3 text-sm text-white/60">
            <p>• Target Band：由使用者設定</p>
            <p>• Diagnostic Result：必須來自真實作答</p>
            <p>• Writing / Speaking：必須經 rubric 評量</p>
            <p>• Daily Plan：只有在評量資料存在後才產生</p>
            <p>• 不把自我感覺直接換算成 IELTS Band</p>
          </div>
        </aside>
      </div>

      <section className="glass-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">2. 四科 Learning Profile 結構</h2>
            <p className="text-sm text-white/50 mt-1">能力欄位已建立，但尚未有可驗證的實測結果。</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 w-fit">未評量</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {initialSkills.map((skill) => (
            <div key={skill.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-bold mb-1">{skill.label}</div>
              <div className="text-emerald-300 text-sm mb-3">{skill.zh}</div>
              <div className="text-2xl font-black mb-2">—</div>
              <div className="text-xs text-white/45 mb-3">Band estimate 尚未建立</div>
              <p className="text-xs text-white/50 leading-relaxed">{skill.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 border border-sky-400/15">
        <h2 className="text-xl font-bold mb-4">3. Daily Plan 邊界</h2>
        {!confirmed || !dailyPlanBoundary ? (
          <p className="text-white/55">完成上方設定後，這裡會顯示第一版 Daily Plan（每日計畫）的輸入資料，但不會生成假任務。</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Target Band</div>
              <div className="text-xl font-bold">{dailyPlanBoundary.targetBand.toFixed(1)}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Daily Load</div>
              <div className="text-xl font-bold">{dailyPlanBoundary.minutes} min</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Exam Date</div>
              <div className="text-xl font-bold">{dailyPlanBoundary.examDate || "未設定"}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-white/40 mb-1">Plan Status</div>
              <div className="text-sm font-bold text-amber-200">等待 Diagnostic</div>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-white/55">
          下一個 functional slice（功能切片）會接入真實 Reading / Listening 題目與作答紀錄，再把客觀結果寫進 Learning Profile。Writing / Speaking 會另外接 rubric 與 AI feedback，不先偽造 Band。
        </div>
      </section>
    </div>
  );
}
