interface Props {
  fraction: number;
  points: number;
  size?: number;
}

export default function CircularTimer({ fraction, points, size = 130 }: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, fraction));
  const dashOffset = circumference * (1 - clamped);
  const color =
    fraction > 0.57 ? "#22c55e" : fraction > 0.28 ? "#f59e0b" : "#ef4444";
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="wp-timer-ring relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="font-extrabold text-center tabular-nums"
        style={{ fontSize: 28, color }}
      >
        {points.toLocaleString()}
      </span>
    </div>
  );
}
