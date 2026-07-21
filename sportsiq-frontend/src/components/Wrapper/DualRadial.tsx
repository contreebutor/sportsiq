import React, { CSSProperties } from "react";

type DualRadialProps = {
  children: React.ReactNode;
  className?: string;
  left?: string; // hex or css color
  right?: string; // hex or css color
  bg?: string; // base background color
};

/**
 * Reusable background wrapper that renders the existing bg-dual-radial style
 * while allowing per-instance color overrides via CSS variables. Defaults are
 * chosen to match the current design exactly, so swapping this in preserves
 * appearance.
 */
export default function DualRadial({
  children,
  className = "",
  left = "#3C2B58",
  right = "#25375B",
  bg = "#110e2a",
}: DualRadialProps) {
  return (
    <div
      className={`bg-dual-radial ${className}`}
      style={{
        ["--left-hex" as keyof CSSProperties]: left,
        ["--right-hex" as keyof CSSProperties]: right,
        ["--bg" as keyof CSSProperties]: bg,
      }}
    >
      {children}
    </div>
  );
}
