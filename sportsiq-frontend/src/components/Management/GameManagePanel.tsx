import { useEffect, useState, useCallback } from "react";
import Loading from "../Loading";
import {
  fetchGamesByType,
  manageGames,
  Game,
  ManageGamesRequest,
} from "../../services/manageService";
import { toast } from "react-toastify";
import { CustomButton } from "../StyledDefault";
import {
  CustomDropdown,
  DropdownOption,
} from "../StyledDefault/CustomDropdown";
import { convertToClientTimezone, getReversedColor } from "../../lib/utils";
import DualRadial from "../Wrapper/DualRadial";

const gameTypeOptions: DropdownOption[] = [
  { label: "NBA", value: "nba" },
  { label: "NFL", value: "nfl" },
  { label: "CBB", value: "cbb" },
  { label: "MLB", value: "mlb" },
];

export const GameManagePanel = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [gameStates, setGameStates] = useState<Record<string, boolean>>({});
  const [selectedGameType, setSelectedGameType] = useState<DropdownOption>({
    label: "CBB",
    value: "cbb",
  });

  const fetchGames = useCallback(async (gameType: string) => {
    try {
      setLoading(true);
      const fetchedGames = await fetchGamesByType(gameType);
      setGames(fetchedGames);

      // Initialize game states with their enabled values
      const states: Record<string, boolean> = {};
      fetchedGames.forEach((game) => {
        states[game.game_uuid] = game.enabled;
      });
      setGameStates(states);
    } catch (error) {
      console.error(`Error fetching ${gameType.toUpperCase()} games:`, error);
      toast.error("Failed to fetch games. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(selectedGameType.value);
  }, [selectedGameType.value, fetchGames]);

  const handleGameTypeChange = (option: DropdownOption) => {
    // Find the matching option to preserve the correct label
    const matchedOption = gameTypeOptions.find(
      (opt) => opt.value === option.value
    );
    setSelectedGameType(matchedOption || option);
  };

  const handleGameToggle = (gameUUID: string) => {
    setGameStates((prev) => ({
      ...prev,
      [gameUUID]: !prev[gameUUID],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const gamesToUpdate: ManageGamesRequest[] = games.map((game) => ({
        id: game.game_uuid,
        enabled: gameStates[game.game_uuid] || false,
      }));

      await manageGames(gamesToUpdate);
      toast.success("Games updated successfully");

      // Refresh the games to get the latest state
      await fetchGames(selectedGameType.value);
    } catch (error) {
      console.error("Error managing games:", error);
      toast.error("Failed to save games. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const clientTimeString = convertToClientTimezone(dateTime);
    const date = new Date(clientTimeString);
    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    // Check if the date is today
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const day = date
      .toLocaleDateString([], {
        weekday: "long",
      })
      .slice(0, 3);

    return { time, day, isToday };
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 p-4 gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Game Management
          </h2>
          <p className="text-gray-600 mb-4">
            Manage which games are displayed on the dashboard
          </p>
          <div className="w-40">
            <CustomDropdown
              selected={selectedGameType}
              options={gameTypeOptions}
              onChange={handleGameTypeChange}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <CustomButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </CustomButton>
        </div>
      </div>

      {loading ? (
        <Loading isLight={false} />
      ) : (
        <div className="bg-white flex-1 overflow-y-auto p-4 border border-gray-300 rounded-md shadow-inner shadow-black/10">
          {games.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {selectedGameType.label} games found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {games.map((game) => {
                const { time, day, isToday } = formatDateTime(game.date_time);
                const awayWinsLossesStyle = {
                  color: getReversedColor(game.away_team_primary_color),
                  padding: "0 .3em",
                  marginLeft: "-.2em",
                  marginRight: "-.2em",
                  fontWeight: 500,
                };
                const homeWinsLossesStyle = {
                  color: getReversedColor(game.home_team_primary_color),
                  padding: "0 .3em",
                  marginLeft: "-.2em",
                  marginRight: "-.2em",
                  fontWeight: 500,
                };

                const isEnabled = gameStates[game.game_uuid] || false;

                return (
                  <div
                    key={game.game_uuid}
                    onClick={() => handleGameToggle(game.game_uuid)}
                    className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-opacity duration-200 ${
                      !isEnabled ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    <DualRadial
                      left={game.away_team_primary_color}
                      right={game.home_team_primary_color}
                      className="w-full h-fit flex items-center justify-between p-2 text-white"
                    >
                      <div className="flex flex-1 justify-start items-center gap-2">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img
                            src={game.away_team_logo_url}
                            alt={game.away_team_key}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div>
                          <div
                            className="text-base text-white -mb-1.5"
                            style={{
                              color: getReversedColor(
                                game.away_team_primary_color
                              ),
                            }}
                          >
                            {game.away_team_key}
                          </div>
                          <span className="text-sm" style={awayWinsLossesStyle}>
                            {game.away_team_wins !== null
                              ? game.away_team_wins
                              : "0"}
                            -
                            {game.away_team_losses !== null
                              ? game.away_team_losses
                              : "0"}
                          </span>
                        </div>
                      </div>

                      <div className="text-white text-center flex-shrink-0 px-2">
                        <div className="text-sm">
                          {time}
                          {!isToday && ` · ${day}`}
                        </div>
                      </div>

                      <div className="flex flex-1 justify-end items-center gap-2">
                        <div className="text-right flex flex-col">
                          <div
                            className="text-base text-white -mb-1.5"
                            style={{
                              color: getReversedColor(
                                game.home_team_primary_color
                              ),
                            }}
                          >
                            {game.home_team_key}
                          </div>
                          <span className="text-sm" style={homeWinsLossesStyle}>
                            {game.home_team_wins !== null
                              ? game.home_team_wins
                              : "0"}
                            -
                            {game.home_team_losses !== null
                              ? game.home_team_losses
                              : "0"}
                          </span>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img
                            src={game.home_team_logo_url}
                            alt={game.home_team_key}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      </div>
                    </DualRadial>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
