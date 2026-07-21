import { MdKeyboardArrowDown } from "react-icons/md";
import { cn } from "../../lib/cn";

export interface DropdownOption {
  label: string;
  value: string;
}

interface Props {
  selected: DropdownOption;
  options: DropdownOption[];
  onChange: (value: DropdownOption) => void;
  label?: string;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
}

export const CustomDropdown = ({
  selected,
  options,
  onChange,
  label,
  className,
  labelClassName,
  selectClassName,
  disabled,
}: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ label: e.target.value, value: e.target.value });
  };

  return (
    <div className={cn("w-full flex items-center gap-4", className)}>
      {label && (
        <span
          className={cn(
            "w-fit shrink-0 text-right font-medium text-gray-900",
            labelClassName
          )}
        >
          {label}
        </span>
      )}
      <div className={cn("relative w-full", selectClassName)}>
        <select
          id={selected.value}
          value={selected.value ?? ""}
          onChange={handleChange}
          required
          disabled={disabled}
          className={cn(
            "appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 pr-10",
            disabled && "opacity-50 cursor-not-allowed bg-gray-100"
          )}
        >
          {options.map(({ label, value }) => (
            <option key={String(value)} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <MdKeyboardArrowDown size={24} />
        </span>
      </div>
    </div>
  );
};
