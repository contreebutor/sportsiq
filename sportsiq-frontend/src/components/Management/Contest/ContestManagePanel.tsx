import { useEffect, useState } from "react";
import Calendar from "./Calendar";
import {
  CustomDropdown,
  DropdownOption,
} from "../../StyledDefault/CustomDropdown";
import GameCards from "./GameCards";
import {
  updateContestEnabledStatus,
  fetchUpcomingGamesWithContestStatus,
  updateContestType,
} from "../../../services/contestService";
import { GetUpcomingGameWithContestStatusResponse } from "../../../types/contests";
import { convertToClientTimezone } from "../../../lib/utils";
import { ContestPredictor } from "./ContestPredictorManagement";
import { ContestBingo } from "./ContestBingoManagement";
import { GameCategory } from "../../../types/general";
import { userStore } from "../../../store/userStore";
import Loading from "../../Loading";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdOpenInNew,
} from "react-icons/md";
import { CustomButton } from "../../StyledDefault/CustomButton";
import { fetchGameCategories as fetchGameCategoriesService } from "../../../services/manageService";

const gameTypeOptions = [
  { label: "NBA", value: "nba" },
  { label: "NFL", value: "nfl" },
  { label: "NHL", value: "nhl" },
  { label: "CBB", value: "cbb" },
  { label: "MLB", value: "mlb" },
];

const contestTypeOptions = [
  { label: "PREDICTOR", value: "predictor" },
  { label: "BINGO", value: "bingo" },
];

export const ContestManagePanel = () => {
  const { profileID } = userStore();
  const [selectedDate, selectDate] = useState<Date>(new Date());
  const [games, setGames] = useState<
    GetUpcomingGameWithContestStatusResponse[]
  >([]);
  const [fetchingGames, setFetchingGames] = useState<boolean>(false);
  const [selectedGameUUID, setSelectedGameUUID] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<DropdownOption>({
    label: "NBA",
    value: "nba",
  });
  const [selectedContestType, setSelectedContestType] =
    useState<DropdownOption>({
      label: "PREDICTOR",
      value: "predictor",
    });
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [selectedGameTeamKeys, setSelectedGameTeamKeys] = useState<string[]>(
    []
  );

  useEffect(() => {
    fetchGameCategories();
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const day = getDayFromSelectedDate(selectedDate);

    fetchUpcomingGames(selectedGameType.value, day);
  }, [selectedDate, profileID, selectedGameType.value]);

  const fetchGameCategories = async () => {
    const categoriesData = await fetchGameCategoriesService();
    setCategories(categoriesData);
  };

  const fetchUpcomingGames = async (gameType: string, day: string) => {
    try {
      setFetchingGames(true);
      setGames([]);
      setSelectedGameUUID(null);
      setSelectedGameTeamKeys([]);
      const upcomingGames = await fetchUpcomingGamesWithContestStatus(
        gameType,
        day
      );
      if (upcomingGames.length > 0) {
        const firstUpcomingGame = upcomingGames[0];
        setSelectedGameUUID(firstUpcomingGame.id);
        setSelectedGameTeamKeys([
          firstUpcomingGame.home_team_key,
          firstUpcomingGame.away_team_key,
        ]);
        setGames(upcomingGames);
      }
    } catch (error) {
      console.error("Error fetching upcoming games with contest:", error);
    } finally {
      setFetchingGames(false);
    }
  };

  const getDayFromSelectedDate = (date: Date) => {
    return convertToClientTimezone(date.toISOString()).split("T")[0];
  };

  /// Game card toggle change to enable/disable contests
  const handleToggleChange = (gameUUID: string, enabled: boolean) => {
    if (enabled) {
      const enabledGames = games.filter((g) => g.contest?.enabled);

      if (enabledGames.length >= 1) {
        const confirm = window.confirm(
          "Are you sure you want to enable this game's contests and disable others for this day?"
        );

        if (!confirm) {
          return;
        }
      }
    }

    setGames((prev) =>
      prev.map((g: GetUpcomingGameWithContestStatusResponse) => {
        if (g.contest === null) return g;
        if (g.id === gameUUID) {
          return { ...g, contest: { ...g.contest, enabled } };
        }
        if (enabled) {
          return { ...g, contest: { ...g.contest, enabled: false } };
        }
        return g;
      })
    );

    updateContestEnabledStatus(gameUUID, enabled);
  };

  const handleGameTypeChange = (option: DropdownOption) => {
    setSelectedGameType(option);
  };

  const handleContestTypeChange = (option: DropdownOption) => {
    setSelectedContestType(option);
  };

  const handleContestTypeDropdownChange = (gameUUID: string, type: string) => {
    setGames((prev) =>
      prev.map((g: GetUpcomingGameWithContestStatusResponse) => {
        if (g.id === gameUUID) {
          return { ...g, contest: { ...g.contest, type } };
        }
        return g;
      })
    );
    updateContestType(gameUUID, type);
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
              selected={selectedGameType}
              options={gameTypeOptions}
              onChange={handleGameTypeChange}
              className="w-40"
            />
            <CustomDropdown
              selected={selectedContestType}
              options={contestTypeOptions}
              onChange={handleContestTypeChange}
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
            <CalendarButton
              selectedDate={selectedDate}
              selectDate={selectDate}
            />

            <div className="w-80 h-full border-1 border-gray-300 rounded-md bg-white p-1 mx-1 overflow-y-auto">
              {fetchingGames ? (
                <Loading isLight={false} />
              ) : games.length > 0 ? (
                <>
                  <GameCards
                    games={games}
                    selectedGameUUID={selectedGameUUID}
                    setSelectedGameUUID={setSelectedGameUUID}
                    setSelectedGameTeamKeys={setSelectedGameTeamKeys}
                    handleToggleChange={handleToggleChange}
                    handleContestTypeChange={handleContestTypeDropdownChange}
                  />
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <div className="w-full h-full">
            {selectedContestType.value === "predictor" ? (
              <ContestPredictor
                upcomingGameUUID={selectedGameUUID}
                gameType={selectedGameType.value}
                categories={categories.filter(
                  (c) => c.game_type === selectedGameType.value
                )}
                teamKeys={selectedGameTeamKeys}
                setGames={setGames}
              />
            ) : (
              <ContestBingo
                upcomingGameUUID={selectedGameUUID}
                teamKeys={selectedGameTeamKeys}
                categories={categories.filter(
                  (c) => c.game_type === selectedGameType.value
                )}
                setGames={setGames}
              />
            )}
          </div>
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

interface CalendarButtonProps {
  selectedDate: Date;
  selectDate: (date: Date) => void;
}

const CalendarButton = ({ selectedDate, selectDate }: CalendarButtonProps) => {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  return (
    <>
      <div className="w-full h-fit flex flex-col gap-2">
        <button
          onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors shadow-xs"
        >
          <span className="font-medium">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>

          {isCalendarExpanded ? (
            <MdKeyboardArrowUp size={20} />
          ) : (
            <MdKeyboardArrowDown size={20} />
          )}
        </button>

        {isCalendarExpanded && (
          <>
            <Calendar selectedDate={selectedDate} selectDate={selectDate} />
          </>
        )}
      </div>
    </>
  );
};
