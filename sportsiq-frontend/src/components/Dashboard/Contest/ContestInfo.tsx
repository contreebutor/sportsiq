import Logo from "../../Logo";
import QRCode from "./QRCode";

interface Props {
  id: string | null;
  prize: string | null;
  projection: number | null;
  quarter: string | null;
  remainingTime: number | null;
}

export const ContestInfo = ({
  id,
  prize,
  projection,
  quarter,
  remainingTime,
}: Props) => {
  const remainingMinutes = remainingTime
    ? Math.floor(Math.abs(remainingTime) / 60)
    : null;
  const remainingSeconds = remainingTime
    ? Math.floor(Math.abs(remainingTime) % 60)
    : 0;

  const remainingTimeString = remainingMinutes
    ? `${remainingMinutes}:${String(remainingSeconds).padStart(2, "0")}`
    : "MM:SS";

  const quarterText =
    quarter === "1"
      ? "1ST QUARTER"
      : quarter === "2"
      ? "2ND QUARTER"
      : quarter === "3"
      ? "3RD QUARTER"
      : quarter === "4"
      ? "4TH QUARTER"
      : "FULL GAME";

  return (
    <>
      <div className="w-full h-full bg-slate-900 flex flex-col items-center ">
        <div className="w-full h-full pt-6 px-7 pb-5 flex flex-col items-center justify-around gap-6">
          <div className="w-full h-fit flex flex-col items-center">
            <Logo />
            <span className="text-white text-4xl font-bold">PREDICTOR</span>
          </div>

          <div className="w-full h-fit flex flex-col items-center">
            <div className="w-full h-fit px-1">
              <div className="w-full h-fit rounded-t-md bg-gradient-to-b from-indigo-500 to-slate-900 flex flex-col items-center py-3">
                <span className="text-4xl font-bold text-white text-center min-h-10">
                  {prize}
                </span>
                <span className="text-lg text-white/80">
                  Plus other prizes throughout the game
                </span>
              </div>
            </div>

            <div className="w-full h-fit bg-white rounded-md flex flex-col items-center px-3 pt-5 pb-3">
              <span className="text-lg text-black/80 pb-1 font-semibold">
                {quarterText}
              </span>
              <span className="text-4xl font-extrabold text-black">
                PREDICT THE
              </span>
              <span className="text-4xl font-extrabold text-indigo-500 pb-1">
                TOTAL POINTS
              </span>
              <span className="text-lg text-black/80 pb-5">
                Closest without going over will win
              </span>

              <div className="w-full h-fit bg-slate-900 rounded-sm px-5 py-4">
                <div className="w-full h-fit flex items-center justify-between">
                  <Logo size="h-8" />
                  <span className="text-3xl font-medium text-white min-h-9">
                    {projection}
                  </span>
                </div>

                <div className="w-full h-fit flex items-center justify-between text-2xl text-white/80">
                  <span>PROJECTION</span>
                  <span>POINTS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-fit h-fit flex flex-col items-center text-white text-2xl leading-tight gap-5">
            <span className="w-80 text-center">
              Scan the code to submit your predictions
            </span>
            <div className="w-fit h-fit p-3.5 bg-white rounded-sm">
              <QRCode
                value={
                  id
                    ? `${window.location.origin}/submit-predictions/${id}`
                    : "NO CONTEST"
                }
              />
            </div>
            <span>Entry closes in {remainingTimeString}</span>
            {/* <span>{`${window.location.origin}/contest/${id ?? ""}`}</span> */}
          </div>
        </div>

        <div className="w-full h-fit flex items-center justify-between text-sm text-white/80 p-4 shrink-0">
          <div className="w-fit h-fit flex items-center justify-center gap-2">
            <span>Powered by</span>
            <Logo />
          </div>

          <span>Terms & Conditions apply</span>
        </div>
      </div>
    </>
  );
};
