import { useEffect, useRef, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { cn } from "../../lib/cn";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface Props {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  id?: string;
}

export const CustomMultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  label,
  className,
  triggerClassName,
  id,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayText =
    selected.length > 0
      ? options
          .filter((opt) => selected.includes(opt.value))
          .map((opt) => opt.label)
          .join(", ")
      : placeholder;

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block w-fit shrink-0 text-right font-medium text-gray-900 mb-1"
        >
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "appearance-none rounded-md relative flex items-center justify-between w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 pr-10 bg-white text-left min-h-[42px]",
          triggerClassName
        )}
      >
        <span
          className={cn("truncate", selected.length === 0 && "text-gray-500")}
        >
          {displayText}
        </span>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        >
          <MdKeyboardArrowDown size={24} />
        </span>
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
