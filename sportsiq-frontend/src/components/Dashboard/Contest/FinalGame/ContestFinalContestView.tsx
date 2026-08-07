import { Quarter } from "../../../../types/contests";
import Logo from "../../../Logo";
import PredictorLogo from "../../Common/Contest/PredictorLogo";

const ContestFinalContestView = () => {
  const winners: Winner[] = [];

  if (winners.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-between">
        <div className="w-full h-full flex flex-col items-center justify-between pt-5 px-7">
          <PredictorLogo />
          <span className="h-5" />
          <WinnersView winners={winners} />
          <span className="h-4" />
          <ThankYouView />
        </div>
        <Footer />
      </div>
    </>
  );
};

interface Winner {
  quarter: Quarter;
  nickname: string;
  prize: string;
  prediction: number;
  score: number;
}

interface WinnersViewProps {
  winners: Winner[];
}

const WinnersView = ({ winners }: WinnersViewProps) => {
  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-between gap-3">
        {winners.map((winner) => (
          <WinnerItem key={winner.quarter} winner={winner} />
        ))}
      </div>
    </>
  );
};

const WinnerItem = ({ winner }: { winner: Winner }) => {
  const quarterText =
    (winner.quarter === "full" ? "FULL GAME" : `Q${winner.quarter}`) +
    " WINNER";

  return (
    <>
      <div
        className={`w-full h-full rounded-md px-3 py-4 flex flex-col items-center justify-between ${
          winner.quarter === "full" ? "bg-[#5545D3]" : "bg-[#228C88]"
        }`}
      >
        <span className="text-white text-lg font-semibold leading-none">
          {quarterText}
        </span>
        <span className="text-white text-3xl font-bold leading-tight">
          {winner.nickname}
        </span>
        <span
          className={`text-white font-medium ${
            winner.quarter === "full" ? "text-xl" : "text-lg"
          }`}
        >
          {"PRIZE: " + winner.prize}
        </span>
        {winner.quarter === "full" && (
          <div className="w-full h-fit flex items-center justify-center gap-2">
            <span className="text-white text-lg font-medium">
              {"PREDICTED: " + winner.prediction + " PTS"}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/80" />
            <span className="text-white text-lg font-medium">
              {"ACTUAL: " + winner.score + " PTS"}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const ThankYouView = () => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-between">
        <span className="text-white text-2xl font-medium">
          THANKS FOR PLAYING!
        </span>
        <span className="text-white/80 text-lg">
          Stay tuned for the next game.
        </span>
      </div>
    </>
  );
};

const Footer = () => {
  return (
    <>
      <div className="w-full h-fit p-4 flex items-center justify-between text-white/70">
        <div className="w-fit h-fit flex items-center justify-center gap-2">
          <span>Powered by</span>
          <Logo />
        </div>

        <span>Terms & Conditions apply</span>
      </div>
    </>
  );
};

export default ContestFinalContestView;
