import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchContestWinnerByID,
  updateContestRedeemed,
} from "../services/contestService";
import Loading from "../components/Loading";
import { toast } from "react-toastify";
import DualRadial from "../components/Wrapper/DualRadial";
import { CustomButton } from "../components/StyledDefault";
import { quarterText } from "../lib/utils";
import { ContestWinnerJson, Quarter } from "../types/contests";
import { convertToClientTimezone } from "../lib/utils";

export default function ContestWinnerPage() {
  const { id } = useParams();

  const [winner, setWinner] = useState<ContestWinnerJson | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchWinner(id);
  }, [id]);

  const fetchWinner = async (contestWinnerID: string) => {
    try {
      setFetching(true);
      const winnerData = await fetchContestWinnerByID(contestWinnerID);
      setWinner(winnerData);
    } catch (error) {
      console.error("Error fetching contest winner:", error);
      toast.error("Failed to fetch contest winner: " + error.message);
      setWinner(null);
    } finally {
      setFetching(false);
    }
  };

  const handleRedeem = async () => {
    try {
      await updateContestRedeemed(id);
      toast.success("Contest winner redeemed successfully");
      setConfirmed(true);
    } catch (error) {
      console.error("Error redeeming contest winner:", error);
      toast.error("Failed to redeem contest winner: " + error.message);
    }
  };

  if (fetching) {
    return <Loading />;
  }

  if (!winner) {
    return <ContestWinnerNotFound />;
  }

  return (
    <>
      <ContestWinnerInfo
        contestWinner={winner}
        onRedeem={handleRedeem}
        confirmed={confirmed}
      />
    </>
  );
}

interface ContestWinnerInfoProps {
  contestWinner: ContestWinnerJson;
  onRedeem: () => void;
  confirmed: boolean;
}

const ContestWinnerInfo = ({
  contestWinner,
  onRedeem,
  confirmed,
}: ContestWinnerInfoProps) => {
  return (
    <>
      <div className="w-full h-full relative bg-[#110e2a]">
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center gap-8">
          <div className="w-fit h-fit flex flex-col items-center justify-center gap-2">
            <span className="text-white text-2xl text-center font-bold">
              {quarterText(contestWinner.quarter as Quarter)}
            </span>
            <span className="text-white text-3xl text-center font-bold">
              {/* &quot; */}
              {contestWinner.prize || "No prize"}
              {/* &quot; */}
            </span>
          </div>

          {contestWinner.redeemed ? (
            <>
              <div className="w-full h-fit flex flex-wrap gap-2 items-center justify-center">
                <span className="text-white text-2xl text-center font-bold">
                  You are already redeemed!
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-full h-fit flex flex-wrap gap-2 items-center justify-center">
                <span className="text-white text-2xl text-center font-bold">
                  {contestWinner.nickname} has won the competition!
                </span>
              </div>

              <RedeemButton onRedeem={onRedeem} confirmed={confirmed} />
            </>
          )}
        </div>

        <Header winner={contestWinner} />
      </div>
    </>
  );
};

const Header = ({ winner }: { winner: ContestWinnerJson }) => {
  const date = new Date(
    convertToClientTimezone(winner.date_time ?? winner.day)
  );
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const day = date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <DualRadial
        left={`${winner.away_team.primary_color}`}
        right={`${winner.home_team.primary_color}`}
        className="w-full h-1/2 shrink-0"
      >
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <img
              src={winner.away_team.logo_url}
              alt={winner.away_team.key}
              className="w-10 h-10"
            />

            <div className="flex flex-col items-start justify-start">
              <span className="font-semibold text-2xl leading-none text-white">
                {winner.away_team.key}
              </span>
              <span className="text-lg font-light text-white/80">
                {winner.away_team.wins}-{winner.away_team.losses}
              </span>
            </div>
          </div>

          <div className="text-white font-medium text-lg flex flex-col items-center justify-center gap-1">
            <span className="leading-none">{time}</span>
            <span className="leading-none">{day}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end justify-start">
              <span className="font-semibold text-2xl leading-none text-white">
                {winner.home_team.key}
              </span>
              <span className="text-lg font-light text-white/80">
                {winner.home_team.wins}-{winner.home_team.losses}
              </span>
            </div>

            <img
              src={winner.home_team.logo_url}
              alt={winner.home_team.key}
              className="w-10 h-10"
            />
          </div>
        </div>
      </DualRadial>
    </>
  );
};

const RedeemButton = ({
  onRedeem,
  confirmed,
}: {
  onRedeem: () => void;
  confirmed: boolean;
}) => {
  return (
    <>
      <CustomButton
        className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
        onClick={onRedeem}
        disabled={confirmed}
      >
        <span className="text-white text-xl">
          {confirmed ? "Confirmed" : "Confirm"}
        </span>
      </CustomButton>
    </>
  );
};

const ContestWinnerNotFound = () => {
  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-center">
        <span className="max-w-sm text-white text-2xl text-center font-bold">
          You are not a winner
        </span>
      </div>
    </>
  );
};
