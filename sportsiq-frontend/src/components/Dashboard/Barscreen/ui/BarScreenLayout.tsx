import { C } from "../theme";
import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardEntry } from "../types";

interface Props {
  /** LEFT sidebar — live game leaderboard (or final standings during intermission). */
  liveGameLeaderboard: LeaderboardEntry[];
  liveGameLeaderboardTitle: string;
  /** RIGHT sidebar — today's cumulative leaderboard. */
  todayLeaderboard: LeaderboardEntry[];
  /** QR code data URL shown at the bottom of the right sidebar. */
  qrDataUrl: string;
  /** Center content. */
  children: React.ReactNode;
}

/**
 * Persistent 3-column shell for the bar screen. Left and right columns always
 * show their respective leaderboards (consistent placement). The center
 * switches between game content and the national leaderboard during
 * intermission.
 */
export function BarScreenLayout({
  liveGameLeaderboard,
  liveGameLeaderboardTitle,
  todayLeaderboard,
  qrDataUrl,
  children,
}: Props) {
  return (
    <div className="h-full flex">
      {/* LEFT — live game leaderboard (always visible) */}
      <LeaderboardColumn
        title={liveGameLeaderboardTitle}
        entries={liveGameLeaderboard}
        emptyText="No players yet"
        side="left"
      />

      {/* CENTER — game content or national leaderboard */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">{children}</div>

      {/* RIGHT — today's cumulative leaderboard (always visible) */}
      <LeaderboardColumn
        title="TODAY"
        entries={todayLeaderboard}
        emptyText="No activity yet today"
        side="right"
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}

interface ColumnProps {
  title: string;
  entries: LeaderboardEntry[];
  emptyText: string;
  side: "left" | "right";
  qrDataUrl?: string;
}

function LeaderboardColumn({ title, entries, emptyText, side, qrDataUrl }: ColumnProps) {
  const borderClass =
    side === "left"
      ? "border-r border-white/[0.06]"
      : "border-l border-white/[0.06]";
  const gradient =
    side === "left"
      ? `linear-gradient(90deg, ${C.brand}, ${C.teal})`
      : `linear-gradient(90deg, ${C.teal}, ${C.brand})`;

  return (
    <div
      className={`shrink-0 w-[360px] flex flex-col ${borderClass} py-4 px-3 overflow-hidden`}
      style={{ background: "rgba(11,34,48,0.88)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="text-slate-50 text-xs font-extrabold tracking-[2px] whitespace-nowrap">
          {title}
        </div>
        <div
          className="flex-1 h-[2px] rounded-sm"
          style={{ background: gradient }}
        />
      </div>

      {/* Full-height scrolling list — show as many entries as fit */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
        {entries.length > 0 ? (
          entries.map((e, i) => (
            <LeaderboardRow
              key={`${e.rank}-${e.displayName}`}
              entry={e}
              index={i}
              size="small"
            />
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-500 text-sm text-center">
              {emptyText}
            </div>
          </div>
        )}
      </div>

      {/* QR code at bottom (right column only) */}
      {qrDataUrl && (
        <div className="shrink-0 mt-3 flex flex-col items-center gap-1.5 pt-3 border-t border-white/[0.06]">
          <div className="text-slate-500 text-[10px] font-bold tracking-[2px]">
            SCAN TO PLAY
          </div>
          <div
            className="w-full bg-[#0B2230] rounded-lg p-2"
            style={{ border: `1px solid ${C.border}` }}
          >
            <img
              src={qrDataUrl}
              alt="QR"
              className="w-full aspect-square block rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
