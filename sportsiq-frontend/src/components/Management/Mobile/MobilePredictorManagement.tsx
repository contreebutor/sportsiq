import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CustomDropdown,
  DropdownOption,
} from "../../StyledDefault/CustomDropdown";
import { CustomInput } from "../../StyledDefault/CustomInput";
import { MdDelete } from "react-icons/md";
import { CustomButton } from "../../StyledDefault";
import { toast } from "react-toastify";
import { GameCategory, GameForMobileGame } from "../../../types/general";

interface Props {
  gameUUID: string;
  homeTeamKey: string;
  awayTeamKey: string;
  dateTime: string;
  categories: GameCategory[];
  setGames: Dispatch<SetStateAction<GameForMobileGame[]>>;
}

interface FeaturedPick {
  id: string;
  pick_question: string;
  resolve_team: "home" | "away" | "total";
  resolve_category: string;
  resolve_operator: ">=" | "<=" | "==";
  resolve_value: number | undefined;
}

export const MobilePredictorManagement = ({
  gameUUID,
  homeTeamKey,
  awayTeamKey,
  dateTime,
  categories,
  setGames,
}: Props) => {
  const [featuredPicks, setFeaturedPicks] = useState<FeaturedPick[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addFeaturedPick = () => {
    setFeaturedPicks((prev) => [
      ...prev,
      {
        id: `pick-${Date.now()}-${Math.random()}`,
        pick_question: "",
        resolve_team: "home",
        resolve_category: "",
        resolve_operator: ">=",
        resolve_value: undefined,
      },
    ]);
  };

  const updateFeaturedPick = (id: string, field: string, value: unknown) => {
    setFeaturedPicks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeFeaturedPick = (id: string) => {
    setFeaturedPicks((prev) => prev.filter((p) => p.id !== id));
  };

  const fetchFeaturedPicks = async (gameId: string) => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(
        `${BACKEND_URL}/v1/manage/featured-games?game_uuid=${gameId}`
      );
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data ?? [];
      setFeaturedPicks(
        data.map((fg: any) => ({
          id: fg.id,
          pick_question: fg.pick_question ?? "",
          resolve_team: fg.resolve_team ?? "home",
          resolve_category: fg.resolve_category ?? "",
          resolve_operator: fg.resolve_operator ?? ">=",
          resolve_value: fg.resolve_value ?? undefined,
        }))
      );
    } catch {
      setFeaturedPicks([]);
    }
  };

  const handleSave = async () => {
    const validPicks = featuredPicks.filter((p) => p.pick_question.trim());
    setIsSaving(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/v1/manage/featured-games/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_uuid: gameUUID,
          home_team: homeTeamKey,
          away_team: awayTeamKey,
          start_time: dateTime,
          picks: validPicks.map((p) => ({
            pick_question: p.pick_question,
            resolve_team: p.resolve_team,
            resolve_category: p.resolve_category,
            resolve_operator: p.resolve_operator,
            resolve_value: p.resolve_value ?? 0,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Predictions saved");
      setGames((prev) =>
        prev.map((game) => {
          if (game.game_uuid !== gameUUID) return game;
          if (!game.m_game) {
            return {
              ...game,
              m_game: {
                id: "",
                enabled: true,
                games: [
                  { type: "predictor" as const, id: "", enabled: true },
                ],
              },
            };
          }
          const hasPredictor = game.m_game.games.some(
            (g) => g.type === "predictor"
          );
          if (hasPredictor) return game;
          return {
            ...game,
            m_game: {
              ...game.m_game,
              games: [
                ...game.m_game.games,
                { type: "predictor" as const, id: "", enabled: true },
              ],
            },
          };
        })
      );
      await fetchFeaturedPicks(gameUUID);
    } catch {
      toast.error("Failed to save predictions");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!gameUUID) return;
    fetchFeaturedPicks(gameUUID);
  }, [gameUUID]);

  const resolveTeamOptions: DropdownOption[] = [
    { label: homeTeamKey, value: "home" },
    { label: awayTeamKey, value: "away" },
    { label: "TOTAL", value: "total" },
  ];

  const categoryOptions: DropdownOption[] = [
    { label: "Select stat", value: "" },
    ...categories.map((c) => ({ label: c.label, value: c.value })),
  ];

  const operatorOptions: DropdownOption[] = [
    { label: "≥", value: ">=" },
    { label: "≤", value: "<=" },
    { label: "=", value: "==" },
  ];

  return (
    <div className="w-full max-w-4xl h-full flex items-start justify-center overflow-y-auto">
      <div className="relative w-full h-fit flex flex-col gap-4">
        <div className="w-full h-fit flex flex-col border border-gray-300 rounded-md p-4 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">
              Predictions (Yes/No questions shown on mobile)
            </span>
            <button
              onClick={addFeaturedPick}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Add Prediction
            </button>
          </div>
          {featuredPicks.map((pick) => (
            <div
              key={pick.id}
              className="flex flex-col gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <CustomInput
                  type="text"
                  placeholder='e.g. "Will the Yankees score 5+ runs?"'
                  value={pick.pick_question}
                  onChange={(e) =>
                    updateFeaturedPick(
                      pick.id,
                      "pick_question",
                      e.target.value
                    )
                  }
                  className="flex-1"
                />
                <button
                  onClick={() => removeFeaturedPick(pick.id)}
                  className="text-red-500 hover:text-red-700 font-bold px-2"
                >
                  <MdDelete size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Auto-resolve:</span>
                <CustomDropdown
                  selected={{
                    label:
                      pick.resolve_team === "home"
                        ? homeTeamKey
                        : pick.resolve_team === "away"
                        ? awayTeamKey
                        : "TOTAL",
                    value: pick.resolve_team,
                  }}
                  options={resolveTeamOptions}
                  onChange={(opt) =>
                    updateFeaturedPick(pick.id, "resolve_team", opt.value)
                  }
                  className="w-28"
                />
                <CustomDropdown
                  selected={
                    pick.resolve_category
                      ? {
                          label:
                            categories.find(
                              (c) => c.value === pick.resolve_category
                            )?.label ?? pick.resolve_category,
                          value: pick.resolve_category,
                        }
                      : { label: "Select stat", value: "" }
                  }
                  options={categoryOptions}
                  onChange={(opt) =>
                    updateFeaturedPick(pick.id, "resolve_category", opt.value)
                  }
                  className="w-80"
                />
                <CustomDropdown
                  selected={{
                    label:
                      pick.resolve_operator === ">="
                        ? "≥"
                        : pick.resolve_operator === "<="
                        ? "≤"
                        : "=",
                    value: pick.resolve_operator,
                  }}
                  options={operatorOptions}
                  onChange={(opt) =>
                    updateFeaturedPick(pick.id, "resolve_operator", opt.value)
                  }
                  className="w-16"
                />
                <CustomInput
                  type="number"
                  placeholder="Value"
                  value={pick.resolve_value}
                  onChange={(e) =>
                    updateFeaturedPick(
                      pick.id,
                      "resolve_value",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-24"
                />
              </div>
            </div>
          ))}
          {featuredPicks.length > 0 && (
            <CustomButton
              onClick={handleSave}
              disabled={
                isSaving ||
                featuredPicks.every((p) => !p.pick_question.trim())
              }
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
            >
              {isSaving ? "Saving..." : "Save Predictions"}
            </CustomButton>
          )}
        </div>
      </div>
    </div>
  );
};
