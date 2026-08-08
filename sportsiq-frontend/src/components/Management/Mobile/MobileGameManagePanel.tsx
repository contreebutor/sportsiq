import { useEffect, useMemo, useState } from "react";
import { GameCategory, GameForMobileGame } from "../../../types/general";
import {
  fetchGameCategories as fetchGameCategoriesService,
  fetchGamesForMobileGame as fetchGamesForMobileGameService,
  updateMobileGameStatus,
} from "../../../services/manageService";
import { toast } from "react-toastify";
import {
  CustomDropdown,
  DropdownOption,
} from "../../StyledDefault/CustomDropdown";
import { CustomButton } from "../../StyledDefault/CustomButton";
import { MdOpenInNew } from "react-icons/md";
import Loading from "../../Loading";
import GameCards from "./GameCards";
import { MobilePredictorManagement } from "./MobilePredictorManagement";

const SportsGameTypeOptions: DropdownOption[] = [
  { label: "NBA", value: "nba" },
  { label: "NFL", value: "nfl" },
  { label: "CBB", value: "cbb" },
  { label: "NHL", value: "nhl" },
  { label: "MLB", value: "mlb" },
];

export const MobileGameManagePanel = () => {
  const [games, setGames] = useState<GameForMobileGame[]>([]);
  const [fetchingGames, setFetchingGames] = useState(false);
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [selectedSportsGameType, setSelectedSportsGameType] =
    useState<DropdownOption>(SportsGameTypeOptions[0]);
  const [selectedGameUUID, setSelectedGameUUID] = useState<string | null>(null);

  useEffect(() => {
    fetchRelatedData();
  }, []);

  const selectedGames = useMemo(() => {
    return games.filter(
      (game) => game.game_type === selectedSportsGameType.value
    );
  }, [games, selectedSportsGameType]);

  useEffect(() => {
    if (selectedGames.length > 0) {
      setSelectedGameUUID(selectedGames[0].game_uuid);
    }
  }, [selectedGames]);

  const selectedCategories = useMemo(() => {
    return categories.filter(
      (category) => category.game_type === selectedSportsGameType.value
    );
  }, [categories, selectedSportsGameType]);

  const fetchRelatedData = async () => {
    await Promise.all([fetchGamesForMobileGame(), fetchGameCategories()]);
  };

  const fetchGamesForMobileGame = async () => {
    try {
      setFetchingGames(true);
      const newGames = await fetchGamesForMobileGameService();
      setGames(newGames);
    } catch (error) {
      console.error("Failed to fetch games for mobile game: ", error);
      toast.error("Failed to fetch games for mobile game");
    } finally {
      setFetchingGames(false);
    }
  };

  const fetchGameCategories = async () => {
    try {
      const newCategories = await fetchGameCategoriesService();
      setCategories(newCategories);
    } catch (error) {
      console.error("Failed to fetch game categories: ", error);
      toast.error("Failed to fetch game categories");
    }
  };

  const handleToggleChange = async (gameUUID: string, enabled: boolean) => {
    try {
      setGames((prev) =>
        prev.map((game) =>
          game.game_uuid === gameUUID
            ? { ...game, m_game: { ...game.m_game, enabled } }
            : game
        )
      );
      await updateMobileGameStatus(gameUUID, enabled);
      toast.success("Mobile game status updated successfully");
    } catch (error) {
      console.error("Failed to update mobile game status: ", error);
      toast.error("Failed to update mobile game status");
    }
  };

  const handleGoToTeamGameStats = () => {
    window.open(`${window.location.origin}/team-game-stats`, "_blank");
  };

  return (
    <>
      <div className="w-full h-full bg-gray-100 p-4 flex flex-col items-start justify-between gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="w-fit h-fit self-start flex items-center justify-start gap-4">
            <CustomDropdown
              selected={selectedSportsGameType}
              options={SportsGameTypeOptions}
              onChange={setSelectedSportsGameType}
              className="w-40"
            />
          </div>

          <CustomButton
            onClick={handleGoToTeamGameStats}
            className="w-fit h-fit flex items-center gap-2"
          >
            <MdOpenInNew size={16} />
            Team Game Stats
          </CustomButton>
        </div>

        <div className="w-full h-full flex items-start justify-start gap-4 overflow-hidden">
          <div className="w-fit h-full flex flex-col gap-4">
            <div className="w-80 h-full border-1 border-gray-300 rounded-md bg-white p-1 mx-1 overflow-y-auto">
              {fetchingGames ? (
                <Loading isLight={false} />
              ) : selectedGames.length > 0 ? (
                <>
                  <GameCards
                    games={selectedGames}
                    selectedGameUUID={selectedGameUUID}
                    setSelectedGameUUID={setSelectedGameUUID}
                    handleToggleChange={handleToggleChange}
                  />
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          {selectedGameUUID && (
            <div className="w-full h-full flex items-start justify-center">
              <MobilePredictorManagement
                gameUUID={selectedGameUUID}
                homeTeamKey={
                  games.find((g) => g.game_uuid === selectedGameUUID)
                    ?.home_team_key ?? ""
                }
                awayTeamKey={
                  games.find((g) => g.game_uuid === selectedGameUUID)
                    ?.away_team_key ?? ""
                }
                dateTime={
                  games.find((g) => g.game_uuid === selectedGameUUID)
                    ?.date_time ?? ""
                }
                categories={selectedCategories}
                setGames={setGames}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const EmptyState = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-gray-500 text-2xl font-bold">
        No games available
      </span>
    </div>
  );
};
