import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CreateContestPredictorRequest,
  GetUpcomingGameWithContestStatusResponse,
} from "../../../types/contests";
import {
  CustomDropdown,
  DropdownOption,
} from "../../StyledDefault/CustomDropdown";
import { CustomInput } from "../../StyledDefault/CustomInput";
import { MdCheckBox, MdDelete, MdSync, MdToken } from "react-icons/md";
import { CustomButton } from "../../StyledDefault";
import {
  createContestPredictor,
  fetchContestPredictorCategorySettings as fetchContestPredictorCategorySettingsService,
  fetchLatestContestPredictorCategorySettings as fetchLatestContestPredictorCategorySettingsService,
} from "../../../services/contestService";
import { toast } from "react-toastify";
import Loading from "../../Loading";
import { GameCategory, GameQuarter } from "../../../types/general";

interface Props {
  upcomingGameUUID: string;
  gameType: string;
  categories: GameCategory[];
  teamKeys: string[];
  setGames: Dispatch<
    SetStateAction<GetUpcomingGameWithContestStatusResponse[]>
  >;
}

const getQuartersForGameType = (gameType: string): string[] => {
  switch (gameType) {
    case "cbb":
      return ["1", "2"];
    case "nhl":
      return ["1", "2", "3"];
    case "mlb":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    default:
      return ["1", "2", "3", "4"];
  }
};

const getQuarterLabel = (quarter: string, gameType: string): string => {
  const n = parseInt(quarter);
  if (gameType === "cbb") return `H${quarter}`;
  if (gameType === "nhl") return `P${quarter}`;
  if (gameType === "mlb") return `I${quarter}`;
  return `Q${quarter}`;
};

const createEmptyPoints = () => ({
  under: undefined as number | undefined,
  exact: undefined as number | undefined,
  over: undefined as number | undefined,
});

interface CategoryGroup {
  id: string;
  team_key: string;
  category: DropdownOption | null;
  value: number | undefined;
  points: {
    under: number | undefined;
    exact: number | undefined;
    over: number | undefined;
  };
}

type QuarterGroups = {
  [key: string]: CategoryGroup[];
};

