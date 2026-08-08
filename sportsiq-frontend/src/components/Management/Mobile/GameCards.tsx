import { CustomToggle } from "../../StyledDefault/CustomToggle";
import DualRadial from "../../Wrapper/DualRadial";
import { convertToClientTimezone } from "../../../lib/utils";
import { GameForMobileGame } from "../../../types/general";

interface Props {
  games: GameForMobileGame[];
  handleToggleChange: (gameUUID: string, enabled: boolean) => void;
  selectedGameUUID: string | null;
  setSelectedGameUUID: (gameUUID: string) => void;
}

export default function GameCards({
  games,
  handleToggleChange,
  selectedGameUUID,
  setSelectedGameUUID,
}: Props) {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-start gap-1">
        {games.map((game) => (
          <div
            key={`game-card-container-${game.game_uuid}`}
            className={`w-full h-fit flex flex-col items-center gap-2 border-2 rounded-md p-1 ${
              selectedGameUUID === game.game_uuid
                ? "border-green-500 bg-green-500/10"
                : "border-transparent"
            }`}
          >
            <GameCard
              key={`game-card-${game.game_uuid}`}
              game={game}
              setSelectedGameUUID={setSelectedGameUUID}
            />

            {game.m_game && (
              <div className="w-full h-fit flex items-center justify-center gap-2">
                <span className="text-xs text-gray-600">Enabled</span>
                <CustomToggle
                  checked={game.m_game.enabled}
                  onChange={() => {
                    handleToggleChange(game.game_uuid, !game.m_game.enabled);
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <span className="h-20" />
      </div>
    </>
  );
}

interface GameCardProps {
  game: GameForMobileGame;
  setSelectedGameUUID: (gameUUID: string) => void;
}

const GameCard = ({ game, setSelectedGameUUID }: GameCardProps) => {
  const clientTimeString = convertToClientTimezone(game.date_time);
  const date = new Date(clientTimeString);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const title = `${time}`;

  const handleClick = () => {
    setSelectedGameUUID(game.game_uuid);
  };

  return (
    <div
      onClick={handleClick}
      className="w-full h-fit relative text-white rounded-lg cursor-pointer"
    >
      <DualRadial
        left={game.away_team_primary_color}
        right={game.home_team_primary_color}
        className="w-full h-fit bg-white text-white rounded-md shadow-md p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 w-20">
            <img
              src={game.away_team_logo_url}
              alt={game.away_team_key}
              className="w-8 h-8"
            />

            <div className="flex flex-col items-start justify-start">
              <span className="font-bold text-xs leading-none">
                {game.away_team_key}
              </span>
              <span className="text-sm font-light text-white/80">
                {game.away_team_wins}-{game.away_team_losses}
              </span>
            </div>
          </div>

          <div className="text-white font-medium text-sm">{title}</div>

          <div className="flex items-center justify-end gap-3 w-20">
            <div className="flex flex-col items-end justify-start">
              <span className="font-bold text-xs leading-none">
                {game.home_team_key}
              </span>
              <span className="text-sm font-light text-white/80">
                {game.home_team_wins}-{game.home_team_losses}
              </span>
            </div>

            <img
              src={game.home_team_logo_url}
              alt={game.home_team_key}
              className="w-8 h-8"
            />
          </div>
        </div>
      </DualRadial>
    </div>
  );
};
