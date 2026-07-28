import { MainCardsLayoutColumnsCount } from "../../../../../types/general";

interface Props {
  columnsCount: MainCardsLayoutColumnsCount;
  gameCards: React.ReactNode[];
}

export default function MainCardsLayout({ columnsCount, gameCards }: Props) {
  return (
    <>
      <div
        className={`w-full h-full grid p-4 gap-4 bg-[#252525] ${
          columnsCount === 2
            ? "grid-cols-2"
            : columnsCount === 3
            ? "grid-cols-3"
            : columnsCount === 4
            ? "grid-cols-4"
            : ""
        }`}
      >
        {gameCards.map((card, index) => (
          <span
            key={`main-cards-layout-card-${index}`}
            className="w-full h-full"
          >
            {card}
          </span>
        ))}
      </div>
    </>
  );
}
