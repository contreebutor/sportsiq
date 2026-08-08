import { CustomInput, CustomButton, CustomToggle } from "../StyledDefault";

interface DefaultContestSectionProps {
  title: string;
  values: Record<string, string | number> | null;
  enabled: boolean;
  onToggleChange: (checked: boolean) => void;
  onValueChange: (key: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  placeholder: string;
  valueType?: "string" | "number";
  keys?: string[];
}

export const DefaultContestSection = ({
  title,
  values,
  enabled,
  onToggleChange,
  onValueChange,
  onSubmit,
  submitting,
  placeholder,
  valueType = "string",
  keys = ["1", "2", "3", "4"],
}: DefaultContestSectionProps) => {
  const getDisplayValue = (key: string): string => {
    const value = values?.[key] || null;
    if (valueType === "number") {
      return value !== null && value !== undefined ? String(value) : "0";
    }
    return value !== null && value !== undefined ? String(value) : "";
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-lg shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-gray-700">
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <CustomToggle checked={enabled} onChange={onToggleChange} />
        </div>
      </div>

      <div className="space-y-4">
        {keys.map((key) => (
          <CustomInput
            key={key}
            label={`Quarter ${key}:`}
            value={getDisplayValue(key)}
            onChange={(e) => onValueChange(key, e.target.value)}
            placeholder={placeholder.replace("{key}", key)}
            disabled={!enabled}
            className="w-full"
            type={valueType === "number" ? "number" : "text"}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <CustomButton
          onClick={onSubmit}
          disabled={submitting || !enabled}
          className="min-w-[120px]"
        >
          {submitting ? "Saving..." : "Submit"}
        </CustomButton>
      </div>
    </div>
  );
};
