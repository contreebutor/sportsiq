import { getContrastColor } from "../../lib/utils";

export interface VSProgressBarCardProps {
  title: string;
  homeValue: string;
  awayValue: string;
  homePercent: number;
  awayPercent: number;
  homeColor: string;
  awayColor: string;
  titleWidth: string;
}

export default function VSProgressBarCard({
  showProgressBar = true,
  data,
}: {
  showProgressBar: boolean;
  data: VSProgressBarCardProps;
}) {
  return (
    <>
      <div className="w-full flex items-center gap-2 justify-between">
        <span
          className={`text-lg font-bold w-12 shrink-0`}
          style={{ color: getContrastColor(data.awayColor) }}
        >
          {data.awayValue}
        </span>

        {showProgressBar ? (
          <span className="w-full h-4 bg-gray-300 rounded-full flex items-center overflow-hidden justify-end">
            <span
              className="h-full rounded-full"
              style={{
                width: `${Math.round(data.awayPercent)}%`,
                backgroundColor: `${getContrastColor(data.awayColor)}`,
                background: `linear-gradient(to right, ${getContrastColor(
                  data.awayColor
                )}, ${getContrastColor(data.awayColor)}99)`,
              }}
            />
          </span>
        ) : (
          <></>
        )}
        <span
          className={`${data.titleWidth} text-center text-lg leading-tight font-medium text-gray-600 shrink-0`}
        >
          {data.title}
        </span>

        {showProgressBar ? (
          <span className="w-full h-4 bg-gray-300 rounded-full flex items-center overflow-hidden justify-start">
            <span
              className="h-full rounded-full"
              style={{
                width: `${Math.round(data.homePercent)}%`,
                backgroundColor: `${getContrastColor(data.homeColor)}`,
                background: `linear-gradient(to right, ${getContrastColor(
                  data.homeColor
                )}99, ${getContrastColor(data.homeColor)})`,
              }}
            />
          </span>
        ) : (
          <></>
        )}

        <span
          className={`text-lg font-bold w-12 shrink-0 text-end`}
          style={{ color: getContrastColor(data.homeColor) }}
        >
          {data.homeValue}
        </span>
      </div>
    </>
  );
}
