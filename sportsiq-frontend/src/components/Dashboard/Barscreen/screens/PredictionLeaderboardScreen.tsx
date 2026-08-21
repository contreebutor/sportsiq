import { useEffect, useState } from "react";
import { C } from "../theme";
import type { PredictionGame } from "../types";
import { LiveBadge } from "../ui/LiveBadge";

interface Props {
  games: PredictionGame[];
  qrDataUrl: string;
}

const ROTATION_INTERVAL_MS = 12_000;

export function PredictionLeaderboardScreen({ games }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (games.length <= 1) {
      setActiveIndex(0);
      return;
    }
    const iv = setInterval(() => {
      setActiveIndex((i) => (i + 1) % games.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [games.length]);

  const game = games[Math.min(activeIndex, Math.max(games.length - 1, 0))];
  if (!game) return null;

  const { home, away } = game.sports_game.teams;
  const homeColor = home.primary_color ?? "#334155";
  const awayColor = away.primary_color ?? "#334155";

  const totalVotes = game.picks.reduce(
    (sum, p) => sum + p.yes_votes + p.no_votes,
    0
  );

  return (
    <div
      className="h-full flex flex-col font-['Lexend'] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top left, ${awayColor}44 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${homeColor}44 0%, transparent 50%), #060d1c`,
      }}
    >
      {/* HEADER */}
      <div className="shrink-0 flex items-center justify-between bg-black/30 border-b border-white/[0.07] px-12 py-4">
        <div className="flex items-center gap-6">
          <div className="text-[38px] font-black text-slate-50 -tracking-[1px]">
            Sports<span className="text-[#5545D3]">IQ</span>
          </div>
          <LiveBadge label="PREDICTIONS LIVE" />
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-slate-500 text-[13px] font-bold tracking-[2px]">
              PICKS
            </div>
            <div className="text-slate-50 text-[28px] font-black tabular-nums">
              {totalVotes || "—"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {away.logo_url && (
              <img
                src={away.logo_url}
                alt={away.key}
                className="w-10 h-10 object-contain"
              />
            )}
            <span className="text-slate-400 text-2xl font-bold">VS</span>
            {home.logo_url && (
              <img
                src={home.logo_url}
                alt={home.key}
                className="w-10 h-10 object-contain"
              />
            )}
          </div>
          {games.length > 1 && (
            <div className="flex items-center gap-1">
              {games.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-6 h-2 bg-[#5545D3]"
                      : "w-2 h-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN — prediction questions */}
      <div className="flex-1 p-10 overflow-auto">
        <div className="text-slate-50 text-xl font-extrabold tracking-[3px] mb-2">
          LIVE PREDICTIONS
        </div>
        <div
          className="w-20 h-[3px] rounded-sm mb-8"
          style={{
            background: `linear-gradient(90deg, ${C.brand}, ${C.teal})`,
          }}
        />

        <div className="flex flex-col gap-4">
          {game.picks.map((pick) => {
            const total = pick.yes_votes + pick.no_votes;
            const yesPct =
              total > 0 ? Math.round((pick.yes_votes / total) * 100) : 0;
            const noPct = total > 0 ? 100 - yesPct : 0;
            const resolved = pick.status === "resolved";

            return (
              <div
                key={pick.id}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-50 text-lg font-bold">
                    {pick.pick_question}
                  </span>
                  {resolved && pick.correct_answer && (
                    <span className="text-green-500 text-sm font-bold tracking-wider">
                      ANSWER: {pick.correct_answer.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Split vote bar */}
                <div className="flex w-full h-5 rounded-full overflow-hidden bg-white/[0.06] mb-2">
                  {total > 0 ? (
                    <>
                      <div
                        className="h-full transition-all duration-700 flex items-center justify-end pr-2"
                        style={{
                          width: `${yesPct}%`,
                          background: "#22C55E",
                        }}
                      >
                        {yesPct >= 10 && (
                          <span className="text-black/80 text-xs font-black tabular-nums">
                            {yesPct}%
                          </span>
                        )}
                      </div>
                      <div
                        className="h-full transition-all duration-700 flex items-center justify-start pl-2"
                        style={{
                          width: `${noPct}%`,
                          background: "#EF4444",
                        }}
                      >
                        {noPct >= 10 && (
                          <span className="text-black/80 text-xs font-black tabular-nums">
                            {noPct}%
                          </span>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-500 font-bold">
                    YES · {pick.yes_votes}{" "}
                    <span className="text-slate-500 font-normal">
                      {pick.yes_votes === 1 ? "pick" : "picks"}
                    </span>
                  </span>
                  {resolved && (
                    <span className="text-amber-500 text-xs font-bold tracking-wider">
                      RESOLVED
                    </span>
                  )}
                  <span className="text-red-500 font-bold">
                    <span className="text-slate-500 font-normal">
                      {pick.no_votes === 1 ? "pick" : "picks"}
                    </span>{" "}
                    {pick.no_votes} · NO
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
