import { C } from "../theme";
import { pct } from "../utils";
import type { TriviaQuestion, AnswerCounts } from "../types";
import { LiveBadge } from "../ui/LiveBadge";

interface Props {
  triviaQ: TriviaQuestion;
  answerCounts: AnswerCounts | null;
  totalAnswers: number;
  countdown: number;
}

export function TriviaQuestionScreen({ triviaQ, answerCounts, totalAnswers, countdown }: Props) {
  const total = totalAnswers;
  const urgent = countdown <= 5;
  const dots = Array.from({ length: triviaQ.totalQuestions }, (_, i) => i);

  return (
    <div
      className="h-full flex flex-col font-['Lexend'] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top, rgba(85,69,211,0.18) 0%, transparent 60%), ${C.bgOuter}`,
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-black/30 border-b border-white/[0.07] px-16 py-4 shrink-0">
        <div className="flex items-center gap-7">
          <LiveBadge label="LIVE TRIVIA" />
          <div className="flex gap-[5px] items-center">
            {dots.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded transition-all duration-300 ease-in-out"
                style={{
                  width: i === triviaQ.questionNumber - 1 ? 22 : 8,
                  background:
                    i < triviaQ.questionNumber - 1
                      ? C.teal
                      : i === triviaQ.questionNumber - 1
                        ? C.brand
                        : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
          <div className="text-slate-500 text-xl font-['Lexend']">
            Q{triviaQ.questionNumber} / {triviaQ.totalQuestions}
          </div>
        </div>

        <div
          className="rounded-[20px] py-1.5 px-10 transition-all duration-300 ease-in-out"
          style={{
            background: urgent ? C.redAlpha : "rgba(85,69,211,0.20)",
            border: `2px solid ${urgent ? C.red : C.brand}`,
          }}
        >
          <span
            className="text-[72px] font-black font-['Lexend'] tabular-nums leading-none"
            style={{
              color: urgent ? C.red : C.text,
              animation: urgent ? "pulse 0.6s ease infinite" : "none",
            }}
          >
            {countdown}
          </span>
        </div>

        <div className="text-right">
          <div className="text-slate-50 text-[32px] font-extrabold tabular-nums">{total}</div>
          <div className="text-slate-500 text-sm tracking-[1.5px]">ANSWERING</div>
        </div>
      </div>

      {/* Question */}
      <div className="shrink-0 pt-8 pb-5 px-20">
        <div className="text-[58px] font-extrabold text-slate-50 leading-[1.25] font-['Lexend']">
          {triviaQ.question}
        </div>
      </div>

      {/* Answer cards */}
      <div className="flex-1 flex flex-col px-20 pb-8 gap-3.5 overflow-hidden">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const p = total > 0 && answerCounts ? pct(answerCounts[opt], total) : 0;
          return (
            <div
              key={opt}
              className="relative flex-1 flex items-center gap-6 bg-[#110E2A] border border-white/[0.07] rounded-[18px] px-9 overflow-hidden"
            >
              <div
                className="absolute inset-y-0 left-0 bg-[rgba(85,69,211,0.28)] rounded-[18px] transition-[width] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${p}%` }}
              />
              <div className="relative shrink-0 w-16 h-16 bg-white/[0.08] rounded-[14px] flex items-center justify-center text-slate-400 text-[28px] font-black">
                {opt}
              </div>
              <div className="relative flex-1 text-slate-50 text-[30px] font-semibold font-['Lexend'] leading-[1.3]">
                {triviaQ.options[opt]}
              </div>
              {total > 0 && (
                <div className="relative shrink-0 text-slate-400 text-[38px] font-black tabular-nums">
                  {p}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
