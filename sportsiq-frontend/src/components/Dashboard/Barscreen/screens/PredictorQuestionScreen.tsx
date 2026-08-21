import { C } from "../theme";
import { teamGradient } from "../utils";
import type { PredictorQuestion, PredictorCrowdSplit } from "../types";
import { LiveBadge } from "../ui/LiveBadge";

interface Props {
  predQ: PredictorQuestion;
  predCrowd: PredictorCrowdSplit | null;
  countdown: number;
  qrDataUrl: string;
  roomCode: string;
}

export function PredictorQuestionScreen({ predQ, predCrowd, countdown, qrDataUrl, roomCode }: Props) {
  const crowd = predCrowd;
  const probPct = Math.round(predQ.sportsiqProbability * 100);
  const colorA = predQ.teamColorHome ?? C.brand;
  const colorB = predQ.teamColorAway ?? C.teal;

  const circumference = 2 * Math.PI * 44;
  const totalSeconds = 60;
  const dashOffset = circumference * (1 - countdown / totalSeconds);

  const overPct = crowd ? crowd.morePercent : 68;
  const totalPicks = crowd ? crowd.more + crowd.less : 0;
  const overIsWinning = (crowd?.morePercent ?? 68) >= 50;

  return (
    <div
      className="h-full grid grid-cols-[1fr_1.4fr_320px] font-['Lexend'] overflow-hidden"
      style={{ background: teamGradient(colorA, colorB) }}
    >
      {/* LEFT COL — player identity */}
      <div className="border-r border-white/[0.07] flex flex-col justify-center px-12 py-14 gap-5">
        <div className="mb-2">
          <LiveBadge label="LIVE NOW" />
        </div>
        <div className="text-slate-500 text-lg font-bold tracking-[2px] uppercase font-['Lexend']">
          {predQ.teamName}
        </div>
        <div className="text-slate-50 text-[88px] font-black font-['Lexend'] tracking-[-3px] leading-[0.92]">
          {predQ.playerName}
        </div>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-indigo-400 text-[72px] font-black font-['Lexend'] tabular-nums">
            {predQ.statLine}
          </span>
          <span className="text-slate-400 text-[26px] font-['Lexend']">
            {predQ.statLabel}
          </span>
        </div>
        <div className="border-l-4 border-indigo-400 bg-indigo-500/[0.08] rounded-r-xl py-3.5 px-5 text-slate-400 text-xl font-['Lexend'] leading-relaxed">
          Has cleared this line in {probPct} of recent games
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: C.amber, boxShadow: `0 0 8px ${C.amber}` }}
          />
          <span className="text-amber-500 text-lg font-bold font-['Lexend']">
            SportsIQ Signal:{" "}
            <span className="font-medium">
              Moderate Lean {probPct >= 50 ? "OVER" : "UNDER"}
            </span>
          </span>
        </div>
      </div>

      {/* CENTER COL — crowd split hero */}
      <div className="border-r border-white/[0.07] flex flex-col justify-center px-12 py-14 gap-7">
        <div className="text-slate-500 text-[26px] font-bold tracking-[3px] uppercase font-['Lexend'] text-center">
          {overIsWinning ? "OVER" : "UNDER"} leading
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-gradient-to-br from-indigo-500/[0.18] to-indigo-500/[0.06] border-2 border-indigo-500/50 rounded-3xl py-7 px-6 text-center">
            <div className="text-indigo-400 text-[32px] font-bold font-['Lexend'] mb-2">
              OVER ↑
            </div>
            <div className="text-slate-50 text-[96px] font-black font-['Lexend'] tabular-nums leading-none">
              {crowd ? crowd.morePercent : "—"}%
            </div>
            <div className="text-slate-500 text-xl font-['Lexend'] mt-2">
              {crowd ? crowd.more : 0} players
            </div>
          </div>
          <div className="flex-1 bg-white/[0.03] border-2 border-white/10 rounded-3xl py-7 px-6 text-center">
            <div className="text-slate-400 text-[32px] font-bold font-['Lexend'] mb-2">
              UNDER ↓
            </div>
            <div className="text-slate-50 text-[96px] font-black font-['Lexend'] tabular-nums leading-none">
              {crowd ? crowd.lessPercent : "—"}%
            </div>
            <div className="text-slate-500 text-xl font-['Lexend'] mt-2">
              {crowd ? crowd.less : 0} players
            </div>
          </div>
        </div>

        <div>
          <div className="h-4 rounded-lg bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-lg transition-[width] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: `${overPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 font-['Lexend']">
            <span className="text-indigo-400 text-lg font-bold">
              OVER {overIsWinning ? "winning" : ""}
            </span>
            <span className="text-slate-500 text-lg">
              {totalPicks} total picks
            </span>
          </div>
        </div>

        <div className="text-center text-slate-500 text-xl font-['Lexend'] bg-black/20 rounded-xl py-3.5 px-3.5">
          Scan to pick from your phone · Free to play
        </div>
      </div>

      {/* RIGHT COL — timer + QR */}
      <div className="flex flex-col items-center justify-center gap-8 py-12 px-7">
        <div className="text-slate-500 text-sm font-extrabold tracking-[3px] uppercase font-['Lexend']">
          LOCKS IN
        </div>

        <div className="relative w-40 h-40">
          <svg width="160" height="160" className="absolute top-0 left-0">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke="#ef4444" strokeWidth="8"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${dashOffset}`}
              transform="rotate(-90 80 80)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-500 text-[42px] font-black font-['Lexend'] tabular-nums">
              {countdown}
            </span>
          </div>
        </div>

        <div className="w-4/5 h-px bg-white/[0.08]" />

        <div className="text-slate-500 text-[13px] font-extrabold tracking-[3px] uppercase font-['Lexend']">
          SCAN TO JOIN
        </div>

        {qrDataUrl && (
          <div className="bg-[#0B2230] rounded-2xl p-3 border-2 border-[rgba(85,69,211,0.35)]">
            <img src={qrDataUrl} alt="Join" className="w-[120px] h-[120px] block rounded-md" />
          </div>
        )}

        {/* Room code — commented out for now
        <div className="text-slate-50 text-[28px] font-black tracking-[8px] font-['Lexend'] tabular-nums">
          {roomCode}
        </div>
        */}
      </div>
    </div>
  );
}
