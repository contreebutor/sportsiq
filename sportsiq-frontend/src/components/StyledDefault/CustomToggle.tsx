import { cn } from "../../lib/cn";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CustomToggle = ({ checked, onChange }: Props) => {
  const handleClick = () => {
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer",
        checked ? "bg-green-500" : "bg-gray-500"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};
