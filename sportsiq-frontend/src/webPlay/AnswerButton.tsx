import { useEffect, useRef, useState } from "react";
import type { TriviaAnswerSelection } from "./types";

interface Props {
  answer: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  hasResult: boolean;
  selectionData: TriviaAnswerSelection | undefined;
  lockedAtPoints: number | null;
  onPress: () => void;
  disabled: boolean;
  percentage?: number;
  showPercentage?: boolean;
}

function Avatar({ url, size = 28 }: { url: string | null; size?: number }) {
  if (!url) {
    return (
      <div
        className="rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400"
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="rounded-full bg-slate-700 object-cover"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}

export default function AnswerButton({
  answer,
  isSelected,
  isCorrect,
  isWrong,
  hasResult,
  selectionData,
  lockedAtPoints,
  onPress,
  disabled,
  percentage,
  showPercentage,
}: Props) {
  const [revealClass, setRevealClass] = useState<string>("");
  const didRevealRef = useRef(false);

  useEffect(() => {
    if (!hasResult) {
      didRevealRef.current = false;
      setRevealClass("");
      return;
    }
    if (didRevealRef.current) return;
    didRevealRef.current = true;
    if (isCorrect) setRevealClass("wp-bounce");
    else if (isWrong) setRevealClass("wp-shake");
  }, [hasResult, isCorrect, isWrong]);

  const fillBg = isSelected
    ? "rgba(85,69,211,0.35)"
    : isCorrect && hasResult
      ? "rgba(34,197,94,0.2)"
      : "rgba(255,255,255,0.06)";

  const borderColor =
    isCorrect && hasResult
      ? "#22c55e"
      : isWrong
        ? "#ef4444"
        : "#1e293b";

  const leftBorderColor =
    isSelected && !hasResult
      ? "#3b82f6"
      : isCorrect && hasResult
        ? "#22c55e"
        : isWrong
          ? "#ef4444"
          : "#1e293b";

  const bg =
    isCorrect && hasResult
      ? "rgba(20, 83, 45, 0.6)"
      : isWrong
        ? "rgba(127, 29, 29, 0.6)"
        : isSelected && !hasResult
          ? "rgba(30, 58, 138, 0.6)"
          : "rgb(30, 41, 59)";

  const textColor =
    isCorrect && hasResult
      ? "#4ADE80"
      : isWrong
        ? "#FCA5A5"
        : "#F8FAFC";

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`relative w-full rounded-xl overflow-hidden text-left wp-press-scale ${revealClass}`}
      style={{
        minHeight: hasResult ? 52 : 72,
        padding: hasResult ? "10px 16px" : "16px",
        borderRadius: 12,
        borderWidth: (isCorrect && hasResult) || isWrong ? 2 : 1,
        borderStyle: "solid",
        borderColor,
        borderLeftWidth:
          isSelected && !hasResult
            ? 4
            : (isCorrect && hasResult) || isWrong
              ? 2
              : 1,
        borderLeftColor: leftBorderColor,
        backgroundColor: bg,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {/* % fill bar */}
      {showPercentage && percentage != null && percentage > 0 && (
        <div
          className="wp-answer-fill absolute top-0 left-0 bottom-0 rounded-xl"
          style={{
            width: `${percentage}%`,
            backgroundColor: fillBg,
          }}
        />
      )}

      <div className="relative flex items-center gap-2">
        {hasResult && (isCorrect || isWrong) && (
          <span style={{ fontSize: 16 }}>{isCorrect ? "✅" : "❌"}</span>
        )}
        <span
          className="flex-1 text-[15px]"
          style={{ color: textColor, fontWeight: isSelected ? 800 : 600 }}
        >
          {answer}
        </span>
        {showPercentage && percentage != null && (
          <span
            className="text-[11px] font-bold min-w-[32px] text-right"
            style={{ color: isSelected ? "#A89DF8" : "#475569" }}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      {isSelected && !hasResult && lockedAtPoints != null && (
        <div
          className="relative mt-1 text-[11px] font-bold"
          style={{ color: "#f59e0b" }}
        >
          ⚡ {lockedAtPoints.toLocaleString()} pts if you keep this
        </div>
      )}

      {selectionData && selectionData.count > 0 && (
        <div className="relative flex items-center mt-2.5">
          {selectionData.users.slice(0, 5).map((u, i) => (
            <div
              key={u.userId}
              className="rounded-full overflow-hidden bg-slate-700 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                marginLeft: i > 0 ? -8 : 0,
                border: "2px solid #1e293b",
              }}
            >
              <Avatar url={u.avatarUrl} size={28} />
            </div>
          ))}
          {selectionData.count > 5 && (
            <div
              className="rounded-full bg-slate-700 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                marginLeft: -8,
                border: "2px solid #1e293b",
              }}
            >
              <span className="text-[10px] font-bold text-slate-400">
                +{selectionData.count - 5}
              </span>
            </div>
          )}
          <span className="text-xs ml-2" style={{ color: "#64748b" }}>
            {selectionData.count}
          </span>
        </div>
      )}
    </button>
  );
}
