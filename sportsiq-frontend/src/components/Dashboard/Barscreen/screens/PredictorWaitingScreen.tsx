import { C } from "../theme";
import { teamGradient } from "../utils";
import type { PredictorQuestion, PredictorCrowdSplit } from "../types";
import { LiveBadge } from "../ui/LiveBadge";

interface Props {
  predQ: PredictorQuestion;
  predCrowd: PredictorCrowdSplit;
  predCurrentStat: number | null;
  qrDataUrl: string;
  roomCode: string;
}

export function PredictorWaitingScreen({ predQ, predCrowd, predCurrentStat, qrDataUrl, roomCode }: Props) {
  const colorA = predQ.teamColorHome ?? C.brand;
  const colorB = predQ.teamColorAway ?? C.teal;

  const current = predCurrentStat ?? 0;
  const target = predQ.statLine;
  const fillPct = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, target - current);

  const gameTime = "Q2 8:34";

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: teamGradient(colorA, colorB) }}
    >
      {/* Header */}
      <div className="shrink-0 pt-14 px-20 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <LiveBadge label="LIVE TRACKING" />
          <div className="text-slate-500 text-[22px] font-['Lexend']">{gameTime}</div>
        </div>
        <div className="text-center flex-1 px-10">
          <div className="text-slate-50 text-[64px] font-black font-['Lexend'] leading-none">
            {predQ.playerName}
          </div>
          <div className="text-slate-400 text-2xl font-['Lexend'] mt-1.5">
            {predQ.statLabel}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-500 text-[22px] font-['Lexend'] mb-1">{gameTime}</div>
          <div className="text-orange-500 text-[26px] font-bold font-['Lexend']">
            needs {remaining} more to go OVER
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-row px-[60px] items-center gap-0">
        {/* UNDER crowd */}
        <div className="w-[260px] flex flex-col items-center gap-2">
          <div className="text-[#228C88] text-[52px] font-black font-['Lexend']">UNDER ↓</div>
          <div className="text-slate-50 text-[96px] font-black font-['Lexend'] tabular-nums leading-none">
            {predCrowd.lessPercent}%
          </div>
          <div className="text-slate-500 text-2xl font-['Lexend']">{predCrowd.less} players</div>
        </div>

        {/* Center: big numbers + rope */}
        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="text-slate-50 text-[128px] font-black font-['Lexend'] tabular-nums leading-none">
              {current}
            </div>
            <div className="text-slate-500 text-[64px] font-light">→</div>
            <div className="text-slate-400 text-[128px] font-black font-['Lexend'] tabular-nums leading-none">
              {target}
            </div>
          </div>

          {/* The rope */}
          <div className="w-full relative">
            <div className="w-full h-[22px] bg-white/[0.08] rounded-[11px] overflow-visible relative">
              <div
                className="absolute top-0 left-0 h-full rounded-[11px]"
                style={{
                  width: `${fillPct}%`,
                  background: `linear-gradient(90deg, ${C.teal}, ${C.green})`,
                  // @ts-ignore CSS custom property for animation
                  "--rope-fill-pct": `${fillPct}%`,
                  animation: "bar-rope-fill 1.2s cubic-bezier(0.4,0,0.2,1) both",
                }}
              />
              <div
                className="absolute top-1/2 w-[60px] h-[60px] rounded-full flex items-center justify-center z-[2]"
                style={{
                  left: `${fillPct}%`,
                  transform: "translate(-50%, -50%)",
                  background: C.green,
                  boxShadow: `0 0 24px 8px ${C.green}88, 0 0 48px 16px ${C.green}44`,
                  animation: "bar-knot-sway 2.4s ease-in-out infinite",
                }}
              >
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div
                className="absolute bottom-[40px] bg-[#110E2A] border-2 border-green-500 rounded-[10px] py-1 px-3.5 text-green-500 text-2xl font-black font-['Lexend'] tabular-nums whitespace-nowrap z-[3]"
                style={{
                  left: `${fillPct}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {current}
              </div>
              <div className="absolute -top-2 right-0 w-1 h-[38px] bg-slate-50 rounded-sm" />
            </div>
          </div>

          <div className="text-orange-500 text-[28px] font-bold font-['Lexend'] text-center">
            {remaining} more {predQ.statLabel.toLowerCase()} needed for OVER
          </div>
        </div>

        {/* OVER crowd */}
        <div className="w-[260px] flex flex-col items-center gap-2">
          <div className="text-[#5545D3] text-[52px] font-black font-['Lexend']">OVER ↑</div>
          <div className="text-slate-50 text-[96px] font-black font-['Lexend'] tabular-nums leading-none">
            {predCrowd.morePercent}%
          </div>
          <div className="text-slate-500 text-2xl font-['Lexend']">{predCrowd.more} players</div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-20 pb-[52px] flex justify-between items-end">
        <div className="text-slate-500 text-[22px] font-['Lexend'] leading-relaxed">
          Open SportsIQ to join future rounds · Picks are locked · Bar plays count 2×
        </div>
        <div
          className="flex items-center gap-4 bg-[rgba(11,34,48,0.85)] border border-white/[0.07] rounded-2xl py-3.5 px-[22px] backdrop-blur-[8px]"
        >
          {qrDataUrl && (
            <img src={qrDataUrl} alt="Join" className="w-[72px] h-[72px] rounded-lg" />
          )}
          {/* Room code — commented out for now
          <div>
            <div className="text-slate-500 text-[13px] font-['Lexend'] tracking-[1px]">JOIN</div>
            <div className="text-slate-50 text-[26px] font-black font-['Lexend'] tracking-[5px] tabular-nums">
              {roomCode}
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
