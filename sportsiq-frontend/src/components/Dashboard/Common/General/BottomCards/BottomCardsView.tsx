import BottomCard from "./BottomCard";
import { BottomCardProps } from "../../../../../types/general";
import { useEffect, useState } from "react";

interface Props {
  games: BottomCardProps[];
}

export default function BottomCardsView({ games }: Props) {
  const [cardState, setCardState] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCardState((prev) => (prev + 1) % 2);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="grid grid-cols-6 gap-3 p-3 h-[178px] bg-[#1A1A1A] shrink-0">
        {games.map((game: BottomCardProps, index: number) => (
          <BottomCard
            key={`bottom-game-card-${index}`}
            data={game}
            cardState={cardState}
          />
        ))}
      </div>
    </>
  );
}
