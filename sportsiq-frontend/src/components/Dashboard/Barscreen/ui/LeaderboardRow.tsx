import type { LeaderboardEntry } from "../types";

interface Props {
  entry: LeaderboardEntry;
  index: number;
  size?: "large" | "small";
}

export function LeaderboardRow({ entry, index, size = "large" }: Props) {
  const isGold = index === 0;
  const isSilver = index === 1;
  const isBronze = index === 2;

  const isLarge = size === "large";

  // Dynamic backgrounds/borders that depend on rank — must stay as inline styles
  const rowBg = isGold
    ? "linear-gradient(90deg, rgba(255,193,7,0.18), rgba(255,193,7,0.06))"
    : isSilver ? "rgba(148,163,184,0.08)"
    : isBronze ? "rgba(205,127,50,0.08)"
    : "rgba(255,255,255,0.03)";

  const rowBorder = isGold ? "rgba(255,193,7,0.35)"
    : isSilver ? "rgba(148,163,184,0.2)"
    : isBronze ? "rgba(205,127,50,0.2)"
    : "rgba(255,255,255,0.07)";

  const rankColor = isGold ? "#fbbf24" : isBronze ? "#cd7f32" : undefined;

  return (
    <div
      className={`grid items-center rounded-lg font-['Lexend'] shrink-0 ${
        isLarge
          ? "grid-cols-[40px_1fr_auto] px-5 py-3.5 animate-[fadeIn_0.4s_ease_both]"
          : "grid-cols-[32px_1fr_auto] px-3 py-2"
      }`}
      style={{
        background: rowBg,
        border: `1px solid ${rowBorder}`,
        ...(isLarge ? { animationDelay: `${index * 0.06}s` } : {}),
      }}
    >
      <span
        className={`font-extrabold ${isLarge ? "text-xl" : "text-sm"} ${!rankColor ? "text-slate-500" : ""}`}
        style={rankColor ? { color: rankColor } : undefined}
      >
        #{entry.rank}
      </span>
      <span
        className={`overflow-hidden text-ellipsis whitespace-nowrap ${
          isLarge ? "text-2xl" : "text-base"
        } ${isGold ? "text-slate-50 font-extrabold" : "text-slate-300 font-medium"}`}
      >
        {entry.displayName}
      </span>
      <span
        className={`font-black tabular-nums text-right ${
          isLarge ? "text-2xl" : "text-base"
        } ${isGold ? "text-amber-400" : "text-slate-300"}`}
      >
        {entry.totalPoints.toLocaleString()}
        {isLarge && <span className="text-sm font-semibold"> IQ PTS</span>}
      </span>
    </div>
  );
}
