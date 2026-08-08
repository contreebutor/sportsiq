import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

interface Props {
  selectedDate: Date;
  selectDate: (date: Date) => void;
}

export default function Calendar({ selectedDate, selectDate }: Props) {
  const defaultClassNames = getDefaultClassNames();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="border border-gray-300 rounded-md">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={selectDate}
        timeZone={timeZone}
        classNames={{
          today: `border-2 border-indigo-500 border-dashed rounded-md`, // Add a border to today's date
          selected: `bg-indigo-500 border-indigo-500 text-white`, // Highlight the selected day
          root: `${defaultClassNames.root} p-4 rounded-md`, // Add a shadow to the root element
          chevron: `${defaultClassNames.chevron}`, // Change the color of the chevron
        }}
      />
    </div>
  );
}