export const ContestPredictor = ({
  upcomingGameUUID,
  gameType,
  categories,
  teamKeys,
  setGames,
}: Props) => {
  const teamKeyOptions = Array.from(new Set([...teamKeys, "TOTAL"])).map(
    (teamKey) => ({
      label: teamKey,
      value: teamKey,
    })
  );

  const allQuarters = useMemo(() => getQuartersForGameType(gameType), [gameType]);
  const [activeQuarters, setActiveQuarters] = useState<string[]>(["1"]);
  const [activeQuarter, setActiveQuarter] = useState<string>("1");
  const [groupsByQuarter, setGroupsByQuarter] = useState<QuarterGroups>(() => {
    const initial: QuarterGroups = {};
    allQuarters.forEach((q) => { initial[q] = []; });
    return initial;
  });
  const [isFetchingCategorySettings, setIsFetchingCategorySettings] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveTeamKey = useCallback(
    (key: string): string => {
      if (key === "home") return teamKeys[0] ?? key;
      if (key === "away") return teamKeys[1] ?? key;
      if (key === "total") return "TOTAL";
      return key;
    },
    [teamKeys]
  );

  const fetchContestPredictorCategorySettings = useCallback(
    async (upcomingGameUUIDParam: string, isLatest: boolean = false) => {
      setIsFetchingCategorySettings(true);
      const emptyGroups: QuarterGroups = {};
      allQuarters.forEach((q) => { emptyGroups[q] = []; });
      setGroupsByQuarter(emptyGroups);
      const categorySettings = isLatest
        ? await fetchLatestContestPredictorCategorySettingsService(
            upcomingGameUUIDParam
          )
        : await fetchContestPredictorCategorySettingsService(
            upcomingGameUUIDParam
          );
      if (categorySettings) {
        const groupedByQuarter: QuarterGroups = {};
        allQuarters.forEach((q) => { groupedByQuarter[q] = []; });
        const quartersInResponse = new Set<string>();

        categorySettings.forEach((setting) => {
          const quarter = String(setting.quarter);
          if (quarter && allQuarters.includes(quarter)) {
            quartersInResponse.add(quarter);
            if (!groupedByQuarter[quarter]) groupedByQuarter[quarter] = [];
            groupedByQuarter[quarter].push({
              id: `group-${Date.now()}-${Math.random()}-${quarter}`,
              team_key: isLatest ? resolveTeamKey(setting.team_key) : setting.team_key,
              category: setting.category,
              value: setting.value,
              points: setting.points ?? createEmptyPoints(),
            });
          }
        });

        setGroupsByQuarter(groupedByQuarter);

        // Set active quarters based on response, or default to first quarter if no data
        if (quartersInResponse.size > 0) {
          const sortedQuarters = Array.from(quartersInResponse).sort(
            (a, b) => parseInt(a) - parseInt(b)
          );
          setActiveQuarters(sortedQuarters);
          setActiveQuarter(sortedQuarters[0]);
        } else {
          setActiveQuarters([allQuarters[0]]);
          setActiveQuarter(allQuarters[0]);
        }
      } else {
        setActiveQuarters([allQuarters[0]]);
        setActiveQuarter(allQuarters[0]);
      }
      setIsFetchingCategorySettings(false);
    },
    [resolveTeamKey, allQuarters]
  );

  useEffect(() => {
    if (!upcomingGameUUID) {
      return;
    }

    fetchContestPredictorCategorySettings(upcomingGameUUID);
  }, [fetchContestPredictorCategorySettings, upcomingGameUUID, gameType]);

  const getAvailableCategories = (
    quarter: string,
    currentGroupId: string
  ): DropdownOption[] => {
    const currentQuarterGroups = groupsByQuarter[quarter];
    const usedCategoryValues = currentQuarterGroups
      .filter((group) => group.id !== currentGroupId && group.category)
      .map((group) => group.category!.value);

    return categories
      .filter((category) => !usedCategoryValues.includes(category.value))
      .map((category) => ({ label: category.label, value: category.value }));
  };

  const handleAddCategory = (quarter: string) => {
    const newGroup: CategoryGroup = {
      id: `group-${Date.now()}-${Math.random()}-${quarter}`,
      team_key: teamKeyOptions[0]?.value || "",
      category: null,
      value: undefined,
      points: createEmptyPoints(),
    };
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: [...groupsByQuarter[quarter], newGroup],
    });
  };

  const handleTeamKeyChange = (
    quarter: string,
    groupId: string,
    teamKey: string
  ) => {
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: groupsByQuarter[quarter].map((group) =>
        group.id === groupId ? { ...group, team_key: teamKey } : group
      ),
    });
  };

  const handleCategoryChange = (
    quarter: string,
    groupId: string,
    category: DropdownOption
  ) => {
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: groupsByQuarter[quarter].map((group) =>
        group.id === groupId
          ? { ...group, category: category.value === "" ? null : category }
          : group
      ),
    });
  };

  const handleValueChange = (
    quarter: string,
    groupId: string,
    value: number | undefined
  ) => {
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: groupsByQuarter[quarter].map((group) =>
        group.id === groupId ? { ...group, value } : group
      ),
    });
  };

  const handlePointsChange = (
    quarter: string,
    groupId: string,
    field: "under" | "exact" | "over",
    value: number | undefined
  ) => {
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: groupsByQuarter[quarter].map((group) =>
        group.id === groupId
          ? {
              ...group,
              points: {
                ...group.points,
                [field]: value,
              },
            }
          : group
      ),
    });
  };

  const handleRemoveGroup = (
    quarter: string,
    groupId: string
  ) => {
    setGroupsByQuarter({
      ...groupsByQuarter,
      [quarter]: groupsByQuarter[quarter].filter(
        (group) => group.id !== groupId
      ),
    });
  };

  const handleAddQuarter = () => {
    // Find the next quarter to add
    const nextQuarterIndex = activeQuarters.length;
    if (nextQuarterIndex < allQuarters.length) {
      const nextQuarter = allQuarters[nextQuarterIndex];
      setActiveQuarters([...activeQuarters, nextQuarter]);
      setActiveQuarter(nextQuarter);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Submit each active quarter separately
      // Make a temp settings array and add groups with their quarter, then call API once
      const settings: CreateContestPredictorRequest["settings"] = [];
      for (const quarter of activeQuarters) {
        const quarterGroups = groupsByQuarter[quarter];
        if (quarterGroups.length > 0) {
          settings.push({
            quarter: quarter as GameQuarter,
            groups: quarterGroups.map((group) => ({
              team_key: group.team_key,
              category: group.category!.value,
              value: group.value!,
              points: {
                under: group.points.under!,
                exact: group.points.exact!,
                over: group.points.over!,
              },
            })),
          });
        }
      }

      const request: CreateContestPredictorRequest = {
        upcomingGameUUID,
        settings,
      };
      console.log("log > request: ", request);
      await createContestPredictor(request);

      updateLocalGames();

      toast.success("Contest predictor created successfully");
      setIsSubmitting(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to create contest predictor: " + errorMessage);
      console.error("Error creating contest predictor:", error);
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
                  type: "predictor",
                  options: Array.from(
                    new Set([...game.contest.options, "predictor"])
                  ),
                }
              : {
                  enabled: false,
                  type: "predictor",
                  options: ["predictor"],
                },
          };
        }
        return game;
      })
    );
  };

  const isQuarterValid = (quarter: string): boolean => {
    const quarterGroups = groupsByQuarter[quarter];
    return (
      quarterGroups.length > 0 &&
      !quarterGroups.some(
        (group) =>
          group.team_key === "" ||
          group.category === null ||
          group.value === undefined ||
          group.points === undefined ||
          group.points.under === undefined ||
          group.points.exact === undefined ||
          group.points.over === undefined
      )
    );
  };

  const isButtonDisabled = !activeQuarters.every((quarter) =>
    isQuarterValid(quarter)
  );

  const canAddQuarter = activeQuarters.length < allQuarters.length;

  if (isFetchingCategorySettings) {
    return (
      <>
        <div className="w-full h-full flex items-center justify-center">
          <Loading isLight={false} />
        </div>
      </>
    );
  }

  const currentQuarterGroups = groupsByQuarter[activeQuarter];

  return (
    <div className="w-full h-full flex items-start justify-center">
      <div className="relative w-full h-fit flex flex-col border border-gray-300 rounded-md">
        {/* Quarter Tabs */}
        <div className="w-full flex items-center justify-between bg-gray-200">
          <div className="w-full flex overflow-x-auto px-2 pt-2 rounded-t-md gap-2">
            {activeQuarters.map((quarter) => {
              const isActive = activeQuarter === quarter;
              const isValid = isQuarterValid(quarter);
              return (
                <button
                  key={quarter}
                  onClick={() => setActiveQuarter(quarter)}
                  className={`
                  relative w-20 h-14 flex items-center justify-center text-lg font-medium whitespace-nowrap
                  transition-colors duration-150 rounded-t-md
                  ${
                    isActive
                      ? "bg-gray-100 text-gray-900 border-t border-l border-r border-gray-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
                >
                  <span className="flex items-center gap-2">
                    {getQuarterLabel(quarter, gameType)}
                    {isValid && (
                      <MdCheckBox size={24} className="text-green-600" />
                    )}
                  </span>
                </button>
              );
            })}
            {canAddQuarter && (
              <button
                onClick={handleAddQuarter}
                className="relative w-20 h-14 flex items-center justify-center rounded-t-md text-lg font-medium whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
              >
                <span>+</span>
              </button>
            )}
          </div>

          <CustomButton
            onClick={() =>
              fetchContestPredictorCategorySettings(upcomingGameUUID, true)
            }
            className="w-72 mr-3 flex items-center justify-center gap-2"
          >
            <MdSync size={24} className="text-white" />
            <span>Sync Latest Settings</span>
          </CustomButton>
        </div>

        {/* Quarter Content */}
        <div className="w-full h-fit flex flex-col p-4 gap-4 pb-12">
          {currentQuarterGroups.map((group) => {
            const availableCategories = getAvailableCategories(
              activeQuarter,
              group.id
            );
            const selectedCategory = group.category || {
              label: "Select category",
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
                    selected={{ label: group.team_key, value: group.team_key }}
                    options={teamKeyOptions}
                    onChange={(teamKey) =>
                      handleTeamKeyChange(
                        activeQuarter,
                        group.id,
                        teamKey.value
                      )
                    }
                    className="w-28"
                  />
                  <CustomDropdown
                    selected={selectedCategory}
                    options={dropdownOptions}
                    onChange={(category) =>
                      handleCategoryChange(activeQuarter, group.id, category)
                    }
                    className="flex-2"
                    labelClassName="w-20"
                  />
                  <span className="text-gray-900 text-xl">=</span>
                  <CustomInput
                    type="number"
                    value={group.value}
                    onChange={(e) =>
                      handleValueChange(
                        activeQuarter,
                        group.id,
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-20"
                  />

                  <span className="w-4" />
                  <MdToken size={24} className="text-gray-900" />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 text-sm">Under</span>
                      <CustomInput
                        type="number"
                        value={group.points?.under}
                        onChange={(e) =>
                          handlePointsChange(
                            activeQuarter,
                            group.id,
                            "under",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 text-sm">Exact</span>
                      <CustomInput
                        type="number"
                        value={group.points?.exact}
                        onChange={(e) =>
                          handlePointsChange(
                            activeQuarter,
                            group.id,
                            "exact",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 text-sm">Over</span>
                      <CustomInput
                        type="number"
                        value={group.points?.over}
                        onChange={(e) =>
                          handlePointsChange(
                            activeQuarter,
                            group.id,
                            "over",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveGroup(activeQuarter, group.id)}
                  className="p-2 text-red-600 hover:text-red-800 font-medium"
                >
                  <MdDelete size={24} />
                </button>
              </div>
            );
          })}

          <CustomButton
            onClick={() => handleAddCategory(activeQuarter)}
            className="w-full bg-transparent px-4 py-2 text-gray-900 rounded-md hover:bg-gray-200 border-2 border-dashed border-gray-300 font-medium text-xl cursor-pointer"
          >
            +
          </CustomButton>
        </div>

        {/* Submit Button */}
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
      </div>
    </div>
  );
};
