import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ieltsAssessmentAPI,
  IeltsDailyPlanResponse,
  IeltsLearningProfileResponse,
  IeltsPracticeAnswerResponse,
  IeltsPracticeStartResponse,
} from "../api/client";

function requestErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { error?: unknown } };
  };
  const apiError = candidate.response?.data?.error;
  return typeof apiError === "string"
    ? apiError
    : "暫時無法載入 IELTS Learning Loop，請稍後重試。";
}

export default function IeltsLearningLoop({
  refreshKey,
}: {
  refreshKey: string | number;
}) {
  const [profile, setProfile] =
    useState<IeltsLearningProfileResponse | null>(null);
  const [plan, setPlan] = useState<IeltsDailyPlanResponse | null>(null);
  const [practice, setPractice] =
    useState<IeltsPracticeStartResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] =
    useState<IeltsPracticeAnswerResponse["feedback"] | null>(null);
  const [practiceResult, setPracticeResult] = useState<
    NonNullable<IeltsPracticeAnswerResponse["result"]> | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [startingPractice, setStartingPractice] = useState(false);
  const [submittingPractice, setSubmittingPractice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, planResponse] = await Promise.all([
        ieltsAssessmentAPI.getProfile(),
        ieltsAssessmentAPI.getDailyPlan(),
      ]);
      setProfile(profileResponse.data);
      setPlan(planResponse.data);
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshEvidence();
  }, [refreshEvidence, refreshKey]);

  const latestReadingEvidence = profile?.skills.reading.latestEvidence ?? null;
  const currentQuestion =
    practice?.practice.questions[questionIndex] ?? null;
  const currentPassage = useMemo(
    () =>
      practice?.practice.passages.find(
        (passage) => passage.id === currentQuestion?.passageId,
      ) ?? null,
    [currentQuestion?.passageId, practice?.practice.passages],
  );

  const startPractice = async () => {
    if (startingPractice || plan?.status !== "ready") return;
    setStartingPractice(true);
    setError(null);
    try {
      const response = await ieltsAssessmentAPI.startPractice();
      setPractice(response.data);
      setQuestionIndex(response.data.currentQuestion);
      setSelectedAnswer(null);
      setFeedback(null);
      setPracticeResult(null);
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setStartingPractice(false);
    }
  };

  const submitPracticeAnswer = async () => {
    if (
      !practice ||
      !currentQuestion ||
      selectedAnswer === null ||
      submittingPractice
    ) {
      return;
    }

    setSubmittingPractice(true);
    setError(null);
    try {
      const response = await ieltsAssessmentAPI.submitPracticeAnswer(
        practice.sessionId,
        currentQuestion.id,
        selectedAnswer,
      );
      setFeedback(response.data.feedback);
      if (response.data.result) setPracticeResult(response.data.result);
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setSubmittingPractice(false);
    }
  };

  const continuePractice = () => {
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    setFeedback(null);
    setError(null);
  };

  return (
    <section className="glass-card p-6 mt-8 border border-violet-400/15">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold">5. IELTS Learning Loop</h2>
          <p className="text-sm text-white/50 mt-1">
            伺服器證據 → Daily Plan（每日計畫）→ Reading Practice（閱讀練習）→ 客觀回饋。
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-violet-500/15 text-violet-200 w-fit">
          Band Estimate：不產生
        </span>
      </div>

      {loading && <p className="text-white/55">載入 Learning Profile 與 Daily Plan…</p>}

      {!loading && profile && plan && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold mb-3">Reading Learning Profile</h3>
              {latestReadingEvidence ? (
                <>
                  <div className="text-3xl font-black text-emerald-200">
                    {latestReadingEvidence.correct} / {latestReadingEvidence.total} ·{" "}
                    {latestReadingEvidence.accuracyPercent}%
                  </div>
                  <p className="text-xs text-white/45 mt-2">
                    {profile.skills.reading.evidenceCount} 筆已完成 Diagnostic 證據
                  </p>
                </>
              ) : (
                <p className="text-white/55">尚無有效 Reading Diagnostic 證據。</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold mb-3">Daily Plan</h3>
              {plan.status === "ready" && plan.focusLevel ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-black text-sky-200">
                      {plan.totalMinutes} 分鐘
                    </span>
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-200">
                      {plan.focusLevel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {plan.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl bg-black/15 px-3 py-2 text-sm text-white/65"
                      >
                        {task.minutes} 分鐘 · {task.type}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-amber-200/80">
                  先完成 Reading Diagnostic，才會建立每日計畫。
                </p>
              )}
            </div>
          </div>

          {plan.status === "ready" && !practice && !practiceResult && (
            <button
              type="button"
              onClick={startPractice}
              disabled={startingPractice}
              className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {startingPractice
                ? "建立練習會話中…"
                : "開始今日 Reading Practice"}
            </button>
          )}

          {practice && currentQuestion && currentPassage && !practiceResult && (
            <div className="grid lg:grid-cols-5 gap-6">
              <article className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-wider text-violet-300 mb-2">
                  {practice.practice.focusLevel} practice
                </div>
                <h3 className="text-xl font-bold mb-4">{currentPassage.title}</h3>
                <p className="text-white/70 leading-8">{currentPassage.content}</p>
              </article>

              <div className="lg:col-span-2">
                <div className="text-xs text-white/40 mb-2">
                  {currentQuestion.questionType} · {questionIndex + 1} /{" "}
                  {practice.practice.questions.length}
                </div>
                <h3 className="text-lg font-bold mb-4">
                  {currentQuestion.prompt}
                </h3>
                <div
                  role="radiogroup"
                  aria-label="Practice options"
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, optionIndex) => {
                    const selected = selectedAnswer === optionIndex;
                    const correct =
                      feedback?.correctAnswerIndex === optionIndex;
                    const wrong = Boolean(feedback && selected && !feedback.correct);
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={Boolean(feedback)}
                        key={`${currentQuestion.id}:${optionIndex}`}
                        onClick={() => setSelectedAnswer(optionIndex)}
                        className={`w-full rounded-xl border px-4 py-3 text-left ${
                          correct
                            ? "border-emerald-400/60 bg-emerald-500/20"
                            : wrong
                              ? "border-rose-400/60 bg-rose-500/20"
                              : selected
                                ? "border-violet-400/60 bg-violet-500/20"
                                : "border-white/10 bg-white/5"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {feedback && (
                  <div className="mt-4 rounded-xl bg-emerald-500/15 p-4 text-sm text-emerald-100">
                    <div className="font-bold mb-1">
                      {feedback.correct ? "練習答對了" : "練習答錯了"}
                    </div>
                    <p>{feedback.explanation}</p>
                  </div>
                )}

                <div className="mt-4">
                  {!feedback ? (
                    <button
                      type="button"
                      onClick={submitPracticeAnswer}
                      disabled={
                        selectedAnswer === null || submittingPractice
                      }
                      className="w-full rounded-xl bg-violet-500 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submittingPractice ? "提交中…" : "提交練習答案"}
                    </button>
                  ) : (
                    !practiceResult && (
                      <button
                        type="button"
                        onClick={continuePractice}
                        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
                      >
                        下一題練習
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {practiceResult && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <div className="text-2xl font-black">
                Practice Score：{practiceResult.correct} / {practiceResult.total} ·{" "}
                {practiceResult.accuracyPercent}%
              </div>
              <div className="mt-2 text-sm font-bold text-amber-200">
                不列入 Diagnostic Profile
              </div>
              <p className="mt-2 text-sm text-white/55">
                {practiceResult.notice}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl bg-rose-500/15 p-4 text-sm text-rose-100"
        >
          {error}
        </div>
      )}
    </section>
  );
}
