import React, { ReactNode } from "react";

/**
 * BorderAnimationWrapper wraps its children with a div
 * that displays an animated conic-gradient border using Tailwind and CSS custom properties.
 * The border is visually thicker using border-4.
 * Accepts isAnimating prop to toggle the border animation.
 */
const BorderWrapper: React.FC<{
  children: ReactNode;
  className?: string;
  isAnimating?: boolean;
}> = ({ children, className = "", isAnimating = true }) => {
  return (
    <div
      className={`w-full rounded-lg border-2 ${
        isAnimating ? "border-transparent animate-border" : "border-transparent"
      } ${className}`}
      style={{
        background: isAnimating
          ? `linear-gradient(45deg,#172033,#232e47 50%,#172033) padding-box,` +
            `conic-gradient(from var(--border-angle, 0deg), ` +
            `rgba(71,85,105,0.48) 80%, #6366f1 86%, #a5b4fc 90%, #6366f1 94%, rgba(71,85,105,0.48)) border-box`
          : undefined,
        borderColor: isAnimating ? undefined : "transparent",
      }}
    >
      {children}
    </div>
  );
};

export default BorderWrapper;
