import { CustomToggle } from "../../StyledDefault/CustomToggle";
import DualRadial from "../../Wrapper/DualRadial";
import { convertToClientTimezone } from "../../../lib/utils";
import { GetUpcomingGameWithContestStatusResponse } from "../../../types/contests";
import { CustomDropdown } from "../../StyledDefault";

interface Props {
  games: GetUpcomingGameWithContestStatusResponse[];
  handleToggleChange: (gameUUID: string, enabled: boolean) => void;
  handleContestTypeChange: (gameUUID: string, type: string) => void;
  selectedGameUUID: string | null;
  setSelectedGameUUID: (gameUUID: string) => void;
  setSelectedGameTeamKeys: (teamKeys: string[]) => void;
}

export default function GameCards({
  games,
  handleToggleChange,
  handleContestTypeChange,
  selectedGameUUID,
  setSelectedGameUUID,
  setSelectedGameTeamKeys,
}: Props) {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-start gap-1">
        {games.map((game) => (
          <div
            key={`game-card-container-${game.id}`}
            className={`w-full h-fit flex flex-col items-center gap-2 border-2 rounded-md p-1 ${
              selectedGameUUID === game.id
                ? "border-green-500 bg-green-500/10"
                : "border-transparent"
            }`}
          >
            <GameCard
              key={`game-card-${game.id}`}
              game={game}
              setSelectedGameUUID={setSelectedGameUUID}
              setSelectedGameTeamKeys={setSelectedGameTeamKeys}
            />

            {game.contest !== null && (
              <>
                <div className="w-full h-fit flex items-center justify-center gap-4">
                  <CustomToggle
                    checked={game.contest.enabled}
                    onChange={() => {
                      handleToggleChange(game.id, !game.contest.enabled);
                    }}
                  />
                  <CustomDropdown
                    selected={{
                      label: game.contest.type.toUpperCase(),
                      value: game.contest.type,
                    }}
                    options={game.contest.options.map((option) => ({
                      label: option.toUpperCase(),
                      value: option,
                    }))}
                    onChange={(option) => {
                      handleContestTypeChange(game.id, option.value);
                    }}
                    className="w-40 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        ))}
        <span className="h-20" />
      </div>
    </>
  );
}

interface GameCardProps {
  game: GetUpcomingGameWithContestStatusResponse;
  setSelectedGameUUID: (gameUUID: string) => void;
  setSelectedGameTeamKeys: (teamKeys: string[]) => void;
}

const GameCard = ({
  game,
  setSelectedGameUUID,
  setSelectedGameTeamKeys,
}: GameCardProps) => {
  const clientTimeString = convertToClientTimezone(game.date_time);
  const date = new Date(clientTimeString);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const title = `${time}`;

  const handleClick = () => {
    setSelectedGameUUID(game.id);
    setSelectedGameTeamKeys([game.home_team_key, game.away_team_key]);
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
