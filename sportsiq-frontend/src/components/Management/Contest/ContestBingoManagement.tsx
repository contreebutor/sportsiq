import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CreateContestBingoRequest,
  FetchContestBingoCategorySetting,
  GetUpcomingGameWithContestStatusResponse,
} from "../../../types/contests";
import {
  CustomDropdown,
  DropdownOption,
} from "../../StyledDefault/CustomDropdown";
import { CustomInput } from "../../StyledDefault/CustomInput";
import { MdDelete, MdSync, MdToken } from "react-icons/md";
import { CustomButton } from "../../StyledDefault";
import { toast } from "react-toastify";
import {
  createContestBingo,
  fetchContestBingoCategorySettings as fetchContestBingoCategorySettingsService,
  fetchLatestContestBingoCategorySettings as fetchLatestContestBingoCategorySettingsService,
} from "../../../services/contestService";
import Loading from "../../Loading";
import { GameCategory } from "../../../types/general";

interface Props {
  upcomingGameUUID: string;
  categories: GameCategory[];
  teamKeys: string[];
  setGames: Dispatch<
    SetStateAction<GetUpcomingGameWithContestStatusResponse[]>
  >;
}

interface CategoryGroup {
  id: string;
  team_key: string;
  description: string;
  category: DropdownOption | null;
  value: number | undefined;
  points: number | undefined;
}

const MAX_GROUPS_COUNT = 15;

const DESCRIPTION_EXAMPLES: string[] = [
  "3-Pointers Made",
  "3-Pointers Missed",
  "Steals",
  "Turnovers",
  "Personal Fouls",
  "Points",
  "Offensive Rebounds",
  "Defensive Rebounds",
  "Blocked Shots",
  "Field Goals Attempted",
  "Field Goals Made",
  "Field Goals Missed",
  "Free Throws Attempted",
  "Free Throws Made",
  "Free Throws Missed",
  "Assists",
  "Rebounds",
];

