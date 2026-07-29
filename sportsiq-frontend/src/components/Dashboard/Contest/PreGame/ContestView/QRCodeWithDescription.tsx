import { convertToClientTimezone } from "../../../../../lib/utils";
import QRCode from "../../QRCode";
import { DateTime } from "luxon";

interface Props {
  qrcodeValue: string;
  description: string;
  dateTime: string;
}
export const QRCodeWithDescription = ({
  qrcodeValue,
  description,
  dateTime,
}: Props) => {
  // Convert EST time to client timezone before calculating remaining time
  const clientDateTime = convertToClientTimezone(dateTime);
  let remainingTime = DateTime.fromISO(clientDateTime)
    .diff(DateTime.now())
    .as("seconds");

  // Ensure remainingTime is never negative
  remainingTime = Math.max(0, remainingTime);

  const remainingHours = Math.floor(remainingTime / 3600);
  const remainingMinutes = Math.floor((remainingTime % 3600) / 60);
  const remainingSeconds = Math.floor(remainingTime % 60);
  const remainingTimeString =
    remainingHours > 0
      ? `${remainingHours}:${String(remainingMinutes).padStart(
          2,
          "0"
        )}:${String(remainingSeconds).padStart(2, "0")}`
      : `${remainingMinutes}:${String(remainingSeconds).padStart(2, "0")}`;

  return (
    <>
      <div className="w-full h-fit flex items-center justify-center gap-14">
        <div className="w-full h-fit flex flex-col items-center gap-6">
          <span className="text-4xl text-center w-md font-medium text-white">
            {description}
          </span>
          <span className="text-3xl font-semibold text-[#5545D3]">
            Game starts in {remainingTimeString}
          </span>
        </div>
        <div className="w-fit h-fit p-3 bg-white rounded">
          <QRCode value={qrcodeValue} size={200} />
        </div>
      </div>
    </>
  );
};
