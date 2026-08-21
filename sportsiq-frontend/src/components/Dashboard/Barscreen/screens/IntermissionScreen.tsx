import { C } from "../theme";
import type { BarRankInfo, LeaderboardEntry } from "../types";
import { LeaderboardRow } from "../ui/LeaderboardRow";

interface Props {
  nationalLeaderboard: LeaderboardEntry[];
  barRank: BarRankInfo | null;
  /** Seconds remaining until the next game (intermission countdown). */
  countdown: number;
  /** Optional QR code for joining (shown small in the corner). */
  qrDataUrl?: string;
}

/**
 * Center content during the 1-minute intermission between games.
 * Shows the national leaderboard with the bar's rank prominently at the top.
 */
export function IntermissionScreen({
  nationalLeaderboard,
  barRank,
  countdown,
  qrDataUrl,
}: Props) {
  return (
    <div
      className="h-full flex flex-col font-['Lexend'] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top left, rgba(85,69,211,0.30) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(34,140,136,0.24) 0%, transparent 50%), #060d1c`,
      }}
    >
      {/* Header — countdown + label */}
      <div className="shrink-0 flex items-center justify-between bg-black/30 border-b border-white/[0.07] px-10 py-4">
        <div>
          <div
            className="text-slate-500 text-xs font-extrabold tracking-[3px] uppercase mb-1"
          >
            Intermission
          </div>
          <div className="text-slate-50 text-[28px] font-black -tracking-[0.5px]">
            National Leaderboard
          </div>
        </div>
        {countdown > 0 && (
          <div className="text-right">
            <div className="text-slate-500 text-xs font-bold tracking-[2px]">
              NEXT GAME IN
            </div>
            <div
              className="text-[40px] font-black tabular-nums"
              style={{ color: C.teal }}
            >
              {countdown}s
            </div>
          </div>
        )}
      </div>

      {/* Bar rank banner */}
      {barRank && (
        <div className="shrink-0 px-10 py-5 border-b border-white/[0.07]">
          <div
            className="rounded-2xl p-6 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${C.brand}33, ${C.teal}22)`,
              border: `2px solid ${C.border}`,
            }}
          >
            <div>
              <div className="text-slate-300 text-sm font-bold tracking-[2px] uppercase mb-2">
                Your Bar
              </div>
              <div className="text-slate-50 text-[44px] font-black leading-none -tracking-[1px]">
                #{barRank.rank}
                <span className="text-slate-400 text-2xl font-medium ml-3">
                  of {barRank.totalBars} bars playing today
                </span>
              </div>
            </div>
            {qrDataUrl && (
              <div
                className="bg-[#0B2230] rounded-xl p-2"
                style={{ border: `1px solid ${C.border}` }}
              >
                <img
                  src={qrDataUrl}
                  alt="Scan to join"
                  className="w-[110px] h-[110px] block rounded"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* National leaderboard list */}
      <div className="flex-1 px-10 py-5 overflow-hidden flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="text-slate-50 text-lg font-extrabold tracking-[3px]">
            TOP PLAYERS · ALL BARS
          </div>
          <div
            className="flex-1 h-[2px] rounded-sm max-w-[200px]"
            style={{ background: `linear-gradient(90deg, ${C.brand}, ${C.teal})` }}
          />
        </div>

        {nationalLeaderboard.length > 0 ? (
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {nationalLeaderboard.map((entry, i) => (
              <LeaderboardRow
                key={`${entry.rank}-${entry.displayName}`}
                entry={entry}
                index={i}
                size="large"
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-500 text-2xl text-center">
              National leaderboard loading…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
