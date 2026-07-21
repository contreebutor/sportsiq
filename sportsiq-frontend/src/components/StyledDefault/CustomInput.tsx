import { cn } from "../../lib/cn";

interface Props {
  label?: string;
  placeholder?: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const CustomInput = ({
  label,
  placeholder = "",
  value,
  onChange,
  type = "text",
  disabled = false,
  className,
  labelClassName,
  inputClassName,
}: Props) => {
  return (
    <div className={cn("w-full flex items-center gap-4 text-base", className)}>
      {label && (
        <label
          className={cn(
            "w-fit shrink-0 text-right font-medium text-gray-900",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <input
        placeholder={placeholder}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        required={!disabled}
        className={cn(
          "appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 disabled:bg-gray-100 disabled:cursor-not-allowed",
          inputClassName
        )}
      />
    </div>
  );
};
