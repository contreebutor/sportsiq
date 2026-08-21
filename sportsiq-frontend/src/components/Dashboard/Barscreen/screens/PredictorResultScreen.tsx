import { C } from "../theme";
import { teamGradient } from "../utils";
import type { PredictorQuestion, PredictorResolved, PredictorCrowdSplit } from "../types";

interface Props {
  predQ: PredictorQuestion;
  predResolved: PredictorResolved;
  predCrowd: PredictorCrowdSplit | null;
}

export function PredictorResultScreen({ predQ, predResolved, predCrowd }: Props) {
  const res = predResolved;
  const isMore = res.result === "more";
  const colorA = predQ.teamColorHome ?? C.brand;
  const colorB = predQ.teamColorAway ?? C.teal;
  const winColor = isMore ? C.brand : C.teal;

  return (
    <div
      className="px-20 py-16 h-full flex flex-col justify-center items-center gap-9 text-center animate-[fadeIn_0.6s_ease]"
      style={{ background: teamGradient(colorA, colorB) }}
    >
      <div className="text-[96px]">{isMore ? "📈" : "📉"}</div>

      <div>
        <div
          className="text-[88px] font-black font-['Lexend'] leading-none mb-3"
          style={{ color: winColor }}
        >
          {isMore ? "OVER" : "UNDER"} WINS
        </div>
        <div className="text-slate-400 text-[40px] font-['Lexend']">
          {predQ.playerName} — {res.finalStat} {predQ.statLabel}
        </div>
      </div>

      <div className="flex gap-6">
        {[
          { label: "🤙 Wise Guy", pts: res.wiseGuyPoints, color: C.orange },
          { label: "🔥 Heat Check", pts: res.heatCheckPoints, color: C.red },
          { label: "🧱 Chalk", pts: res.chalkPoints, color: C.muted },
        ].map(({ label, pts, color }) => (
          <div
            key={label}
            className="bg-[#110E2A] border border-white/[0.07] rounded-[20px] py-6 px-12 text-center min-w-[200px]"
          >
            <div
              className="text-2xl font-bold font-['Lexend'] mb-2"
              style={{ color }}
            >
              {label}
            </div>
            <div className="text-slate-50 text-[44px] font-black font-['Lexend'] tabular-nums">
              +{pts.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {predCrowd && (
        <div className="bg-black/30 rounded-[14px] py-4 px-9">
          <span className="text-slate-500 text-[28px] font-['Lexend']">
            <span className="text-slate-50 font-extrabold">
              {isMore ? predCrowd.morePercent : predCrowd.lessPercent}%
            </span>{" "}
            of players called it right
          </span>
        </div>
      )}
    </div>
  );
}
