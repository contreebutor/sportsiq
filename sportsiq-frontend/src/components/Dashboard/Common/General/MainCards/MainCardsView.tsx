import { useEffect, useState } from "react";
import MainCardsLayout from "./MainCardsLayout";
import {
  FinalGame,
  LiveGame,
  MainCardsLayoutColumnsCount,
  PreGame,
} from "../../../../../types/general";
import { userStore } from "../../../../../store";
import PreGameCard from "./PreGame/PreGameCard";
import LiveGameCard from "./LiveGame/LiveGameCard";
import FinalGameCard from "./FinalGame/FinalGameCard";

interface Props {
  columnsCount: MainCardsLayoutColumnsCount;
  newFinalgames: FinalGame[];
  livegames: LiveGame[];
  pregames: PreGame[];
  oldFinalgames: FinalGame[];
}

export default function MainCardsView({
  columnsCount,
  newFinalgames,
  livegames,
  pregames,
  oldFinalgames,
}: Props) {
  const { dashboardSettings } = userStore();
  const [cardState, setCardState] = useState<number>(0);

  const gameCards: React.ReactNode[] = [];

  useEffect(() => {
    const interval = setInterval(() => {
      setCardState((prev) => (prev + 1) % 6);
    }, dashboardSettings?.interval_card_rotation_time * 1000 || 10000);

    return () => clearInterval(interval);
  }, [dashboardSettings?.interval_card_rotation_time]);

  const isLarge: boolean = dashboardSettings?.dashboard_card_count === 4;

  for (const game of newFinalgames) {
    gameCards.push(
      <FinalGameCard
        key={`new-final-game-card-${game.game_id}`}
        isLarge={isLarge}
        data={game}
      />
    );
  }

  for (const game of livegames) {
    gameCards.push(
      <LiveGameCard
        key={`live-game-card-${game.game_id}`}
        isLarge={isLarge}
        cardState={cardState}
        data={game}
      />
    );
  }

  for (const game of pregames) {
    gameCards.push(
      <PreGameCard
        key={`pre-game-card-${game.game_id}`}
        isLarge={isLarge}
        cardState={cardState}
        data={game}
      />
    );
  }

  for (const game of oldFinalgames) {
    gameCards.push(
      <FinalGameCard
        key={`old-final-game-card-${game.game_id}`}
        isLarge={isLarge}
        data={game}
      />
    );
  }

  return (
    <>
      <MainCardsLayout columnsCount={columnsCount} gameCards={gameCards} />
    </>
  );
}
