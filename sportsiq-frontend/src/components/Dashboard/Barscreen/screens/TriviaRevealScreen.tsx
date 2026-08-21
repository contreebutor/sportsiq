import { C } from "../theme";
import { pct } from "../utils";
import type { TriviaQuestion, TriviaReveal, LeaderboardEntry } from "../types";
import { LeaderboardRow } from "../ui/LeaderboardRow";

interface Props {
  triviaQ: TriviaQuestion;
  triviaRev: TriviaReveal;
  leaderboard: LeaderboardEntry[];
}

export function TriviaRevealScreen({ triviaQ, triviaRev, leaderboard }: Props) {
  const total = triviaRev.totalAnswers;
  const correctCount = triviaRev.answerCounts[triviaRev.correctAnswer];
  const correctPct = pct(correctCount, total);

  return (
    <div
      className="h-full flex flex-col font-['Lexend'] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top left, rgba(34,197,94,0.10) 0%, transparent 55%), ${C.bgOuter}`,
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-black/30 border-b border-white/[0.07] px-16 py-4 shrink-0">
        <div className="flex items-center gap-6">
          <div
            className="rounded-xl py-2 px-[22px] text-[#228C88] text-xl font-extrabold tracking-[2px]"
            style={{
              background: C.tealAlpha,
              border: `1px solid ${C.teal}`,
            }}
          >
            ANSWER REVEALED
          </div>
          <div className="text-slate-500 text-xl">
            Q{triviaQ.questionNumber} / {triviaQ.totalQuestions}
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-500 text-4xl font-black tabular-nums">{correctPct}%</div>
          <div className="text-slate-500 text-sm tracking-[1.5px]">GOT IT RIGHT</div>
        </div>
      </div>

      {/* Body: question+answers */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col py-9 px-16 gap-5 h-full">
          <div className="text-slate-400 text-[28px] font-['Lexend'] leading-[1.4] shrink-0">
            {triviaQ.question}
          </div>

          <div className="flex-1 flex flex-col gap-2.5">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const isCorrect = opt === triviaRev.correctAnswer;
              const p = pct(triviaRev.answerCounts[opt], total);
              return (
                <div
                  key={opt}
                  className="relative flex-1 flex items-center gap-5 rounded-2xl px-7 overflow-hidden transition-all duration-400 ease-in-out"
                  style={{
                    background: isCorrect ? "rgba(34,197,94,0.08)" : C.bgPanel,
                    border: `2px solid ${isCorrect ? C.green : C.cardBorder}`,
                    boxShadow: isCorrect ? "0 0 40px rgba(34,197,94,0.15)" : "none",
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-2xl transition-[width] duration-800 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      width: `${p}%`,
                      background: isCorrect ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.05)",
                    }}
                  />
                  <div
                    className="relative shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center font-black"
                    style={{
                      background: isCorrect ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)",
                      color: isCorrect ? C.green : C.faint,
                      fontSize: isCorrect ? 30 : 24,
                    }}
                  >
                    {isCorrect ? "✓" : opt}
                  </div>
                  <div
                    className="relative flex-1 font-['Lexend'] leading-[1.3]"
                    style={{
                      color: isCorrect ? C.text : C.muted,
                      fontSize: isCorrect ? 28 : 24,
                      fontWeight: isCorrect ? 800 : 500,
                    }}
                  >
                    {triviaQ.options[opt]}
                  </div>
                  <div
                    className="relative shrink-0 text-[34px] font-black tabular-nums"
                    style={{ color: isCorrect ? C.green : C.faint }}
                  >
                    {p}%
                  </div>
                </div>
              );
            })}
          </div>

          {triviaRev.funFact && (
            <div
              className="rounded-[14px] py-4 px-6 flex gap-4 items-start shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(85,69,211,0.15), rgba(34,140,136,0.10))",
                border: "1px solid rgba(85,69,211,0.25)",
              }}
            >
              <span className="text-[26px] shrink-0">💡</span>
              <div className="text-slate-400 text-[21px] font-['Lexend'] leading-normal">
                {triviaRev.funFact}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
