import { C } from "../theme";
import type { LeaderboardEntry } from "../types";
import { LiveBadge } from "../ui/LiveBadge";
import { LeaderboardRow } from "../ui/LeaderboardRow";
import type { LobbyPlayer } from "../hooks/useBarSockets";

interface Props {
  leaderboard: LeaderboardEntry[];
  lobbyActive?: boolean;
  lobbyPlayers?: LobbyPlayer[];
  lobbyCountdown?: number;
  playerCount?: number;
}

export function IdleScreen({
  leaderboard,
  lobbyActive = false,
  lobbyPlayers = [],
  lobbyCountdown = 0,
  playerCount = 0,
}: Props) {
  return (
    <div
      className="h-full flex flex-col font-['Lexend'] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top left, rgba(85,69,211,0.30) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(34,140,136,0.24) 0%, transparent 50%), #060d1c`,
      }}
    >
      {/* TOP HEADER */}
      <div className="shrink-0 flex items-center justify-between bg-black/30 border-b border-white/[0.07] px-12 py-4">
        <div className="text-[38px] font-black text-slate-50 -tracking-[1px]">
          Sports<span className="text-[#5545D3]">IQ</span>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-center">
            <div className="text-slate-500 text-[13px] font-bold tracking-[2px]">
              {lobbyActive ? "IN LOBBY" : "PLAYING TODAY"}
            </div>
            <div className="text-slate-50 text-[28px] font-black tabular-nums">
              {lobbyActive
                ? lobbyPlayers.length
                : playerCount > 0
                  ? playerCount
                  : leaderboard.length > 0
                    ? leaderboard.length
                    : "—"}
            </div>
          </div>
          <div className="w-px h-9 bg-white/10" />
          <div className="text-center">
            <div className="text-slate-500 text-[13px] font-bold tracking-[2px]">
              {lobbyActive ? "STARTING IN" : "NEXT GAME"}
            </div>
            <div className="text-[#228C88] text-[28px] font-black tabular-nums">
              {lobbyActive ? `${lobbyCountdown}s` : "SOON"}
            </div>
          </div>
          <div className="w-px h-9 bg-white/10" />
          <LiveBadge />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leaderboard / lobby */}
        <div className="flex-1 flex flex-col p-12 overflow-hidden">
          <div className="mb-6">
            <div className="text-slate-50 text-xl font-extrabold tracking-[3px]">
              TOP PLAYERS
            </div>
            <div
              className="w-20 h-[3px] mt-2 rounded-sm"
              style={{ background: `linear-gradient(90deg, ${C.brand}, ${C.teal})` }}
            />
          </div>

          {leaderboard.length > 0 ? (
            <div className="flex flex-col gap-2">
              {leaderboard.slice(0, 8).map((e, i) => (
                <LeaderboardRow key={e.rank} entry={e} index={i} size="large" />
              ))}
            </div>
          ) : lobbyActive && lobbyPlayers.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="text-[#228C88] text-lg font-bold tracking-[2px] mb-2">
                PLAYERS JOINING
              </div>
              {lobbyPlayers.slice(0, 8).map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl py-3 px-5"
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5545D3]/30 flex items-center justify-center text-[#5545D3] font-bold text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-slate-50 text-xl font-bold">{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-slate-500 text-[28px] text-center">
                Be the first on the board today
              </div>
            </div>
          )}
        </div>

        {/* CTA panel */}
        <div className="w-[400px] shrink-0 flex flex-col items-center justify-center gap-6 py-12 px-10 text-center border-l border-white/[0.07]">
          <div className="text-[#228C88] text-sm font-extrabold tracking-[3px] uppercase">
            FREE TO PLAY
          </div>

          <div className="text-slate-50 text-[48px] font-black leading-[1.1] -tracking-[1px]">
            Win IQ points<br />
            <span className="text-[#228C88]">at this bar</span><br />
            today
          </div>

          <div className="bg-[rgba(34,140,136,0.12)] border border-[rgba(34,140,136,0.3)] rounded-2xl py-4 px-6 text-slate-400 text-base leading-relaxed">
            Answer trivia questions &amp; predict<br />
            player stats to climb the leaderboard
          </div>

          <div className="flex items-center gap-2.5 text-slate-500 text-base">
            <span className="text-xl">🏆</span>
            Top players earn prizes &amp; bragging rights
          </div>
        </div>
      </div>
    </div>
  );
}
