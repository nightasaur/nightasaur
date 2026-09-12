import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AcademyLearn() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState({
    text: "火元素剋制哪個元素？",
    options: ["水元素", "草元素", "冰元素", "雷元素"],
    answer: 1
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{correct: boolean, show: boolean}>({correct: false, show: false});

  const handleSelect = (index: number) => {
    if (!result.show) {
      setSelected(index);
    }
  };

  const handleSubmit = () => {
    if (selected !== null) {
      const correct = selected === question.answer;
      setResult({correct, show: true});
    }
  };

  const handleNext = () => {
    // 模擬下一題
    setQuestion({
      text: "水元素剋制哪個元素？",
      options: ["火元素", "雷元素", "冰元素", "土元素"],
      answer: 0
    });
    setSelected(null);
    setResult({correct: false, show: false});
  };

  const handleFinish = () => {
    alert("課程完成！獲得 50 XP 和 25 金幣");
    navigate("/academy");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">🔥 元素基礎學</h1>
          <div className="text-teal-300">第 1 / 10 題</div>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 w-1/10"></div>
        </div>
      </div>

      <div className="glass-card p-8 mb-8">
        <div className="text-lg font-medium mb-6">{question.text}</div>

        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className={`w-full p-4 rounded-xl text-left ${
                selected === index
                  ? result.show
                    ? index === question.answer
                      ? "bg-green-500/30 border-2 border-green-500"
                      : "bg-red-500/30 border-2 border-red-500"
                    : "bg-teal-500/30 border-2 border-teal-500"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selected === index
                    ? result.show
                      ? index === question.answer
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-teal-500"
                    : "bg-white/10"
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div>{option}</div>
                {result.show && index === question.answer && (
                  <div className="text-green-400">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8">
          {!result.show ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className={`w-full py-4 rounded-xl font-bold text-lg ${
                selected !== null
                  ? "btn-primary bg-gradient-to-r from-teal-500 to-blue-500"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              提交答案
            </button>
          ) : (
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${
                result.correct ? "text-green-400" : "text-red-400"
              }`}>
                {result.correct ? "✅ 答對了！" : "❌ 答錯了"}
              </div>
              <div className="text-white/60 mb-4">
                正確答案: {question.options[question.answer]}
              </div>
              <div className="text-teal-300 font-medium mb-4">
                獲得 {result.correct ? "10" : "5"} XP 和 {result.correct ? "5" : "2"} 金幣
              </div>
              <button
                onClick={handleNext}
                className="btn-primary px-8 py-3 rounded-xl"
              >
                下一題 →
              </button>
              <button
                onClick={handleFinish}
                className="ml-4 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20"
              >
                結束課程
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}