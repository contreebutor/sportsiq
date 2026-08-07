import { contestStore } from "../../../store";
import ContestLiveDashboard from "./LiveGame/ContestLiveDashboard";
import ContestPreDashboard from "./PreGame/ContestPreDashboard";
import ContestFinalDashboard from "./FinalGame/ContestFinalDashboard";

const ContestDashboard = () => {
  const { contestForToday } = contestStore();

  const gameStatus = contestForToday.game_status;

  const isPregame = gameStatus === "Scheduled";
  const isLivegame = gameStatus === "InProgress";
  const isFinalgame = ["Final", "F/OT"].includes(gameStatus);

  return (
    <>
      {isPregame ? (
        <ContestPreDashboard />
      ) : isLivegame ? (
        <ContestLiveDashboard />
      ) : isFinalgame ? (
        <ContestFinalDashboard />
      ) : (
        <></>
      )}
    </>
  );
};

export default ContestDashboard;
