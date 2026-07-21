import { useEffect, useRef } from "react";

type AnimationWrapperProps = {
  isAnimating: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function AnimationWrapper({
  isAnimating,
  children,
  className,
}: AnimationWrapperProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transition = "opacity 0.5s cubic-bezier(0.4,0,0.2,1)";
      // Optionally, you can add will-change for smoother animation
      ref.current.style.willChange = "opacity";
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const frame = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.opacity = isAnimating ? "0.3" : "1";
    });

    return () => cancelAnimationFrame(frame);
  }, [isAnimating]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ opacity: isAnimating ? 0.3 : 1 }}
    >
      {children}
    </span>
  );
}