export const ContestBingo = ({
  upcomingGameUUID,
  categories,
  teamKeys,
  setGames,
}: Props) => {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isFetchingCategorySettings, setIsFetchingCategorySettings] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!upcomingGameUUID) {
      return;
    }

    fetchContestCategorySettings(upcomingGameUUID);
  }, [upcomingGameUUID]);

  const teamKeyOptions = Array.from(new Set([...teamKeys, "TOTAL"])).map(
    (teamKey) => ({
      label: teamKey,
      value: teamKey,
    })
  );

  const resolveTeamKey = (key: string): string => {
    if (key === "home") return teamKeys[0] ?? key;
    if (key === "away") return teamKeys[1] ?? key;
    if (key === "total") return "TOTAL";
    return key;
  };

  const fetchContestCategorySettings = async (
    upcomingGameUUID: string,
    isLatest: boolean = false
  ) => {
    setIsFetchingCategorySettings(true);
    setGroups([]);
    const categorySettings = isLatest
      ? await fetchLatestContestBingoCategorySettingsService(upcomingGameUUID)
      : await fetchContestBingoCategorySettingsService(upcomingGameUUID);

    if (categorySettings) {
      // Handle both response types: single object with settings or array
      let settings: FetchContestBingoCategorySetting[];

      if (Array.isArray(categorySettings)) {
        // Latest version returns array of FetchContestBingoCategorySettingsResponse
        settings = categorySettings.flatMap((item) => item);
      } else {
        // Regular version returns single FetchContestBingoCategorySettingsResponse with settings property
        settings = categorySettings || [];
      }

      setGroups(
        settings.map((setting) => ({
          id: `group-${Date.now()}-${Math.random()}`,
          team_key: isLatest ? resolveTeamKey(setting.team_key) : setting.team_key,
          description: setting.description,
          category: setting.category,
          value: setting.value,
          points: setting.points,
        }))
      );
    }
    setIsFetchingCategorySettings(false);
  };

  // No longer filter out already-selected categories for the dropdown
  const getAvailableCategories = (): DropdownOption[] => {
    return categories.map((category) => ({
      label: category.label,
      value: category.value,
    }));
  };

  const handleAddCategory = () => {
    if (groups.length >= MAX_GROUPS_COUNT) {
      return;
    }
    const newGroup: CategoryGroup = {
      id: `group-${Date.now()}-${Math.random()}`,
      team_key: teamKeys[0],
      description: "",
      category: null,
      value: undefined,
      points: undefined,
    };
    setGroups([...groups, newGroup]);
  };

  const handleTeamKeyChange = (groupId: string, teamKey: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, team_key: teamKey } : group
      )
    );
  };

  const handleLabelChange = (groupId: string, label: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, description: label } : group
      )
    );
  };

  const handleCategoryChange = (groupId: string, category: DropdownOption) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? { ...group, category: category.value === "" ? null : category }
          : group
      )
    );
  };

  const handleValueChange = (groupId: string, value: number | undefined) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, value } : group
      )
    );
  };

  const handlePointsChange = (groupId: string, points: number | undefined) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, points } : group
      )
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter((group) => group.id !== groupId));
  };

  const handleSubmit = async () => {
    const request: CreateContestBingoRequest = {
      upcomingGameUUID,
      groups: groups.map((group) => ({
        team_key: group.team_key,
        description: group.description,
        category: group.category.value,
        value: group.value,
        points: group.points,
      })),
    };

    try {
      setIsSubmitting(true);
      await createContestBingo(request);
      updateLocalGames();

      toast.success("Contest bingo created successfully");
      setIsSubmitting(false);
    } catch (error) {
      toast.error("Failed to create contest bingo: " + error.message);
      console.error("Error creating contest bingo:", error);
      setIsSubmitting(false);
    }
  };

  const updateLocalGames = () => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id === upcomingGameUUID) {
          return {
            ...game,
            contest: game.contest
              ? {
                  ...game.contest,
                  type: "bingo",
                  options: Array.from(
                    new Set([...game.contest.options, "bingo"])
                  ),
                }
              : {
                  enabled: false,
                  type: "bingo",
                  options: ["bingo"],
                },
          };
        }
        return game;
      })
    );
  };

  const isButtonDisabled =
    groups.length < MAX_GROUPS_COUNT ||
    groups.some(
      (group) =>
        group.team_key === "" ||
        group.description === "" ||
        group.category === null ||
        group.value === undefined ||
        group.points === undefined
    );

  if (isFetchingCategorySettings) {
    return (
      <>
        <div className="w-full h-full flex items-center justify-center">
          <Loading isLight={false} />
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-full flex items-start justify-center overflow-y-auto">
      <div className="relative w-full h-fit flex flex-col gap-4">
        <div className="w-full h-fit flex flex-col border border-gray-300 rounded-md">
          {/* Header with Sync Button */}
          <div className="w-full flex items-center justify-end bg-gray-200 px-4 py-2 rounded-t-md">
            <CustomButton
              onClick={() =>
                fetchContestCategorySettings(upcomingGameUUID, true)
              }
              className="w-fit flex items-center justify-center gap-2"
            >
              <MdSync size={18} className="text-white" />
              <span>Sync Latest Settings</span>
            </CustomButton>
          </div>

          {/* Content */}
          <div className="w-full h-fit flex flex-col p-4 gap-4 pb-12">
            {groups.map((group, index) => {
              const availableCategories = getAvailableCategories();
              const selectedCategory = group.category || {
                label: "Select category",
                value: "",
              };
              const selectedTeamKey = group.team_key
                ? {
                    label: group.team_key,
                    value: group.team_key,
                  }
                : {
                    label: "Select team",
                    value: "",
                  };
              const dropdownOptions = group.category
                ? availableCategories
                : [
                    { label: "Select category", value: "" },
                    ...availableCategories,
                  ];

              return (
                <div
                  key={group.id}
                  className="w-full flex items-start gap-4 rounded-md"
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <CustomDropdown
                      selected={selectedTeamKey}
                      options={teamKeyOptions}
                      onChange={(teamKey) =>
                        handleTeamKeyChange(group.id, teamKey.value)
                      }
                      className="w-32"
                    />
                    <CustomInput
                      type="text"
                      placeholder={DESCRIPTION_EXAMPLES[index]}
                      value={group.description}
                      onChange={(e) =>
                        handleLabelChange(group.id, e.target.value)
                      }
                      className="flex-2"
                    />
                    <CustomDropdown
                      selected={selectedCategory}
                      options={dropdownOptions}
                      onChange={(category) =>
                        handleCategoryChange(group.id, category)
                      }
                      className="flex-2"
                    />
                    <span className="text-gray-900 text-xl">≥</span>
                    <CustomInput
                      type="number"
                      value={group.value}
                      onChange={(e) =>
                        handleValueChange(
                          group.id,
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-20"
                    />

                    <span className="w-4" />
                    <MdToken size={24} className="text-gray-900" />
                    <span className="text-gray-900 text-xl">=</span>
                    <CustomInput
                      type="number"
                      value={group.points}
                      onChange={(e) =>
                        handlePointsChange(
                          group.id,
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-20"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="p-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    <MdDelete size={24} />
                  </button>
                </div>
              );
            })}

            <CustomButton
              onClick={handleAddCategory}
              disabled={groups.length >= MAX_GROUPS_COUNT}
              className="w-full bg-transparent px-4 py-2 text-gray-900 rounded-md hover:bg-gray-200 border-2 border-dashed border-gray-300 font-medium text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {groups.length >= MAX_GROUPS_COUNT
                ? `Maximum ${MAX_GROUPS_COUNT} groups reached`
                : "+"}
            </CustomButton>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="absolute -bottom-7 w-full flex items-center justify-center">
            <div className="w-fit p-2 rounded-md bg-gray-100 border border-gray-300">
              <CustomButton
                onClick={handleSubmit}
                disabled={isButtonDisabled || isSubmitting}
                className="w-80 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </CustomButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
