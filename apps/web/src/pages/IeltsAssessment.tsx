import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ieltsAssessmentAPI } from "../api/client";
import type { IeltsDiagnosticAnswerResponse, IeltsDiagnosticStartResponse } from "../api/client";
import IeltsLearningLoop from "./IeltsLearningLoop";

type SkillId = "listening" | "reading" | "writing" | "speaking";

type SkillProfile = {
  id: SkillId;
  label: string;
  zh: string;
  status: "pending-objective" | "pending-rubric" | "objective-complete";
  value: string;
  note: string;
};

const targetBands = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const dailyMinutes = [30, 45, 60, 90];

function requestErrorMessage(error: unknown): string {
  const candidate = error as { response?: { data?: { error?: unknown } } };
  const apiError = candidate.response?.data?.error;
  return typeof apiError === "string" ? apiError : "暫時無法連線到 Diagnostic API，請稍後重試。";
}

export default function IeltsAssessment() {
  const navigate = useNavigate();
  const [targetBand, setTargetBand] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [examDate, setExamDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [session, setSession] = useState<IeltsDiagnosticStartResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<IeltsDiagnosticAnswerResponse["feedback"] | null>(null);
  const [result, setResult] = useState<NonNullable<IeltsDiagnosticAnswerResponse["result"]> | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = targetBand !== null && minutes !== null;
  const currentQuestion = session?.diagnostic.questions[questionIndex] ?? null;
  const currentPassage = session?.diagnostic.passages.find(
    (passage) => passage.id === currentQuestion?.passageId,
  );

  const skillProfiles = useMemo<SkillProfile[]>(
    () => [
      {
        id: "listening",
        label: "Listening",
        zh: "聽力",
        status: "pending-objective",
        value: "—",
        note: "等待具備音訊刺激與作答紀錄的客觀題流程。",
      },
      result
        ? {
            id: "reading",
            label: "Reading",
            zh: "閱讀",
            status: "objective-complete",
            value: `${result.correct} / ${result.total} · ${result.accuracyPercent}%`,
            note: "已建立真實作答的客觀正確率基線；不換算為 IELTS Band。",
          }
        : {
            id: "reading",
            label: "Reading",
            zh: "閱讀",
            status: "pending-objective",
            value: "—",
            note: "完成下方 Reading Diagnostic 後，才建立客觀正確率基線。",
          },
      {
        id: "writing",
        label: "Writing",
        zh: "寫作",
        status: "pending-rubric",
        value: "—",
        note: "等待 Writing rubric（寫作評分規準）與 AI Feedback（AI 回饋）管線。",
      },
      {
        id: "speaking",
        label: "Speaking",
        zh: "口說",
        status: "pending-rubric",
        value: "—",
        note: "等待錄音、轉寫與 Speaking rubric（口說評分規準）管線。",
      },
    ],
    [result],
  );

  const dailyPlanBoundary = useMemo(() => {
    if (!targetBand || !minutes) return null;
    return {
      targetBand,
      minutes,
      examDate: examDate || null,
      status: result ? "diagnostic-evidence-ready" : "waiting-for-diagnostic",
    };
  }, [targetBand, minutes, examDate, result]);

  const startDiagnostic = async () => {
    if (!canConfirm || isStarting) return;
    setConfirmed(true);
    setError(null);
    setIsStarting(true);

    try {
      const response = await ieltsAssessmentAPI.startDiagnostic();
      setSession(response.data);
      setQuestionIndex(response.data.currentQuestion);
      setSelectedAnswer(null);
      setFeedback(null);
      setResult(null);
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setIsStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentQuestion || selectedAnswer === null || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await ieltsAssessmentAPI.submitAnswer(
        session.sessionId,
        currentQuestion.id,
        selectedAnswer,
      );
      setFeedback(response.data.feedback);
      if (response.data.result) setResult(response.data.result);
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueDiagnostic = () => {
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    setFeedback(null);
    setError(null);
  };

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
            v0.4 · Reading Diagnostic Baseline
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">IELTS 起始評量</h1>
          <p className="text-white/60 max-w-3xl leading-relaxed">
            設定學習目標後，完成六題原創 IELTS-style Reading（閱讀）題。結果只呈現真實作答的客觀正確率，不把短測驗偽裝成官方 IELTS Band。
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

          {!session && !result && (
            <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                disabled={!canConfirm || isStarting}
                onClick={startDiagnostic}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  canConfirm && !isStarting
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    : "bg-white/10 text-white/35 cursor-not-allowed"
                }`}
              >
                {isStarting ? "建立診斷會話中…" : "建立設定並開始 Reading Diagnostic"}
              </button>
              <span className="text-xs text-white/40">目標設定目前留在此頁；作答紀錄由伺服器評分，正解不會隨題目下發。</span>
            </div>
          )}
        </section>

        <aside className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">Assessment Contract</h2>
          <div className="space-y-3 text-sm text-white/60">
            <p>• Target Band：由使用者設定</p>
            <p>• Reading Result：來自六題真實作答</p>
            <p>• Answer Key：作答前只留在伺服器端</p>
            <p>• Band Estimate：本基線不產生</p>
            <p>• Writing / Speaking：必須經 rubric 評量</p>
          </div>
        </aside>
      </div>

      <section className="glass-card p-6 mb-8 border border-emerald-400/15">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">2. Reading Diagnostic（閱讀診斷）</h2>
            <p className="text-sm text-white/50 mt-1">兩篇原創短文、六題、依序提交並由伺服器評分。</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 w-fit">
            {result ? "客觀基線完成" : session ? `${questionIndex + 1} / ${session.diagnostic.questions.length}` : "尚未開始"}
          </span>
        </div>

        {!session && !result && (
          <p className="text-white/55">先選擇目標 Band 與每日投入時間，再開始真實作答流程。</p>
        )}

        {session && currentQuestion && currentPassage && !result && (
          <div className="grid lg:grid-cols-5 gap-6">
            <article className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wider text-sky-300 mb-2">Original passage</div>
              <h3 className="text-xl font-bold mb-4">{currentPassage.title}</h3>
              <p className="text-white/70 leading-8">{currentPassage.content}</p>
            </article>

            <div className="lg:col-span-2">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                {currentQuestion.questionType} · Question {questionIndex + 1}
              </div>
              <h3 className="text-lg font-bold mb-4">{currentQuestion.prompt}</h3>
              <div role="radiogroup" aria-label={`Question ${questionIndex + 1} options`} className="space-y-3">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const isCorrectOption = feedback?.correctAnswerIndex === optionIndex;
                  const isWrongSelection = Boolean(feedback && isSelected && !feedback.correct);
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={Boolean(feedback)}
                      key={`${currentQuestion.id}:${optionIndex}`}
                      onClick={() => setSelectedAnswer(optionIndex)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                        isCorrectOption
                          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                          : isWrongSelection
                            ? "border-rose-400/60 bg-rose-500/20 text-rose-100"
                            : isSelected
                              ? "border-sky-400/60 bg-sky-500/20 text-sky-100"
                              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-2 text-white/40">{String.fromCharCode(65 + optionIndex)}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div
                  className={`mt-4 rounded-xl p-4 text-sm ${
                    feedback.correct
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-amber-500/15 text-amber-100"
                  }`}
                >
                  <div className="font-bold mb-1">{feedback.correct ? "答對了" : "這題答錯了"}</div>
                  <p className="leading-relaxed">{feedback.explanation}</p>
                </div>
              )}

              <div className="mt-5">
                {!feedback ? (
                  <button
                    type="button"
                    disabled={selectedAnswer === null || isSubmitting}
                    onClick={submitAnswer}
                    className={`w-full px-5 py-3 rounded-xl font-medium ${
                      selectedAnswer !== null && !isSubmitting
                        ? "bg-sky-500 hover:bg-sky-400 text-slate-950"
                        : "bg-white/10 text-white/35 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "提交中…" : "提交這一題"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={continueDiagnostic}
                    className="w-full px-5 py-3 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  >
                    下一題
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/20 p-5">
              <div className="text-xs text-emerald-200/70 mb-1">Objective Score</div>
              <div className="text-3xl font-black">{result.correct} / {result.total}</div>
            </div>
            <div className="rounded-2xl bg-sky-500/15 border border-sky-400/20 p-5">
              <div className="text-xs text-sky-200/70 mb-1">Accuracy</div>
              <div className="text-3xl font-black">{result.accuracyPercent}%</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs text-white/45 mb-1">IELTS Band Estimate</div>
              <div className="text-xl font-black">不產生</div>
            </div>
            <p className="md:col-span-3 text-sm text-white/55 leading-relaxed">{result.notice}</p>
          </div>
        )}

        {error && <div role="alert" className="mt-5 rounded-xl bg-rose-500/15 p-4 text-sm text-rose-100">{error}</div>}
      </section>

      <section className="glass-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">3. 四科 Learning Profile 結構</h2>
            <p className="text-sm text-white/50 mt-1">只呈現已有證據的能力欄位；其餘維持待評量。</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full w-fit ${result ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
            {result ? "Reading baseline ready" : "未評量"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillProfiles.map((skill) => (
            <div key={skill.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-bold mb-1">{skill.label}</div>
              <div className="text-emerald-300 text-sm mb-3">{skill.zh}</div>
              <div className="text-2xl font-black mb-2">{skill.value}</div>
              <div className="text-xs text-white/45 mb-3">
                {skill.status === "objective-complete" ? "Objective baseline" : "Band estimate 尚未建立"}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{skill.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 border border-sky-400/15">
        <h2 className="text-xl font-bold mb-4">4. Daily Plan 邊界</h2>
        {!confirmed || !dailyPlanBoundary ? (
          <p className="text-white/55">完成上方設定後，這裡才會建立 Daily Plan（每日計畫）的輸入邊界。</p>
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
              <div className={`text-sm font-bold ${result ? "text-emerald-200" : "text-amber-200"}`}>
                {result ? "診斷證據已備妥" : "等待 Diagnostic"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-white/55">
          W3 只建立真實 Reading 作答與客觀結果基線。Daily Plan、Writing / Speaking rubric 與 AI Feedback 仍依主線 Gate 推進，不提前宣稱完成。
        </div>
      </section>

      <IeltsLearningLoop
        refreshKey={
          result
            ? `${result.correct}:${result.total}:${result.accuracyPercent}`
            : "initial"
        }
      />
    </div>
  );
}
