import { cn } from "../../lib/cn";
import React from "react";

export const CustomButton = ({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "py-2 px-4 flex items-center justify-center rounded-sm text-base font-medium transition-colors duration-200 border-0 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        disabled
          ? "cursor-not-allowed bg-gray-400 hover:bg-gray-400"
          : "cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
};
