import { useEffect, useState } from "react";
import MainCardsView from "../../Common/General/MainCards/MainCardsView";
import BottomCardsView from "../../Common/General/BottomCards/BottomCardsView";
import { DateTime } from "luxon";
import { userStore } from "../../../../store";
import {
  getExactGamesToDisplay,
  convertGameToPreGame,
  convertGameToLiveGame,
  convertGameToFinalGame,
  convertFinalGamesToScoreboards,
  convertLiveGamesToScoreboards,
  convertPreGamesToScoreboards,
} from "../../../../lib/utils";
import { FinalGame, Game, LiveGame, PreGame } from "../../../../types/general";
import { fetchAllGames } from "../../../../services/gameService";
import { contestStore } from "../../../../store";
import ContestFinalContestView from "./ContestFinalContestView";
import Loading from "../../../Loading";

export default function ContestFinalDashboard() {
  const { dashboardSettings } = userStore();
  const { contestForToday } = contestStore();

  const gameUUID = contestForToday.game_uuid;
  const contestID = contestForToday.abstract_contest_id;

  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetchGames();

    const gameInterval = setInterval(() => {
      fetchGames();
    }, 3000);

    return () => {
      clearInterval(gameInterval);
    };
  }, [gameUUID, contestID]);

  const fetchGames = async () => {
    const gamesData = await fetchAllGames();
    setGames(gamesData);
  };

  const newFinalGames: FinalGame[] = [];
  const liveGames: LiveGame[] = [];
  const preGames: PreGame[] = [];
  const oldFinalGames: FinalGame[] = [];

  for (const game of games) {
    if (game.status === "Scheduled") {
      preGames.push(convertGameToPreGame(game));
    } else if (game.status === "InProgress") {
      liveGames.push(convertGameToLiveGame(game));
    } else if (["Final", "F/OT"].includes(game.status)) {
      const convertedGame: FinalGame = convertGameToFinalGame(game);
      const gameOverAtTime = DateTime.fromISO(convertedGame.game_over_at);
      const now = DateTime.now();
      if (gameOverAtTime.diff(now).as("minutes") >= -15) {
        newFinalGames.push(convertedGame);
      } else {
        oldFinalGames.push(convertedGame);
      }
    }
  }

  const cardCount = dashboardSettings?.dashboard_card_count === 4 ? 4 : 6;
  const {
    newFinalGames: newFinalGamesToDisplay,
    liveGames: liveGamesToDisplay,
    preGames: preGamesToDisplay,
    oldFinalGames: oldFinalGamesToDisplay,
  } = getExactGamesToDisplay(
    newFinalGames,
    liveGames,
    preGames,
    oldFinalGames,
    cardCount
  );
  const columnsCount = cardCount === 4 ? 2 : 3;
  const bottomCardGames = [
    ...convertFinalGamesToScoreboards(
      newFinalGames.slice(newFinalGamesToDisplay.length)
    ),
    ...convertLiveGamesToScoreboards(
      liveGames.slice(liveGamesToDisplay.length)
    ),
    ...convertPreGamesToScoreboards(preGames.slice(preGamesToDisplay.length)),
    ...convertFinalGamesToScoreboards(
      oldFinalGames.slice(oldFinalGamesToDisplay.length)
    ),
  ].slice(0, 6);

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {games.length > 0 ? (
          <>
            <div className="w-full h-full grid grid-cols-4">
              <div className="col-span-3">
                <MainCardsView
                  columnsCount={columnsCount}
                  newFinalgames={newFinalGamesToDisplay}
                  livegames={liveGamesToDisplay}
                  pregames={preGamesToDisplay}
                  oldFinalgames={oldFinalGamesToDisplay}
                />
              </div>
              <div className="col-span-1">
                <ContestFinalContestView />
              </div>
            </div>
            <BottomCardsView games={bottomCardGames} />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loading />
          </div>
        )}
      </div>
    </>
  );
}
