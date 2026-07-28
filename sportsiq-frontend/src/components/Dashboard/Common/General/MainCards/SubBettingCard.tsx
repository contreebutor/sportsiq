import VSProgressBarCard, {
  VSProgressBarCardProps,
} from "../VSProgressBarCard";

interface SubCardHeaderProps {
  title: string;
  homeValue: string;
  awayValue: string;
  homeValueAdditional?: string;
  awayValueAdditional?: string;
}

export interface SubBettingCardProps extends SubCardHeaderProps {
  data: VSProgressBarCardProps[];
}

export default function SubBettingCard({
  data,
}: {
  data: SubBettingCardProps;
}) {
  return (
    <>
      <span className="w-full h-full flex flex-col bg-white items-center rounded-xs overflow-hidden">
        {/* Header */}
        <span className="w-full flex-1 min-h-9 shrink-0 flex items-center justify-between px-3">
          <span className="w-36 shrink-0 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              {data.awayValue}
            </span>
            {data.awayValueAdditional ? (
              <span className="text-xl text-gray-500">
                {data.awayValueAdditional}
              </span>
            ) : (
              <></>
            )}
          </span>

          <span className="text-lg font-medium text-gray-600">
            {data.title}
          </span>

          <span className="w-36 shrink-0 flex items-center justify-end gap-2">
            {data.homeValueAdditional ? (
              <span className="text-xl text-gray-500">
                {data.homeValueAdditional}
              </span>
            ) : (
              <></>
            )}
            <span className="text-xl font-bold text-gray-900">
              {data.homeValue}
            </span>
          </span>
        </span>

        <span className="w-full h-[1px] shrink-0 px-2 flex items-center justify-center">
          <span className="w-full h-full bg-gray-200" />
        </span>

        {/* Body */}
        <span className="w-full h-fit flex flex-col items-center justfiy-around p-2">
          {data.data.map((item: VSProgressBarCardProps, index: number) => (
            <VSProgressBarCard key={index} showProgressBar={true} data={item} />
          ))}
        </span>
      </span>
    </>
  );
}
