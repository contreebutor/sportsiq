import MainCardsView from "../Common/General/MainCards/MainCardsView";
import BottomCardsView from "../Common/General/BottomCards/BottomCardsView";
import { DateTime } from "luxon";
import { userStore } from "../../../store";
import {
  getExactGamesToDisplay,
  convertGameToPreGame,
  convertGameToLiveGame,
  convertGameToFinalGame,
  convertFinalGamesToScoreboards,
  convertLiveGamesToScoreboards,
  convertPreGamesToScoreboards,
} from "../../../lib/utils";
import {
  FinalGame,
  Game,
  GameType,
  LiveGame,
  PreGame,
} from "../../../types/general";

interface Props {
  gameType: GameType;
  games: Game[];
}
export default function GamesDashboard({ gameType, games }: Props) {
  const { dashboardSettings } = userStore();

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
      if (gameOverAtTime.diff(now).as("minutes") >= -5) {
        newFinalGames.push(convertedGame);
      } else {
        oldFinalGames.push(convertedGame);
      }
    }
  }

  const cardCount = dashboardSettings?.dashboard_card_count || 4;
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
  const columnsCount = cardCount === 4 ? 2 : 4;
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
            <MainCardsView
              columnsCount={columnsCount}
              newFinalgames={newFinalGamesToDisplay}
              livegames={liveGamesToDisplay}
              pregames={preGamesToDisplay}
              oldFinalgames={oldFinalGamesToDisplay}
            />
            <BottomCardsView games={bottomCardGames} />
          </>
        ) : (
          <NoGames gameType={gameType} />
        )}
      </div>
    </>
  );
}

const NoGames = ({ gameType }: { gameType: GameType }) => {
  return (
    <>
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500 text-4xl font-semibold text-center flex flex-col items-center justify-center gap-8">
          <span className="block">
            No {gameType.toUpperCase()} games available for today.
          </span>
          <span className="block">Please check back later.</span>
        </span>
      </div>
    </>
  );
};
