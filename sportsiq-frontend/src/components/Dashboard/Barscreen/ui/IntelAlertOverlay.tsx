import type { IntelligenceAlert } from "../types";

export function IntelAlertOverlay({ alert }: { alert: IntelligenceAlert }) {
  return (
    <div className="fixed top-9 left-1/2 -translate-x-1/2 bg-[#0B2230] border-2 border-amber-500 rounded-[20px] py-7 px-14 text-center z-[100] min-w-[640px] shadow-[0_0_80px_rgba(245,158,11,0.19)] animate-[slideDown_0.4s_cubic-bezier(0.4,0,0.2,1)]">
      <div className="text-amber-500 text-xl font-extrabold tracking-[3px] font-['Lexend'] mb-2">
        ⚡ SPORTSIQ INTELLIGENCE ALERT
      </div>
      <div className="text-slate-50 text-[34px] font-bold font-['Lexend'] mb-2">
        {alert.teamName ?? alert.question}
      </div>
      <div className="text-slate-400 text-[26px] font-['Lexend']">
        {Math.round(alert.from * 100)}%
        <span className="text-slate-500 mx-2">→</span>
        {Math.round(alert.to * 100)}%
        <span className={`ml-4 font-extrabold ${alert.direction === "up" ? "text-green-500" : "text-red-500"}`}>
          {alert.direction === "up" ? "▲" : "▼"} {alert.movePct}pts
        </span>
      </div>
    </div>
  );
}
