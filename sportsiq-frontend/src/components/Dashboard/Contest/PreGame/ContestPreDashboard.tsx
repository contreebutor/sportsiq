import { useEffect, useState } from "react";

import Loading from "../../../Loading";
import ContestPreGameView from "./ContestPreGameView";
import { fetchAllGames } from "../../../../services/gameService";
import { convertGameToPreGame } from "../../../../lib/utils";
import { PreGame } from "../../../../types/general";
import { BingoPreView } from "./ContestView/BingoPreView";
import { PredictorPreView } from "./ContestView/PredictorPreView";
import { contestStore } from "../../../../store";

const ContestPreGameDashboard = () => {
  const { contestForToday } = contestStore();

  const gameUUID = contestForToday.game_uuid;
  const contestType = contestForToday.contest_type;

  const [game, setGame] = useState<PreGame | null>(null);
  const [teamLogos, setTeamLogos] = useState<{
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  }>({});

  useEffect(() => {
    fetchGame(gameUUID);
    const gameInterval = setInterval(() => {
      fetchGame(gameUUID);
    }, 3000);

    return () => {
      clearInterval(gameInterval);
    };
  }, [gameUUID]);

  const fetchGame = async (gameUUID: string) => {
    const games = await fetchAllGames(gameUUID);
    if (games.length > 0) {
      const gameData = convertGameToPreGame(games[0]);
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
          {game ? <ContestPreGameView game={game} /> : <Loading />}
        </div>

        {contestType === "predictor" ? (
          <PredictorPreView />
        ) : contestType === "bingo" ? (
          <BingoPreView teamLogos={teamLogos} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ContestPreGameDashboard;
