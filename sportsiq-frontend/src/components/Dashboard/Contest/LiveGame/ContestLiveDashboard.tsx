import { useEffect, useState } from "react";
import ContestLiveGameView from "./ContestLiveGameView";
import Loading from "../../../Loading";
import { contestStore } from "../../../../store";
import { fetchAllGames } from "../../../../services/gameService";
import { convertGameToLiveGame } from "../../../../lib/utils";
import { LiveGame } from "../../../../types/general";
import { BingoLiveView } from "./ContestView/BingoLiveView";
import { PredictorLiveView } from "./ContestView/PredictorLiveView";

const ContestLiveDashboard = () => {
  const { contestForToday } = contestStore();
  const [teamLogos, setTeamLogos] = useState<{
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  }>({});

  const gameUUID = contestForToday.game_uuid;
  const contestType = contestForToday.contest_type;

  const [game, setGame] = useState<LiveGame | null>(null);

  useEffect(() => {
    fetchGame(gameUUID);

    const gameInterval = setInterval(() => {
      fetchGame(gameUUID);
    }, 5000);

    return () => {
      clearInterval(gameInterval);
    };
  }, [gameUUID]);

  const fetchGame = async (gameUUID: string) => {
    const games = await fetchAllGames(gameUUID);
    if (games.length > 0) {
      const gameData = convertGameToLiveGame(games[0]);
      setGame(gameData);

      setTeamLogos({
        [gameData.home_team_key]: {
          logo_url: gameData.home_team_logo_url,
          type: "home",
        },
        [gameData.away_team_key]: {
          logo_url: gameData.away_team_logo_url,
          type: "away",
        },
      });
    } else {
      setGame(null);
    }
  };

  return (
    <>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[820px] shrink-0 h-full">
          {game ? <ContestLiveGameView game={game} /> : <Loading />}
        </div>

        {contestType === "predictor" ? (
          <PredictorLiveView />
        ) : contestType === "bingo" ? (
          <BingoLiveView teamLogos={teamLogos} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ContestLiveDashboard;
