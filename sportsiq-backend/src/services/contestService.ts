import {
  CreateBingoRequest,
  CreatePredictorRequest,
  GameQuarter,
  GameType,
} from "../types";
import { supabase } from "../utils/supabase";
import {
  fetchSportsIQPoints,
  getToday,
  upsertMultipleSportsIQPoints,
  wait,
} from "./generalService";
import { sendSMS as twilioSendSMS } from "./twilioService";
import { config } from "../config";
import { fetchGameCategories } from "./manageService";

const DEFAULT_MAIN_QUARTERS = ["1", "2", "3", "4"];
const CBB_MAIN_QUARTERS = ["1", "2"];
const NHL_MAIN_PERIODS = ["1", "2", "3"];
const MLB_MAIN_INNINGS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const getMainQuartersForGameType = (gameType: string): string[] => {
  switch (gameType) {
    case "cbb":
      return CBB_MAIN_QUARTERS;
    case "nhl":
      return NHL_MAIN_PERIODS;
    case "mlb":
      return MLB_MAIN_INNINGS;
    default:
      return DEFAULT_MAIN_QUARTERS;
  }
};

const getLastQuarterForGameType = (gameType: string): string => {
  const quarters = getMainQuartersForGameType(gameType);
  return quarters[quarters.length - 1];
};

const FRONTEND_URL = config.frontendUrl;

// ─── Default Settings helpers ───────────────────────────────────────────────

const upsertContestDefaultSettings = async ({
  game_type,
  contest_type,
  settings,
}: {
  game_type: string;
  contest_type: "bingo" | "predictor";
  settings: Record<string, unknown>[];
}) => {
  try {
    const { error } = await supabase
      .from("contest_default_settings")
      .upsert(
        {
          game_type,
          contest_type,
          settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "game_type, contest_type" }
      );

    if (error) {
      console.error("Error upserting contest default settings: ", error);
      throw new Error(
        "Error upserting contest default settings: " + error.message
      );
    }
  } catch (error) {
    console.error("Error upserting contest default settings: ", error);
    throw new Error(
      "Internal server error while upserting contest default settings"
    );
  }
};

const fetchContestDefaultSettings = async ({
  game_type,
  contest_type,
}: {
  game_type: string;
  contest_type: "bingo" | "predictor";
}): Promise<Record<string, unknown>[]> => {
  try {
    const { data, error } = await supabase
      .from("contest_default_settings")
      .select("settings")
      .eq("game_type", game_type)
      .eq("contest_type", contest_type)
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching contest default settings: ", error);
      throw new Error(
        "Error fetching contest default settings: " + error.message
      );
    }

    if (!data) {
      console.error("No default settings found");
      throw new Error("No default settings found");
    }

    return data.settings;
  } catch (error) {
    console.error("Error fetching contest default settings: ", error);
    throw new Error(
      "Internal server error while fetching contest default settings"
    );
  }
};

// ─── Contest creation ───────────────────────────────────────────────────────

export const createPredictor = async (request: CreatePredictorRequest) => {
  /// 1. upsert `abstract_contests` with `upcoming_game_uuid`, `type` = 'predictor', and `enabled` = false. Return the `abstract_contest_id`.
  const absContestID = await upsertAbstractContestAndGetID(
    request.upcoming_game_uuid,
    "predictor"
  );

  /// 2. fetch all `profile_id`s from `profiles` table. And make an array of `profile_id`s.
  const profileIDs = await supabaseFetchAllProfileIDs();

  /// 3. map all `profile_id`s to an array of objects with `abstract_contest_id`, `profile_id`.
  const contests = profileIDs.map((profileID) => ({
    abstract_contest_id: absContestID,
    profile_id: profileID,
  }));

  /// 4. upsert `contests` with the array of objects from step 3. Return the `contest_id`s and `profile_id`s and map them to an object with `profile_id` as the key and `contest_id` as the value.
  const contestsForProfileIDs = await supabaseUpsertContests(contests);

  await upsertPrizes({ profileIDs, contestsForProfileIDs });

  /// 7. upsert `abstract_contest_predictors` with `abstract_contest_id`. Return `abstract_contest_predictor_id`.
  const abstract_contest_predictor_id =
    await upsertAbstractContestPredictorAndGetID(absContestID);

  /// 8. For all `profile_id`s, upsert `contest_predictors` with `abstract_contest_predictor_id`, `profile_id`.
  await upsertContestPredictors(abstract_contest_predictor_id, profileIDs);

  /// 9. Fetch `id` and `value` from `contest_categories` table. And map them to an object with `value` as the key and `id` as the value.
  const gameCategories = await fetchGameCategories();

  /// 10. For all request.groups, convert the `category` to `id` using the object from step 9. And map them to an array of objects with `category_id`, `value`, `points`.
  const contestPredictorSettings: {
    abstract_contest_predictor_id: string;
    quarter: GameQuarter;
    team_key: string;
    category_id: string;
    value: number;
    points_under: number;
    points_exact: number;
    points_over: number;
    enabled: boolean;
  }[] = [];

  request.settings.forEach((setting) => {
    setting.groups.forEach((group) => {
      contestPredictorSettings.push({
        abstract_contest_predictor_id,
        quarter: setting.quarter,
        team_key: group.team_key,
        category_id: gameCategories.find(
          (category) => category.value === group.category
        )?.id,
        value: group.value,
        points_under: group.points.under,
        points_exact: group.points.exact,
        points_over: group.points.over,
        enabled: true,
      });
    });
  });

  /// 11. Set `enabled` field to false for all `contest_predictor_categories` where the `abstract_contest_predictor_id` is the same as the `abstract_contest_predictor_id` from step 7.
  await disableContestPredictorCategories(abstract_contest_predictor_id);

  /// 12. For each item of the array from step 10, upsert `contest_predictor_categories` with `abstract_contest_predictor_id` and `category_id` and `value` and `points`.
  await upsertContestPredictorCategories(contestPredictorSettings);

  /// 13. Save settings as defaults for this game type so they survive game removal.
  const { game_type, home_team_key, away_team_key } = await fetchUpcomingGameByUUID(
    request.upcoming_game_uuid
  );
  await upsertContestDefaultSettings({
    game_type,
    contest_type: "predictor",
    settings: request.settings.map((setting) => ({
      quarter: setting.quarter,
      groups: setting.groups.map((group) => ({
        team_key:
          group.team_key === home_team_key
            ? "home"
            : group.team_key === away_team_key
            ? "away"
            : "total",
        category: group.category,
        value: group.value,
        points: group.points,
      })),
    })),
  });

  return "Predictor created successfully";
};

export const createBingo = async (request: CreateBingoRequest) => {
  /// 1. upsert `abstract_contests` with `upcoming_game_uuid`, `type` = 'bingo', and `enabled` = false. Return the `abstract_contest_id`.
  const absContestID = await upsertAbstractContestAndGetID(
    request.upcoming_game_uuid,
    "bingo"
  );

  /// 2. fetch all `profile_id`s from `profiles` table. And make an array of `profile_id`s.
  const profileIDs = await supabaseFetchAllProfileIDs();

  /// 3. map all `profile_id`s to an array of objects with `abstract_contest_id`, `profile_id`.
  const contests = profileIDs.map((profileID) => ({
    abstract_contest_id: absContestID,
    profile_id: profileID,
  }));

  /// 4. upsert `contests` with the array of objects from step 3. Return the `contest_id`s and `profile_id`s and map them to an object with `profile_id` as the key and `contest_id` as the value.
  const contestsForProfileIDs = await supabaseUpsertContests(contests);

  await upsertPrizes({ profileIDs, contestsForProfileIDs });

  /// 7. upsert `abstract_contest_bingos` with `abstract_contest_id`. Return `abstract_contest_bingo_id`.
  const abstract_contest_bingo_id = await upsertAbstractContestBingoAndGetID(
    absContestID
  );

  /// 8. For all `profile_id`s, upsert `contest_bingos` with `abstract_contest_bingo_id`, `profile_id`.
  await upsertContestBingos(abstract_contest_bingo_id, profileIDs);

  /// 9. Fetch `id` and `value` from `contest_categories` table. And map them to an object with `value` as the key and `id` as the value.
  const gameCategories = await fetchGameCategories();

  /// 10. For all request.groups, convert the `category` to `id` using the object from step 9. And map them to an array of objects with `category_id`, `description`, `value`, `points`.
  const contestBingoCategories = request.groups.map((group) => ({
    abstract_contest_bingo_id,
    category_id: gameCategories.find(
      (category) => category.value === group.category
    )?.id,
    team_key: group.team_key,
    description: group.description,
    value: group.value,
    points: group.points,
    enabled: true,
  }));

  /// 11. Set `enabled` field to false for all `contest_bingo_categories` where the `abstract_contest_bingo_id` is the same as the `abstract_contest_bingo_id` from step 7.
  await disableContestBingoCategories(abstract_contest_bingo_id);

  /// 12. For each item of the array from step 10, upsert `contest_bingo_categories` with `abstract_contest_bingo_id` and `category_id` and `value` and `completed` and `points`.
  await upsertContestBingoCategories(contestBingoCategories);

  /// 13. Save settings as defaults for this game type so they survive game removal.
  const { game_type, home_team_key, away_team_key } = await fetchUpcomingGameByUUID(
    request.upcoming_game_uuid
  );
  await upsertContestDefaultSettings({
    game_type,
    contest_type: "bingo",
    settings: request.groups.map((group) => ({
      team_key:
        group.team_key === home_team_key
          ? "home"
          : group.team_key === away_team_key
          ? "away"
          : "total",
      description: group.description,
      category: group.category,
      value: group.value,
      points: group.points,
    })),
  });

  return "Bingo created successfully";
};

export const fetchUpcomingContestToday = async () => {
  try {
    const { data, error } = await supabase
      .from("view_enabled_contests_with_game_uuid_status")
      .select(
        `
          abstract_contest_id,
          contest_type,
          game_uuid,
          game_type,
          game_status,
          date_time,
          game_over_at
        `
      )
      .eq("day", getToday());

    if (error) {
      console.error("Error fetching upcoming contests today: ", error);
      throw new Error(
        "Error fetching upcoming contests today: " + error.message
      );
    }

    if (!data || data.length === 0) {
      return null;
    }

    const sortedData = data.sort((a, b) => {
      return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
    });

    return sortedData[0];
  } catch (error) {
    console.error("Error fetching upcoming contests today: ", error);
    throw new Error(
      "Internal server error while fetching upcoming contests today"
    );
  }
};

export const fetchBingoForPreGame = async (
  abstract_contest_id: string,
  profile_id: string
): Promise<{
  contest_bingo_id: string;
  prizes: { [key: string]: string };
  categories: {
    team_key: string;
    description: string;
    points: number;
  }[];
}> => {
  try {
    const [categories, prizesAndPoints] = await Promise.all([
      supabaseFetchBingoCategories({
        absContestID: abstract_contest_id,
        profileID: profile_id,
      }),
      supabaseFetchBingoPrizesAndPoints({
        absContestID: abstract_contest_id,
        profileID: profile_id,
      }),
    ]);

    const contestBingoID = prizesAndPoints.contestBingoID;
    const pointsBar = prizesAndPoints.pointsBar;
    const pointsSportsIQ = prizesAndPoints.pointsSportsIQ;

    const prizes = prizesAndPoints.prizes
      ? prizesAndPoints.prizes
      : pointsBar
      ? getPoints(pointsBar, "bar")
      : getPoints(pointsSportsIQ, "sportsiq");

    return {
      contest_bingo_id: contestBingoID,
      prizes: prizes,
      categories: categories.map((category) => ({
        team_key: category.team_key,
        description: `${category.value} ${category.description}`,
        points: category.points,
      })),
    };
  } catch (error) {
    console.error("Error fetching contest bingo for pre-game: ", error);
    throw new Error(
      "Internal server error while fetching contest bingo for pre-game"
    );
  }
};

export const getBingoCards = async (
  contest_bingo_id: string,
  contest_user_id: string
): Promise<
  {
    id: string;
    quarter: string;
    squares: {
      [key: number]: {
        team_key: string;
        description: string;
        completed: boolean;
        done: number;
        total: number;
        points: number;
      };
    };
    retryable: boolean;
  }[]
> => {
  /**
   * Fetch `contest_bingo_cards` by `contest_bingo_id` and `contest_user_id`.
   */
  let contestBingoCards = [];
  const [
    contestBingoCardsResult,
    bingoCategories,
    { abs_contest_id, game_type }, /// TODO: remove `game_type` from the return value.
  ] = await Promise.all([
    fetchContestBingoCards(contest_bingo_id, contest_user_id),
    supabaseFetchBingoCategories({ contestBingoID: contest_bingo_id }),
    fetchAbsContestIDAndGameType(contest_bingo_id),
  ]);
  contestBingoCards = contestBingoCardsResult;

  /**
   * If the `contest_bingo_cards` is not found, generate new bingo cards.
   */
  let remainingQuarters: string[] = getMainQuartersForGameType(game_type);
  if (contestBingoCards.length === 0) {
    /**
     * TODO: filter out the quarters that are already completed.
     */
    let gameQuarter: string = "0";

    const upcomingContestToday = await fetchUpcomingContestToday();

    if (upcomingContestToday) {
      const { game_status, game_uuid } = upcomingContestToday;
      if (["Final", "F/OT"].includes(game_status)) {
        gameQuarter = "4";
      } else if (game_status === "InProgress") {
        const { quarter } = await fetchGameByGameUUID(game_uuid);
        gameQuarter = quarter;

        if (gameQuarter && !remainingQuarters.includes(gameQuarter)) {
          if (gameQuarter.toUpperCase() === "HALF") {
            gameQuarter = "2";
          } else {
            gameQuarter = "4";
          }
        }
      }
    }

    remainingQuarters = remainingQuarters.slice(
      remainingQuarters.indexOf(gameQuarter) + 1
    );

    const contestBingoCategoryIDs = bingoCategories.map(
      (category) => category.id
    );
    const bingoCardsToUpsert = remainingQuarters.map((quarter) => ({
      contest_bingo_id,
      contest_user_id,
      quarter,
      square_ids: getRandomSquareIDs(contestBingoCategoryIDs),
      retryable: true,
    }));

    /**
     * upsert bingo cards to the `contest_bingo_cards` table.
     */
    if (bingoCardsToUpsert.length > 0) {
      contestBingoCards = await upsertContestBingoCards(bingoCardsToUpsert);
    }
  }

  const categoryRecords: Record<
    string,
    { team_key: string; description: string; points: number }
  > = {};
  bingoCategories.forEach((category) => {
    categoryRecords[category.id] = {
      team_key: category.team_key,
      description: `${category.value} ${category.description}`,
      points: category.points,
    };
  });

  const bingoCategoryProgress = await getBingoCategoryProgressByQuarter(
    abs_contest_id,
    remainingQuarters
  );

  return contestBingoCards.map((card) => {
    const categoryProgress = bingoCategoryProgress[card.quarter];
    const firstSquareProgress = categoryProgress[card.square_ids[1]];
    const secondSquareProgress = categoryProgress[card.square_ids[2]];
    const thirdSquareProgress = categoryProgress[card.square_ids[3]];
    const fourthSquareProgress = categoryProgress[card.square_ids[4]];
    const fifthSquareProgress = categoryProgress[card.square_ids[5]];
    const sixthSquareProgress = categoryProgress[card.square_ids[6]];
    const seventhSquareProgress = categoryProgress[card.square_ids[7]];
    const eighthSquareProgress = categoryProgress[card.square_ids[8]];
    const ninthSquareProgress = categoryProgress[card.square_ids[9]];

    const squares = {
      1: {
        team_key: categoryRecords[card.square_ids[1]].team_key,
        description: categoryRecords[card.square_ids[1]].description,
        completed: firstSquareProgress?.completed || false,
        done: firstSquareProgress?.done || 0,
        total: firstSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[1]].points,
      },
      2: {
        team_key: categoryRecords[card.square_ids[2]].team_key,
        description: categoryRecords[card.square_ids[2]].description,
        completed: secondSquareProgress?.completed || false,
        done: secondSquareProgress?.done || 0,
        total: secondSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[2]].points,
      },
      3: {
        team_key: categoryRecords[card.square_ids[3]].team_key,
        description: categoryRecords[card.square_ids[3]].description,
        completed: thirdSquareProgress?.completed || false,
        done: thirdSquareProgress?.done || 0,
        total: thirdSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[3]].points,
      },
      4: {
        team_key: categoryRecords[card.square_ids[4]].team_key,
        description: categoryRecords[card.square_ids[4]].description,
        completed: fourthSquareProgress?.completed || false,
        done: fourthSquareProgress?.done || 0,
        total: fourthSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[4]].points,
      },
      5: {
        team_key: categoryRecords[card.square_ids[5]].team_key,
        description: categoryRecords[card.square_ids[5]].description,
        completed: fifthSquareProgress?.completed || false,
        done: fifthSquareProgress?.done || 0,
        total: fifthSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[5]].points,
      },
      6: {
        team_key: categoryRecords[card.square_ids[6]].team_key,
        description: categoryRecords[card.square_ids[6]].description,
        completed: sixthSquareProgress?.completed || false,
        done: sixthSquareProgress?.done || 0,
        total: sixthSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[6]].points,
      },
      7: {
        team_key: categoryRecords[card.square_ids[7]].team_key,
        description: categoryRecords[card.square_ids[7]].description,
        completed: seventhSquareProgress?.completed || false,
        done: seventhSquareProgress?.done || 0,
        total: seventhSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[7]].points,
      },
      8: {
        team_key: categoryRecords[card.square_ids[8]].team_key,
        description: categoryRecords[card.square_ids[8]].description,
        completed: eighthSquareProgress?.completed || false,
        done: eighthSquareProgress?.done || 0,
        total: eighthSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[8]].points,
      },
      9: {
        team_key: categoryRecords[card.square_ids[9]].team_key,
        description: categoryRecords[card.square_ids[9]].description,
        completed: ninthSquareProgress?.completed || false,
        done: ninthSquareProgress?.done || 0,
        total: ninthSquareProgress?.total || 0,
        points: categoryRecords[card.square_ids[9]].points,
      },
    };

    return {
      id: card.id,
      quarter: card.quarter,
      squares: squares,
      retryable: card.retryable,
    };
  });
};

export const fetchGameInfoByBingoID = async (bingo_id: string) => {
  try {
    const { data, error } = await supabase
      .from("view_game_teams_by_contest_bingo_id")
      .select(
        `
          game_type,
          status,
          date_time,
          home_team_key,
          home_team_logo_url,
          home_team_primary_color,
          home_team_wins,
          home_team_losses,
          away_team_key,
          away_team_logo_url,
          away_team_primary_color,
          away_team_wins,
          away_team_losses,
          quarter,
          time_remaining_minutes,
          time_remaining_seconds
        `
      )
      .eq("contest_bingo_id", bingo_id)
      .limit(1);

    if (error) {
      console.error("Error fetching game info by bingo ID: ", error);
      throw new Error(
        "Error fetching game info by contest bingo ID: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from fetching game info by bingo ID");
      throw new Error("No data returned from fetching game info by bingo ID");
    }

    return data[0];
  } catch (error) {
    console.error("Error fetching game info by bingo ID: ", error);
    throw new Error(
      "Internal server error while fetching game info by bingo ID"
    );
  }
};

export const createUserForBingo = async (
  contest_bingo_id: string,
  phone: string,
  nickname: string
) => {
  const contestID = await fetchContestID({
    contest_bingo_id,
  });
  const contestUserID = await upsertContestUserAndGetID(
    contestID,
    phone,
    nickname
  );

  return {
    contest_user_id: contestUserID,
  };
};

export const createUserForPredictor = async (
  contest_predictor_id: string,
  phone: string,
  nickname: string
) => {
  const contestID = await fetchContestID({
    contest_predictor_id,
  });
  const contestUserID = await upsertContestUserAndGetID(
    contestID,
    phone,
    nickname
  );

  return {
    contest_user_id: contestUserID,
  };
};

export const getAnotherBingoCard = async (
  contest_bingo_card_id: string
): Promise<{
  id: string;
  quarter: string;
  squares: {
    [key: number]: {
      team_key: string;
      description: string;
      completed: boolean;
      done: number;
      total: number;
      points: number;
    };
  };
  retryable: boolean;
} | null> => {
  /**
   * Check if the contest bingo card is retryable.
   */
  const contestBingoCard = await fetchContestBingoCard(contest_bingo_card_id);

  /**
   * If it is not retryable, return null.
   */

  if (!contestBingoCard.retryable) {
    return null;
  }

  /**
   * If it is retryable, generate new square IDs and upsert the contest bingo card.
   */
  const contestBingoID = contestBingoCard.contest_bingo_id;

  /**
   * Fetch all `contest_bingo_categories` by `contest_bingo_id`.
   */
  const contestBingoCategories = await supabaseFetchBingoCategories({
    contestBingoID: contestBingoID,
  });
  const categoryRecords: Record<
    string,
    { team_key: string; description: string; points: number }
  > = {};
  contestBingoCategories.forEach((category) => {
    categoryRecords[category.id] = {
      team_key: category.team_key,
      description: `${category.value} ${category.description}`,
      points: category.points,
    };
  });
  const contestBingoCategoryIDs = contestBingoCategories.map(
    (category) => category.id
  );

  /**
   * Generate new square IDs.
   */
  const newSquareIDs = getRandomSquareIDs(contestBingoCategoryIDs);

  /**
   * Upsert the contest bingo card with the new square IDs.
   */
  const bingoCardToUpsert = {
    ...contestBingoCard,
    square_ids: newSquareIDs,
    retryable: false,
  };
  const newBingoCards = await upsertContestBingoCards([bingoCardToUpsert]);
  const newBingoCard = newBingoCards[0];
  const quarter = newBingoCard.quarter;
  const { abs_contest_id } = await fetchAbsContestIDAndGameType(contestBingoID);
  const bingoCategoryProgress = await getBingoCategoryProgressByQuarter(
    abs_contest_id,
    [quarter]
  );
  const categoryProgress = bingoCategoryProgress[newBingoCard.quarter];
  const firstSquareProgress = categoryProgress[newBingoCard.square_ids[1]];
  const secondSquareProgress = categoryProgress[newBingoCard.square_ids[2]];
  const thirdSquareProgress = categoryProgress[newBingoCard.square_ids[3]];
  const fourthSquareProgress = categoryProgress[newBingoCard.square_ids[4]];
  const fifthSquareProgress = categoryProgress[newBingoCard.square_ids[5]];
  const sixthSquareProgress = categoryProgress[newBingoCard.square_ids[6]];
  const seventhSquareProgress = categoryProgress[newBingoCard.square_ids[7]];
  const eighthSquareProgress = categoryProgress[newBingoCard.square_ids[8]];
  const ninthSquareProgress = categoryProgress[newBingoCard.square_ids[9]];

  const squares = {
    1: {
      team_key: categoryRecords[newBingoCard.square_ids[1]].team_key,
      description: categoryRecords[newBingoCard.square_ids[1]].description,
      completed: false,
      done: firstSquareProgress?.done || 0,
      total: firstSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[1]].points,
    },
    2: {
      team_key: categoryRecords[newBingoCard.square_ids[2]].team_key,
      description: categoryRecords[newBingoCard.square_ids[2]].description,
      completed: false,
      done: secondSquareProgress?.done || 0,
      total: secondSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[2]].points,
    },
    3: {
      team_key: categoryRecords[newBingoCard.square_ids[3]].team_key,
      description: categoryRecords[newBingoCard.square_ids[3]].description,
      completed: false,
      done: thirdSquareProgress?.done || 0,
      total: thirdSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[3]].points,
    },
    4: {
      team_key: categoryRecords[newBingoCard.square_ids[4]].team_key,
      description: categoryRecords[newBingoCard.square_ids[4]].description,
      completed: false,
      done: fourthSquareProgress?.done || 0,
      total: fourthSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[4]].points,
    },
    5: {
      team_key: categoryRecords[newBingoCard.square_ids[5]].team_key,
      description: categoryRecords[newBingoCard.square_ids[5]].description,
      completed: false,
      done: fifthSquareProgress?.done || 0,
      total: fifthSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[5]].points,
    },
    6: {
      team_key: categoryRecords[newBingoCard.square_ids[6]].team_key,
      description: categoryRecords[newBingoCard.square_ids[6]].description,
      completed: false,
      done: sixthSquareProgress?.done || 0,
      total: sixthSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[6]].points,
    },
    7: {
      team_key: categoryRecords[newBingoCard.square_ids[7]].team_key,
      description: categoryRecords[newBingoCard.square_ids[7]].description,
      completed: false,
      done: seventhSquareProgress?.done || 0,
      total: seventhSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[7]].points,
    },
    8: {
      team_key: categoryRecords[newBingoCard.square_ids[8]].team_key,
      description: categoryRecords[newBingoCard.square_ids[8]].description,
      completed: false,
      done: eighthSquareProgress?.done || 0,
      total: eighthSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[8]].points,
    },
    9: {
      team_key: categoryRecords[newBingoCard.square_ids[9]].team_key,
      description: categoryRecords[newBingoCard.square_ids[9]].description,
      completed: false,
      done: ninthSquareProgress?.done || 0,
      total: ninthSquareProgress?.total || 0,
      points: categoryRecords[newBingoCard.square_ids[9]].points,
    },
  };

  /**
   * Return the new contest bingo card.
   */
  return {
    id: newBingoCard.id,
    quarter: newBingoCard.quarter,
    squares: squares,
    retryable: newBingoCard.retryable,
  };
};

export const fetchUpcomingGames = async (game_type: GameType, day: string) => {
  const MAIN_GAME_STATUSES = ["Scheduled", "InProgress", "Final", "F/OT"];
  try {
    const { data, error } = await supabase
      .from("view_upcoming_games_with_contest_status")
      .select(
        `
          id, 
          date_time, 

          contest_enabled,
          contest_type,
          contest_type_options,

          home_team_key, 
          home_team_logo_url, 
          home_team_primary_color, 
          home_team_wins, 
          home_team_losses, 
          away_team_key, 
          away_team_logo_url, 
          away_team_primary_color, 
          away_team_wins, 
          away_team_losses
        `
      )
      .eq("game_type", game_type)
      .eq("day", day)
      .in("game_status", MAIN_GAME_STATUSES)
      .order("date_time", { ascending: true })
      .order("game_id", { ascending: true });

    if (error) {
      console.error(
        "Error fetching upcoming games with contest status: ",
        error
      );
      throw new Error(
        "Error fetching upcoming games with contest status: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching upcoming games with contest status"
      );
      throw new Error(
        "No data returned from fetching upcoming games with contest status"
      );
    }

    return data.map((game) => ({
      id: game.id,
      date_time: game.date_time,
      home_team_key: game.home_team_key,
      home_team_logo_url: game.home_team_logo_url,
      home_team_primary_color: game.home_team_primary_color,
      home_team_wins: game.home_team_wins,
      home_team_losses: game.home_team_losses,
      away_team_key: game.away_team_key,
      away_team_logo_url: game.away_team_logo_url,
      away_team_primary_color: game.away_team_primary_color,
      away_team_wins: game.away_team_wins,
      away_team_losses: game.away_team_losses,
      contest:
        game.contest_enabled !== null
          ? {
              enabled: game.contest_enabled,
              type: game.contest_type,
              options: game.contest_type_options,
            }
          : null,
    }));
  } catch (error) {
    console.error("Error fetching upcoming games with contest status: ", error);
    throw new Error(
      "Internal server error while fetching upcoming games with contest status"
    );
  }
};

export const updateEnabledStatus = async (
  upcoming_game_uuid: string,
  enabled: boolean
) => {
  try {
    const { error } = await supabase
      .from("abstract_contests")
      .update({ enabled })
      .eq("upcoming_game_uuid", upcoming_game_uuid);

    if (error) {
      console.error("Error updating contest enabled status: ", error);
      throw new Error(
        "Error updating contest enabled status: " + error.message
      );
    }

    return enabled;
  } catch (error) {
    console.error("Error updating contest enabled status: ", error);
    throw new Error(
      "Internal server error while updating contest enabled status"
    );
  }
};

export const fetchBingoCategorySettings = async (
  upcoming_game_uuid: string
) => {
  try {
    const { data, error } = await supabase
      .from("view_contest_bingo_settings_by_upcoming_game_uuid")
      .select(
        "id, team_key, description, category_label, category_value, value, points"
      )
      .eq("upcoming_game_uuid", upcoming_game_uuid)
      .order("team_key", { ascending: true })
      .order("points", { ascending: true })
      .order("category_value", { ascending: true });

    if (error) {
      console.error("Error fetching contest bingo category settings: ", error);
      throw new Error(
        "Error fetching contest bingo category settings: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest bingo category settings"
      );
      throw new Error(
        "No data returned from fetching contest bingo category settings"
      );
    }

    const formattedSettings = data.map((item) => ({
      id: item.id,
      team_key: item.team_key,
      description: item.description,
      category: {
        label: item.category_label,
        value: item.category_value,
      },
      value: item.value,
      points: item.points,
    }));

    return formattedSettings;
  } catch (error) {
    console.error("Error fetching contest bingo category settings: ", error);
    throw new Error(
      "Internal server error while fetching contest bingo category settings"
    );
  }
};

export const fetchLatestBingoCategorySettings = async (
  upcoming_game_uuid: string
) => {
  const { game_type } = await fetchUpcomingGameByUUID(upcoming_game_uuid);

  const defaultSettings = await fetchContestDefaultSettings({
    game_type,
    contest_type: "bingo",
  });

  const gameCategories = await fetchGameCategories();

  const formattedSettings = (
    defaultSettings as {
      team_key: string;
      description: string;
      category: string;
      value: number;
      points: number;
    }[]
  ).map((setting) => {
    const categoryInfo = gameCategories.find(
      (cat) => cat.value === setting.category
    );
    return {
      id: "",
      team_key: setting.team_key,
      description: setting.description,
      category: {
        label: categoryInfo?.label ?? setting.category,
        value: setting.category,
      },
      value: setting.value,
      points: setting.points,
    };
  });

  return formattedSettings;
};

export const fetchPredictorCategorySettings = async ({
  abs_contest_id,
  upcoming_game_uuid,
}: {
  abs_contest_id?: string;
  upcoming_game_uuid?: string;
}): Promise<
  {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[]
> => {
  try {
    let query = supabase
      .from("view_contest_predictor_category_settings")
      .select(
        `
          id, 
          quarter, 
          team_key, 
          category_label, 
          category_value, 
          value, 
          points_under, 
          points_exact, 
          points_over
        `
      );

    if (abs_contest_id) {
      query = query.eq("abs_contest_id", abs_contest_id);
    }

    if (upcoming_game_uuid) {
      query = query.eq("upcoming_game_uuid", upcoming_game_uuid);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Error fetching contest predictor category settings: ",
        error
      );
      throw new Error(
        "Error fetching contest predictor category settings: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest predictor category settings"
      );
      throw new Error(
        "No data returned from fetching contest predictor category settings"
      );
    }

    const formattedSettings = data.map((item) => ({
      id: item.id,
      quarter: item.quarter,
      team_key: item.team_key,
      category: {
        label: item.category_label,
        value: item.category_value,
      },
      value: item.value,
      points: {
        under: item.points_under,
        exact: item.points_exact,
        over: item.points_over,
      },
    }));

    return formattedSettings;
  } catch (error) {
    console.error(
      "Error fetching contest predictor category settings: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest predictor category settings"
    );
  }
};

export const fetchLatestPredictorCategorySettings = async ({
  upcoming_game_uuid,
}: {
  upcoming_game_uuid: string;
}): Promise<
  {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[]
> => {
  const { game_type } = await fetchUpcomingGameByUUID(upcoming_game_uuid);

  const defaultSettings = await fetchContestDefaultSettings({
    game_type,
    contest_type: "predictor",
  });

  const gameCategories = await fetchGameCategories();

  const formattedSettings: {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[] = [];

  (
    defaultSettings as {
      quarter: GameQuarter;
      groups: {
        team_key: string;
        category: string;
        value: number;
        points: { under: number; exact: number; over: number };
      }[];
    }[]
  ).forEach((setting) => {
    setting.groups.forEach((group) => {
      const categoryInfo = gameCategories.find(
        (cat) => cat.value === group.category
      );
      formattedSettings.push({
        id: 0,
        quarter: setting.quarter,
        team_key: group.team_key,
        category: {
          label: categoryInfo?.label ?? group.category,
          value: group.category,
        },
        value: group.value,
        points: group.points,
      });
    });
  });

  return formattedSettings;
};

export const updateContestType = async (
  upcoming_game_uuid: string,
  type: string
) => {
  try {
    const { error } = await supabase
      .from("abstract_contests")
      .update({ type })
      .eq("upcoming_game_uuid", upcoming_game_uuid);

    if (error) {
      console.error("Error updating contest type: ", error);
      throw new Error("Error updating contest type: " + error.message);
    }

    return type;
  } catch (error) {
    console.error("Error updating contest type: ", error);
    throw new Error("Internal server error while updating contest type");
  }
};

export const fetchBingoForLiveGame = async (
  abs_contest_id: string,
  profile_id: string
) => {
  const [
    game_quarter_raw,
    prizesAndWinners,
    contest_bingo_id,
    categories,
    upcomingContestToday,
  ] = await Promise.all([
    getCurrentGameQuarter(abs_contest_id),
    fetchContestPrizesAndWinners(abs_contest_id, profile_id),
    fetchContestBingoID(abs_contest_id, profile_id),
    fetchBingoCategoriesByAbstractContestID(abs_contest_id),
    fetchUpcomingContestToday(),
  ]);
  let game_quarter = game_quarter_raw;
  const gameType = upcomingContestToday?.game_type ?? "";
  const mainQuarters = getMainQuartersForGameType(gameType);
  const lastQuarter = getLastQuarterForGameType(gameType);

  if (!mainQuarters.includes(game_quarter)) {
    if (game_quarter.toUpperCase() === "HALF" && gameType !== "cbb") {
      game_quarter = "3";
    } else {
      game_quarter = lastQuarter;
    }
  }

  const tabs = prizesAndWinners
    .filter((prizeAndWinner) => mainQuarters.includes(prizeAndWinner.quarter))
    .map((prizeAndWinner) => {
      return {
        quarter: prizeAndWinner.quarter,
        prize: prizeAndWinner.prize,
        winner: prizeAndWinner.winner_nickname,
        completed: getQuarterCompleted(prizeAndWinner.quarter, game_quarter),
      };
    });

  const [completedCategoryIDsByQuarter, bingoCards, categoryProgress] =
    await Promise.all([
      getCompletedBingoCategoryIDs(abs_contest_id),
      fetchBingoCardsWithUserInfo(contest_bingo_id, game_quarter),
      getBingoCategoryProgressByQuarter(abs_contest_id, [game_quarter]),
    ]);

  const completedCategoryIDs = completedCategoryIDsByQuarter[game_quarter];
  const categoryPoints = await fetchContestBingoCategoryPoints(
    completedCategoryIDs
  );

  const formattedBingoCards = bingoCards.map((bingoCard) => ({
    user: {
      id: bingoCard.contest_user_id,
      phone: bingoCard.user_phone,
      nickname: bingoCard.user_nickname,
    },
    square_ids: bingoCard.square_ids,
    submitted_at: bingoCard.submitted_at,
  }));

  const rankedBingoCards = await rankBingoCards(
    formattedBingoCards,
    categoryPoints
  );

  const currentPrize = prizesAndWinners.find(
    (prizeAndWinner) => prizeAndWinner.quarter === game_quarter
  )?.prize;

  const getLiveTitle = (quarter: string, gt: string) => {
    if (gt === "cbb") {
      const half = quarter === "1" ? "1H" : "2H";
      return `${half} LIVE`;
    }
    return `${getQuarterTitle(quarter, gt)} LIVE`;
  };
  const liveTitle = getLiveTitle(game_quarter, gameType);

  const getPrizeTitle = (quarter: string, gt: string) => {
    return `${getQuarterTitle(quarter, gt)} PRIZE`;
  };
  const prizeTitle = getPrizeTitle(game_quarter, gameType);

  const slicedRankedBingoCards = rankedBingoCards.slice(0, 15);
  const formattedLeaderboard = {
    quarter: game_quarter,
    prize_title: prizeTitle,
    prize: currentPrize,
    bingo_cards: slicedRankedBingoCards.map((bingoCard) => ({
      username: bingoCard.user.nickname,
      squares: bingoCard.squares,
      points: bingoCard.points,
    })),
  };

  const markets = await getMarkets(
    categories,
    formattedBingoCards.map((bingoCard) => ({
      nickname: bingoCard.user.nickname,
      square_ids: bingoCard.square_ids,
      submitted_at: bingoCard.submitted_at,
    })),
    categoryProgress[game_quarter]
  );

  return {
    contest_bingo_id,
    quarter: game_quarter,
    live_title: liveTitle,
    markets: markets,
    leaderboard: formattedLeaderboard,
    tabs: tabs,
  };
};

export const fetchWinnerWithGame = async (contest_winner_id: string) => {
  try {
    const { data: dataArray, error } = await supabase
      .from("view_contest_winners_with_game")
      .select(
        `
        nickname,
        quarter,
        redeemed,
        prizes,

        day,
        date_time,

        home_team_key,
        home_team_logo_url,
        home_team_primary_color,
        home_team_wins,
        home_team_losses,
        away_team_key,
        away_team_logo_url,
        away_team_primary_color,
        away_team_wins,
        away_team_losses
        `
      )
      .eq("contest_winner_id", contest_winner_id)
      .limit(1);

    if (error) {
      console.error("Error fetching contest winner with game info: ", error);
      throw new Error(
        "Error fetching contest winner with game info: " + error.message
      );
    }

    if (!dataArray || dataArray.length === 0) {
      return null;
    }

    const data = dataArray[0];
    const formattedData = {
      nickname: data.nickname,
      quarter: data.quarter,
      redeemed: data.redeemed,
      prize: data.prizes[data.quarter],

      day: data.day,
      date_time: data.date_time,

      home_team: {
        key: data.home_team_key,
        logo_url: data.home_team_logo_url,
        primary_color: data.home_team_primary_color,
        wins: data.home_team_wins,
        losses: data.home_team_losses,
      },
      away_team: {
        key: data.away_team_key,
        logo_url: data.away_team_logo_url,
        primary_color: data.away_team_primary_color,
        wins: data.away_team_wins,
        losses: data.away_team_losses,
      },
    };

    return formattedData;
  } catch (error) {
    console.error("Error fetching contest winner with game info: ", error);
    throw new Error(
      "Internal server error while fetching contest winner with game info"
    );
  }
};

export const redeemWinner = async (winner_id: string) => {
  try {
    const { error } = await supabase
      .from("contest_winners")
      .update({ redeemed: true })
      .eq("id", winner_id);

    if (error) {
      console.error("Error redeeming contest winner: ", error);
      throw new Error("Error redeeming contest winner: " + error.message);
    }

    return true;
  } catch (error) {
    console.error("Error redeeming contest winner: ", error);
    throw new Error("Internal server error while redeeming contest winner");
  }
};

export const upsertDefaultContestPrizes = async (
  profile_id: string,
  prizes: { [key: string]: any }
) => {
  try {
    const { data, error } = await supabase
      .from("default_contest_prizes")
      .upsert(
        {
          profile_id,
          prizes,
        },
        {
          onConflict: "profile_id",
        }
      )
      .select("profile_id, prizes, prizes_enabled")
      .single();

    if (error) {
      console.error("Error upserting default contest prizes: ", error);
      throw new Error(
        "Error upserting default contest prizes: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from upserting default contest prizes");
      throw new Error("No data returned from upserting default contest prizes");
    }

    return data;
  } catch (error) {
    console.error("Error upserting default contest prizes: ", error);
    throw new Error(
      "Internal server error while upserting default contest prizes"
    );
  }
};

export const upsertDefaultContestPoints = async (
  profile_id: string,
  points: { [key: string]: number | null }
) => {
  try {
    const { data, error } = await supabase
      .from("default_contest_prizes")
      .upsert(
        {
          profile_id,
          points,
        },
        {
          onConflict: "profile_id",
        }
      )
      .select("profile_id, points, points_enabled")
      .single();

    if (error) {
      console.error("Error upserting default contest points: ", error);
      throw new Error(
        "Error upserting default contest points: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from upserting default contest points");
      throw new Error("No data returned from upserting default contest points");
    }

    return data;
  } catch (error) {
    console.error("Error upserting default contest points: ", error);
    throw new Error(
      "Internal server error while upserting default contest points"
    );
  }
};

export const fetchDefaultContestPrizesAndPoints = async (
  profile_id: string
): Promise<{
  profile_id: string;
  prizes: { [key: string]: string } | null;
  points: { [key: string]: number };
  prizes_enabled: boolean;
  points_enabled: boolean;
} | null> => {
  try {
    const { data, error } = await supabase
      .from("default_contest_prizes")
      .select("profile_id, prizes, points, prizes_enabled, points_enabled")
      .eq("profile_id", profile_id)
      .limit(1);

    if (error) {
      console.error("Error fetching default contest prizes: ", error);
      throw new Error(
        "Error fetching default contest prizes: " + error.message
      );
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error fetching default contest prizes: ", error);
    throw new Error(
      "Internal server error while fetching default contest prizes"
    );
  }
};

export const updateDefaultContestPrizesEnabled = async (
  profile_id: string,
  enabled: boolean
) => {
  try {
    const { error } = await supabase
      .from("default_contest_prizes")
      .update({ prizes_enabled: enabled })
      .eq("profile_id", profile_id);

    if (error) {
      console.error(
        "Error updating default contest prizes enabled status: ",
        error
      );
      throw new Error(
        "Error updating default contest prizes enabled status: " + error.message
      );
    }

    return enabled;
  } catch (error) {
    console.error(
      "Error updating default contest prizes enabled status: ",
      error
    );
    throw new Error(
      "Internal server error while updating default contest prizes enabled status"
    );
  }
};

export const updateDefaultContestPointsEnabled = async (
  profile_id: string,
  enabled: boolean
) => {
  try {
    const { error } = await supabase
      .from("default_contest_prizes")
      .update({ points_enabled: enabled })
      .eq("profile_id", profile_id);

    if (error) {
      console.error(
        "Error updating default contest points enabled status: ",
        error
      );
      throw new Error(
        "Error updating default contest points enabled status: " + error.message
      );
    }

    return enabled;
  } catch (error) {
    console.error(
      "Error updating default contest points enabled status: ",
      error
    );
    throw new Error(
      "Internal server error while updating default contest points enabled status"
    );
  }
};

export const fetchDefaultContestPointsSportsIQ = async () => {
  try {
    const { data, error } = await supabase
      .from("default_contest_points_sportsiq")
      .select("points")
      .eq("id", 1)
      .limit(1);

    if (error) {
      console.error("Error fetching default contest points: ", error);
      throw new Error(
        "Error fetching default contest points: " + error.message
      );
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0].points;
  } catch (error) {
    console.error("Error fetching default contest points: ", error);
    throw new Error(
      "Internal server error while fetching default contest points"
    );
  }
};

export const upsertDefaultContestPointsSportsIQ = async (
  profile_id: string,
  points: {
    [key: string]: number;
  }
) => {
  try {
    const { error } = await supabase
      .from("default_contest_points_sportsiq")
      .upsert({ profile_id, points }, { onConflict: "profile_id" });

    if (error) {
      console.error("Error upserting default contest points: ", error);
      throw new Error(
        "Error upserting default contest points: " + error.message
      );
    }

    return true;
  } catch (error) {
    console.error("Error upserting default contest points: ", error);
    throw new Error(
      "Internal server error while upserting default contest points"
    );
  }
};

export const fetchPredictorForPreGame = async (
  abs_contest_id: string,
  profile_id: string
): Promise<{
  contest_predictor_id: string;
  titles: {
    [key: string]: {
      quarter: string;
      prize: string;
    };
  };
  settings: {
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[];
}> => {
  let gameType = "";
  const upcomingContest = await fetchUpcomingContestToday();
  if (upcomingContest) {
    gameType = upcomingContest.game_type;
  }

  const [categories, prizesAndPoints] = await Promise.all([
    supabaseFetchPredictorCategories({
      absContestID: abs_contest_id,
      profileID: profile_id,
    }),
    supabaseFetchPredictorPrizesAndPoints({
      absContestID: abs_contest_id,
      profileID: profile_id,
    }),
  ]);

  const contestPredictorID = prizesAndPoints.contestPredictorID;
  const pointsBar = prizesAndPoints.pointsBar;
  const pointsSportsIQ = prizesAndPoints.pointsSportsIQ;

  const prizes = prizesAndPoints.prizes
    ? prizesAndPoints.prizes
    : pointsBar
    ? getPoints(pointsBar, "bar")
    : getPoints(pointsSportsIQ, "sportsiq");

  let titles: { [key: string]: { quarter: string; prize: string } } = {};

  Object.entries(prizes).forEach(([quarter, prize]) => {
    titles[quarter] = {
      quarter: getQuarterTitle(quarter, gameType),
      prize: prize,
    };
  });

  const mainQuartersForType = getMainQuartersForGameType(gameType);
  const filteredTitles: typeof titles = {};
  mainQuartersForType.forEach((q) => {
    if (titles[q]) {
      filteredTitles[q] = titles[q];
    }
  });

  return {
    contest_predictor_id: contestPredictorID,
    titles: filteredTitles,
    settings: categories,
  };
};

export const fetchPredictorForLiveGame = async (
  abs_contest_id: string,
  profile_id: string
): Promise<{
  contest_predictor_id: string;
  quarter: string;
  quarter_title: string;
  statuses: {
    team_key: string;
    category: {
      label: string;
      value: string;
    };
    progress: number;
    value: number;
    points: {
      under: number;
      exact: number;
      over: number;
    };
  }[];
  prizes: {
    quarter_title: string;
    prize: string;
    winner: string | null;
    completed: boolean;
  }[];
  leaderboard: {
    title: {
      quarter: string;
      prize: string;
    };
    predictions: {
      username: string;
      dots: {
        star: boolean;
        filled: boolean;
      }[];
      points: number;
    }[];
  };
}> => {
  const [contestPredictorID, game_quarter_raw] = await Promise.all([
    fetchContestPredictorID(abs_contest_id, profile_id),
    getCurrentGameQuarter(abs_contest_id),
  ]);

  let gameType = "";
  const upcomingContest = await fetchUpcomingContestToday();
  if (upcomingContest) {
    gameType = upcomingContest.game_type;
  }

  const mainQuarters = getMainQuartersForGameType(gameType);
  const lastQuarter = getLastQuarterForGameType(gameType);
  let gameQuarter = game_quarter_raw;
  let quarterTitle = "";
  if (gameType === "cbb") {
    switch (gameQuarter.toUpperCase()) {
      case "1":
        quarterTitle = "1ST HALF LIVE";
        break;
      case "2":
        quarterTitle = "2ND HALF LIVE";
        break;
      case "HALF":
        quarterTitle = "HALFTIME";
        break;
      default:
        quarterTitle = "";
        break;
    }
  } else if (gameType === "nhl") {
    if (mainQuarters.includes(gameQuarter)) {
      quarterTitle = `${getQuarterTitle(gameQuarter, gameType)} LIVE`;
    } else if (gameQuarter === "OT") {
      quarterTitle = "OVERTIME";
    } else {
      quarterTitle = "";
    }
  } else if (gameType === "mlb") {
    if (mainQuarters.includes(gameQuarter)) {
      quarterTitle = `${getQuarterTitle(gameQuarter, gameType)} LIVE`;
    } else {
      quarterTitle = "";
    }
  } else {
    switch (gameQuarter.toUpperCase()) {
      case "1":
      case "2":
      case "3":
      case "4":
        quarterTitle = `Q${gameQuarter} LIVE`;
        break;
      case "HALF":
        quarterTitle = "HALFTIME";
        break;
      default:
        quarterTitle = "";
        break;
    }
  }

  if (!mainQuarters.includes(gameQuarter)) {
    if (gameType === "cbb") {
      gameQuarter = "2";
    } else if (gameQuarter === "HALF") {
      // HALF applies to NBA/NFL (between Q2 and Q3)
      gameQuarter = "3";
    } else {
      gameQuarter = lastQuarter;
    }
  }

  const [statuses, prizes, predictions] = await Promise.all([
    getPredictorStatuses(abs_contest_id, gameQuarter),
    getPredictorPrizes(abs_contest_id, profile_id, gameQuarter),
    getPredictorPredictions(contestPredictorID, gameQuarter),
  ]);

  const filteredPrizes = prizes.filter((prize) =>
    mainQuarters.includes(prize.quarter)
  );
  const formattedPrizes = filteredPrizes.map((prize) => ({
    ...prize,
    quarter_title: getQuarterTitle(prize.quarter, gameType),
  }));

  const statusesRecord: Record<string, number> = {};
  statuses.forEach((status) => {
    if (status.progress < status.value) {
      statusesRecord[`${status.id}:under`] = status.points.under;
    } else if (status.progress === status.value) {
      statusesRecord[`${status.id}:exact`] = status.points.exact;
    } else {
      statusesRecord[`${status.id}:over`] = status.points.over;
    }
  });

  const currentPrize =
    filteredPrizes.find((prize) => prize.quarter === gameQuarter)?.prize ?? "";

  const formatPredictions = (
    predictions: {
      user: {
        id: string;
        phone: string;
        nickname: string;
      };
      predictions: string[];
      submitted_at: string;
    }[],
    statusesRecord: Record<string, number>
  ) => {
    return predictions.map((prediction) => {
      let points = 0;
      const dots = prediction.predictions.map((prediction) => {
        const [id, type] = prediction.split(":");
        points += statusesRecord[prediction] ?? 0;

        return {
          star: type === "exact",
          filled: typeof statusesRecord[prediction] === "number",
        };
      });

      return {
        username: prediction.user.nickname,
        dots: dots,
        points: points,
        submitted_at: prediction.submitted_at,
      };
    });
  };

  const formattedPredictions = formatPredictions(predictions, statusesRecord);
  const rankedPredictions = formattedPredictions.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    } else {
      return (
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      );
    }
  });
  const slicedPredictions = rankedPredictions.slice(0, 15);

  return {
    contest_predictor_id: contestPredictorID,
    quarter: gameQuarter,
    quarter_title: quarterTitle,
    statuses: statuses,
    prizes: formattedPrizes,
    leaderboard: {
      title: {
        quarter: `${getQuarterTitle(gameQuarter, gameType)} PRIZE`,
        prize: currentPrize,
      },
      predictions: slicedPredictions,
    },
  };
};

export const fetchPredictorInfoByID = async (
  predictor_id: string
): Promise<{
  game: {
    day: string;
    date_time: string;
    home_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
    away_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
  };
  titles: {
    [key: string]: {
      quarter: string;
      prize: string;
    };
  };
  settings: {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[];
}> => {
  const [gameInfo, categories, prizesAndPoints] = await Promise.all([
    fetchGameInfoByPredictorID(predictor_id),
    supabaseFetchPredictorCategories({
      contestPredictorID: predictor_id,
    }),
    supabaseFetchPredictorPrizesAndPoints({
      contestPredictorID: predictor_id,
    }),
  ]);

  const pointsBar = prizesAndPoints.pointsBar;
  const pointsSportsIQ = prizesAndPoints.pointsSportsIQ;

  const prizes = prizesAndPoints.prizes
    ? prizesAndPoints.prizes
    : pointsBar
    ? getPoints(pointsBar, "bar")
    : getPoints(pointsSportsIQ, "sportsiq");

  const gameType = gameInfo.game_type;

  let titles: { [key: string]: { quarter: string; prize: string } } = {};

  Object.entries(prizes).forEach(([quarter, prize]) => {
    titles[quarter] = {
      quarter: getQuarterTitle(quarter, gameType),
      prize: prize,
    };
  });

  if (gameType === "cbb") {
    titles = {
      "1": titles["1"],
      "2": titles["2"],
    };
  }

  return {
    game: gameInfo,
    titles: titles,
    settings: categories,
  };
};

export const registerPredictions = async (
  contest_predictor_id: string,
  contest_user_id: string,
  predictions: {
    quarter: string;
    predictions: string[];
  }[]
) => {
  try {
    const upcomingContest = await fetchUpcomingContestToday();
    const contestGameType = upcomingContest?.game_type ?? "";
    let remainingQuarters = getMainQuartersForGameType(contestGameType);
    const lastQ = getLastQuarterForGameType(contestGameType);
    let gameQuarter = "";

    if (upcomingContest) {
      const { game_status, game_uuid } = upcomingContest;
      if (["Final", "F/OT"].includes(game_status)) {
        gameQuarter = lastQ;
      } else if (game_status === "InProgress") {
        const { quarter } = await fetchGameByGameUUID(game_uuid);
        gameQuarter = quarter;

        if (gameQuarter && !remainingQuarters.includes(gameQuarter)) {
          if (gameQuarter.toUpperCase() === "HALF") {
            gameQuarter = "2";
          } else {
            gameQuarter = lastQ;
          }
        }
      }
    }

    remainingQuarters = remainingQuarters.slice(
      remainingQuarters.indexOf(gameQuarter) + 1
    );

    const filteredPredictions = predictions.filter((prediction) =>
      remainingQuarters.includes(prediction.quarter)
    );

    const predictionsToUpsert = filteredPredictions.map((prediction) => ({
      contest_predictor_id,
      contest_user_id,
      quarter: prediction.quarter,
      predictions: prediction.predictions,
    }));

    /**
     * TODO: Get the current game quarter and filter the predictions to only include the upcoming quarters.
     */

    const registered = await supabaseUpsertPredictions(predictionsToUpsert);

    return registered;
  } catch (error) {
    console.error("Error registering predictions: ", error);
    throw new Error("Internal server error while registering predictions");
  }
};

export const getSportsiqPoints = async (contestUserID: string) => {
  try {
    const phone = await fetchPhoneByContestUserID(contestUserID);
    const sportsiqPoints = (await fetchSportsIQPoints(phone)) ?? 0;
    return sportsiqPoints;
  } catch (error) {
    const message = `Error getting sportsiq points: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const getBarPoints = async (
  contestUserID: string,
  id: string,
  type: "bingo" | "predictor"
) => {
  try {
    const phone = await fetchPhoneByContestUserID(contestUserID);
    const profileID = await fetchProfileID(id, type);
    const barPoints = await fetchBarPoints(phone, profileID);
    return barPoints;
  } catch (error) {
    console.error("Error fetching bar points: ", error);
    throw new Error("Internal server error while fetching bar points");
  }
};

export const retrievePredictions = async (
  contestPredictorID: string,
  contestUserID: string
): Promise<
  {
    quarter: string;
    predictions: string[];
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("contest_predictions")
      .select("quarter, predictions")
      .eq("contest_predictor_id", contestPredictorID)
      .eq("contest_user_id", contestUserID);

    if (error) {
      console.error("Error retrieving predictions: ", error);
      throw new Error("Error retrieving predictions: " + error.message);
    }

    if (!data) {
      console.error("No data returned from retrieving predictions");
      throw new Error("No data returned from retrieving predictions");
    }

    return data;
  } catch (error) {
    console.error("Error retrieving predictions: ", error);
    throw new Error("Internal server error while retrieving predictions");
  }
};

export const handleContestGameQuarterEndAndStart = async () => {
  let quarter: string | null = null;
  let quarterEndHandled: boolean = false;

  while (true) {
    try {
      // TODO: get current game quarter, remaining time for the quarter
      const {
        quarter: newQuarter,
        remainingTimeSeconds,
        absContestID,
        contestType,
        gameType,
      } = await getCurrentContestGame();

      const validQuarters = getMainQuartersForGameType(gameType);

      if (newQuarter !== quarter) {
        if (
          !quarterEndHandled &&
          validQuarters.includes(quarter ?? "")
        ) {
          await handleContestGameQuarterEnd(
            absContestID,
            quarter ?? "",
            contestType
          );
        }

        quarterEndHandled = false;
        quarter = newQuarter;
        await handleContestGameQuarterStart(absContestID, quarter, contestType);
      } else if (
        remainingTimeSeconds === 0 &&
        !quarterEndHandled &&
        validQuarters.includes(quarter ?? "")
      ) {
        quarterEndHandled = true;
        await handleContestGameQuarterEnd(absContestID, quarter, contestType);
      }
    } catch (error) {
      console.error("Error handling contest game quarter change: ", error);
    } finally {
      await wait(5);
    }
  }
};

/**
 * +------------------------------------------------------------------------------+
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                Inline functions for the above functions                      |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * +------------------------------------------------------------------------------+
 */

const upsertAbstractContestAndGetID = async (
  upcoming_game_uuid: string,
  type: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("abstract_contests")
      .upsert(
        {
          upcoming_game_uuid,
          type,
        },
        {
          onConflict: "upcoming_game_uuid",
        }
      )
      .select("id")
      .single();

    if (error) {
      console.error("Error upserting abstract contests: ", error);
      throw new Error("Error upserting abstract contests: " + error.message);
    }

    if (!data) {
      console.error("No data returned from upsert abstract contest");
      throw new Error("No data returned from upsert abstract contest");
    }

    return data.id;
  } catch (error) {
    console.error("Error upserting abstract contests: ", error);
    throw new Error("Internal server error while upserting abstract contests");
  }
};

const fetchPrizesAndPoints = async (
  profileIDs: string[]
): Promise<
  {
    profile_id: string;
    prizes: { [key: string]: string | null };
    points: { [key: string]: number };
    prizes_enabled: boolean;
    points_enabled: boolean;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("default_contest_prizes")
      .select("profile_id, prizes, prizes_enabled, points, points_enabled")
      .in("profile_id", profileIDs);

    if (error) {
      console.error("Error fetching all prizes for profile IDs: ", error);
      throw new Error(
        "Error fetching all prizes for profile IDs: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching all prizes for profile IDs"
      );
      throw new Error(
        "No data returned from fetching all prizes for profile IDs"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching all prizes for profile IDs: ", error);
    throw new Error(
      "Internal server error while fetching all prizes for profile IDs"
    );
  }
};

const upsertAbstractContestPredictorAndGetID = async (
  abstract_contest_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("abstract_contest_predictors")
      .upsert({ abstract_contest_id }, { onConflict: "abstract_contest_id" })
      .select("id")
      .single();

    if (error) {
      console.error("Error upserting abstract contest prediction: ", error);
      throw new Error(
        "Error upserting abstract contest prediction: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from upsert abstract contest prediction");
      throw new Error(
        "No data returned from upsert abstract contest prediction"
      );
    }

    return data.id;
  } catch (error) {
    console.error("Error upserting abstract contest prediction: ", error);
    throw new Error(
      "Internal server error while upserting abstract contest prediction"
    );
  }
};

const upsertContestPredictors = async (
  abstract_contest_predictor_id: string,
  profileIDs: string[]
) => {
  try {
    const { error } = await supabase.from("contest_predictors").upsert(
      profileIDs.map((profileID) => ({
        abstract_contest_predictor_id,
        profile_id: profileID,
      })),
      {
        onConflict: "abstract_contest_predictor_id, profile_id",
      }
    );

    if (error) {
      console.error("Error upserting contest predictors: ", error);
      throw new Error("Error upserting contest predictors: " + error.message);
    }
  } catch (error) {
    console.error("Error upserting contest predictors: ", error);
    throw new Error("Internal server error while upserting contest predictors");
  }
};

const disableContestPredictorCategories = async (
  abstract_contest_predictor_id: string
) => {
  try {
    const { error } = await supabase
      .from("contest_predictor_categories")
      .update({ enabled: false })
      .eq("abstract_contest_predictor_id", abstract_contest_predictor_id);

    if (error) {
      console.error("Error disabling contest predictor categories: ", error);
      throw new Error(
        "Error disabling contest predictor categories: " + error.message
      );
    }
  } catch (error) {
    console.error("Error disabling contest predictor categories: ", error);
    throw new Error(
      "Internal server error while disabling contest predictor categories"
    );
  }
};

const upsertContestPredictorCategories = async (
  contestPredictorSettings: {
    abstract_contest_predictor_id: string;
    category_id: string;
    team_key: string;
    value: number;
    points_under: number;
    points_exact: number;
    points_over: number;
    enabled: boolean;
  }[]
) => {
  try {
    const { error } = await supabase
      .from("contest_predictor_categories")
      .upsert(contestPredictorSettings, {
        onConflict:
          "abstract_contest_predictor_id, quarter, team_key, category_id, value",
      });

    if (error) {
      console.error("Error upserting contest predictor settings: ", error);
      throw new Error(
        "Error upserting contest predictor settings: " + error.message
      );
    }
  } catch (error) {
    console.error("Error upserting contest predictor settings: ", error);
    throw new Error(
      "Internal server error while upserting contest predictor settings"
    );
  }
};

const upsertAbstractContestBingoAndGetID = async (
  abstract_contest_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("abstract_contest_bingos")
      .upsert({ abstract_contest_id }, { onConflict: "abstract_contest_id" })
      .select("id")
      .single();

    if (error) {
      console.error("Error upserting abstract contest bingo: ", error);
      throw new Error(
        "Error upserting abstract contest bingo: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from upsert abstract contest bingo");
      throw new Error("No data returned from upsert abstract contest bingo");
    }

    return data.id;
  } catch (error) {
    console.error("Error upserting abstract contest bingo: ", error);
    throw new Error(
      "Internal server error while upserting abstract contest bingo"
    );
  }
};

const upsertContestBingos = async (
  abstract_contest_bingo_id: string,
  profileIDs: string[]
) => {
  try {
    const { error } = await supabase.from("contest_bingos").upsert(
      profileIDs.map((profileID) => ({
        abstract_contest_bingo_id,
        profile_id: profileID,
      })),
      { onConflict: "abstract_contest_bingo_id, profile_id" }
    );

    if (error) {
      console.error("Error upserting contest bingos: ", error);
      throw new Error("Error upserting contest bingos: " + error.message);
    }
  } catch (error) {
    console.error("Error upserting contest bingos: ", error);
    throw new Error("Internal server error while upserting contest bingos");
  }
};

const disableContestBingoCategories = async (
  abstract_contest_bingo_id: string
) => {
  try {
    const { error } = await supabase
      .from("contest_bingo_categories")
      .update({ enabled: false })
      .eq("abstract_contest_bingo_id", abstract_contest_bingo_id);

    if (error) {
      console.error("Error disabling contest bingo categories: ", error);
      throw new Error(
        "Error disabling contest bingo categories: " + error.message
      );
    }
  } catch (error) {
    console.error("Error disabling contest bingo categories: ", error);
    throw new Error(
      "Internal server error while disabling contest bingo categories"
    );
  }
};

const upsertContestBingoCategories = async (
  contestBingoCategories: {
    abstract_contest_bingo_id: string;
    category_id: string;
    team_key: string;
    description: string;
    value: number;
    points: number;
    enabled: boolean;
  }[]
) => {
  try {
    const { error } = await supabase
      .from("contest_bingo_categories")
      .upsert(contestBingoCategories, {
        onConflict: "abstract_contest_bingo_id, category_id, team_key, value",
      });

    if (error) {
      console.error("Error upserting contest bingo categories: ", error);
      throw new Error(
        "Error upserting contest bingo categories: " + error.message
      );
    }
  } catch (error) {
    console.error("Error upserting contest bingo categories: ", error);
    throw new Error(
      "Internal server error while upserting contest bingo categories"
    );
  }
};

const getRandomSquareIDs = (ids: string[]): { [key: number]: string } => {
  const clonedIDs = [...ids];
  const randomIDs: string[] = [];

  while (randomIDs.length < 9) {
    const randomIndex = Math.floor(Math.random() * clonedIDs.length);
    const randomID = clonedIDs[randomIndex];
    randomIDs.push(randomID);
    clonedIDs.splice(randomIndex, 1);
  }

  return {
    1: randomIDs[0],
    2: randomIDs[1],
    3: randomIDs[2],
    4: randomIDs[3],
    5: randomIDs[4],
    6: randomIDs[5],
    7: randomIDs[6],
    8: randomIDs[7],
    9: randomIDs[8],
  };
};

const fetchContestID = async ({
  contest_bingo_id,
  contest_predictor_id,
}: {
  contest_bingo_id?: string;
  contest_predictor_id?: string;
}): Promise<string> => {
  try {
    let query = supabase.from("view_contest_ids").select("id");
    if (contest_bingo_id) {
      query = query.eq("contest_bingo_id", contest_bingo_id);
    }
    if (contest_predictor_id) {
      query = query.eq("contest_predictor_id", contest_predictor_id);
    }
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Error fetching contest ID: ", error);
      throw new Error("Error fetching contest ID: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching contest ID");
      throw new Error("No data returned from fetching contest ID");
    }

    return data[0].id;
  } catch (error) {
    console.error("Error fetching contest ID: ", error);
    throw new Error("Internal server error while fetching contest ID");
  }
};

const upsertContestUserAndGetID = async (
  contest_id: string,
  phone: string,
  nickname: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("contest_users")
      .upsert(
        { contest_id, phone, nickname },
        { onConflict: "contest_id, phone" }
      )
      .select("id");

    if (error) {
      console.error("Error upserting contest user and getting ID: ", error);
      throw new Error(
        "Error upserting contest user and getting ID: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from upserting contest user and getting ID"
      );
      throw new Error(
        "No data returned from upserting contest user and getting ID"
      );
    }

    return data[0].id;
  } catch (error) {
    console.error("Error upserting contest user and getting ID: ", error);
    throw new Error(
      "Internal server error while upserting contest user and getting ID"
    );
  }
};

const fetchContestBingoCards = async (
  contest_bingo_id: string,
  contest_user_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("contest_bingo_cards")
      .select("id, quarter, square_ids, retryable")
      .eq("contest_bingo_id", contest_bingo_id)
      .eq("contest_user_id", contest_user_id);

    if (error) {
      console.error("Error fetching contest bingo cards: ", error);
      throw new Error("Error fetching contest bingo cards: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching contest bingo cards");
      throw new Error("No data returned from fetching contest bingo cards");
    }

    return data;
  } catch (error) {
    console.error("Error fetching contest bingo cards: ", error);
    throw new Error("Internal server error while fetching contest bingo cards");
  }
};

const upsertContestBingoCards = async (
  contestBingoCards: {
    contest_bingo_id: string;
    contest_user_id: string;
    quarter: string;
    square_ids: { [key: number]: string };
    retryable: boolean;
  }[]
) => {
  try {
    const { data, error } = await supabase
      .from("contest_bingo_cards")
      .upsert(contestBingoCards, {
        onConflict: "contest_bingo_id, contest_user_id, quarter",
      })
      .select("id, quarter, square_ids, retryable");

    if (error) {
      console.error("Error upserting contest bingo cards: ", error);
      throw new Error("Error upserting contest bingo cards: " + error.message);
    }

    if (!data) {
      console.error("No data returned from upsert contest bingo cards");
      throw new Error("No data returned from upsert contest bingo cards");
    }

    return data;
  } catch (error) {
    console.error("Error upserting contest bingo cards: ", error);
    throw new Error(
      "Internal server error while upserting contest bingo cards"
    );
  }
};

const fetchContestBingoCard = async (contest_bingo_card_id: string) => {
  try {
    const { data, error } = await supabase
      .from("contest_bingo_cards")
      .select("id, contest_bingo_id, contest_user_id, quarter, retryable")
      .eq("id", contest_bingo_card_id)
      .limit(1);

    if (error) {
      console.error("Error fetching contest bingo card: ", error);
      throw new Error("Error fetching contest bingo card: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching contest bingo card");
      throw new Error("No data returned from fetching contest bingo card");
    }

    return data[0];
  } catch (error) {
    console.error("Error fetching contest bingo card: ", error);
    throw new Error("Internal server error while fetching contest bingo card");
  }
};

const getCompletedBingoCategoryIDs = async (
  abs_contest_id: string
): Promise<{ [key: string]: string[] }> => {
  /**
   * Fetch `game_type` and `game_id` by `abs_contest_id`.
   */
  const { upcoming_game_uuid, game_type, game_id } =
    await fetchUpcomingGameInfo(abs_contest_id);

  /**
   * Fetch `contest_bingo_category_settings` by `upcoming_game_uuid`.
   */
  const rawCategorySettings = await fetchBingoCategorySettings(
    upcoming_game_uuid
  );
  const categorySettings = rawCategorySettings.map((setting) => ({
    id: setting.id,
    team_key: setting.team_key,
    category_value: setting.category.value,
    value: setting.value,
  }));
  const categoryValues = categorySettings.map(
    (setting) => setting.category_value
  );

  /**
   * Fetch `team_game_stats` by `game_type`, `game_id`, and `category_values`.
   */
  const quarters: string[] = getMainQuartersForGameType(game_type);
  const teamGameStats = await fetchTeamGameStatsByGameID(
    game_type,
    game_id,
    categoryValues,
    quarters
  );

  /**
   * Calculate completed bingo category IDs.
   */
  const completedBingoCategoryIDs = await calculateCompletedBingoCategoryIDs(
    teamGameStats,
    categorySettings
  );

  return completedBingoCategoryIDs;
};

const getBingoCategoryProgressByQuarter = async (
  abs_contest_id: string,
  quarters: string[] = ["1", "2", "3", "4"]
): Promise<{
  [key: string]: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  };
}> => {
  /**
   * Fetch `game_type` and `game_id` by `abs_contest_id`.
   */
  const { upcoming_game_uuid, game_type, game_id } =
    await fetchUpcomingGameInfo(abs_contest_id);

  /**
   * Fetch `contest_bingo_category_settings` by `upcoming_game_uuid`.
   */
  const rawCategorySettings = await fetchBingoCategorySettings(
    upcoming_game_uuid
  );
  const categorySettings = rawCategorySettings.map((setting) => ({
    id: setting.id,
    team_key: setting.team_key,
    category_value: setting.category.value,
    value: setting.value,
  }));
  const categoryValues = categorySettings.map(
    (setting) => setting.category_value
  );

  /**
   * Fetch `team_game_stats` by `game_type`, `game_id`, and `category_values`.
   */
  const teamGameStats = await fetchTeamGameStatsByGameID(
    game_type,
    game_id,
    categoryValues,
    quarters
  );

  /**
   * Calculate bingo category progress (done/total) for all categories.
   */
  const bingoCategoryProgress = await calculateBingoCategoryProgress(
    teamGameStats,
    categorySettings
  );

  return bingoCategoryProgress;
};

const fetchUpcomingGameInfo = async (
  abs_contest_id: string
): Promise<{
  upcoming_game_uuid: string;
  game_type: string;
  game_id: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("view_upcoming_game_info")
      .select("upcoming_game_uuid, game_type, game_id")
      .eq("abs_contest_id", abs_contest_id)
      .limit(1);

    if (error) {
      console.error(
        "Error fetching upcoming game info by abstract contest ID: ",
        error
      );
      throw new Error(
        "Error fetching upcoming game info by abstract contest ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching upcoming game info by abstract contest ID"
      );
      throw new Error(
        "No data returned from fetching upcoming game info by abstract contest ID"
      );
    }

    return data[0];
  } catch (error) {
    console.error(
      "Error fetching upcoming game info by abstract contest ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching upcoming game info by abstract contest ID"
    );
  }
};

const fetchTeamGameStatsByGameID = async (
  game_type: string,
  game_id: string,
  categoryValues: string[],
  quarters: string[]
) => {
  const fieldsToSelect: string[] = [];
  categoryValues.forEach((value) => {
    fieldsToSelect.push(
      ...quarters.map(
        (quarter) => `${getQuarterText(quarter)}_quarter_${value}`
      )
    );
  });
  fieldsToSelect.push("team_key");
  const fieldsToSelectString = fieldsToSelect.join(", ");

  try {
    const { data, error } = await supabase
      .from(`view_team_game_stats_${game_type}`)
      .select(fieldsToSelectString)
      .eq("game_id", game_id);

    if (error) {
      console.error(
        `Error fetching ${game_type} team game stats by game ID: `,
        error
      );
      throw new Error(
        `Error fetching ${game_type} team game stats by game ID: ` +
          error.message
      );
    }

    if (!data) {
      console.error(
        `No data returned from fetching ${game_type} team game stats by game ID`
      );
      throw new Error(
        `No data returned from fetching ${game_type} team game stats by game ID`
      );
    }

    return data;
  } catch (error) {
    console.error(
      `Error fetching ${game_type} team game stats by game ID: `,
      error
    );
    throw new Error(
      `Internal server error while fetching ${game_type} team game stats by game ID`
    );
  }
};

const calculateCompletedBingoCategoryIDs = async (
  teamGameStats: any[],
  categorySettings: {
    id: string;
    team_key: string;
    category_value: string;
    value: number;
  }[]
) => {
  const firstQuarterCompletedCategoryIDs: string[] = [];
  const secondQuarterCompletedCategoryIDs: string[] = [];
  const thirdQuarterCompletedCategoryIDs: string[] = [];
  const fourthQuarterCompletedCategoryIDs: string[] = [];

  categorySettings.forEach((setting) => {
    const teamGameStat = teamGameStats.find(
      (stat) => stat.team_key === setting.team_key
    );

    if (!teamGameStat) {
      return;
    }

    if (
      teamGameStat[`first_quarter_${setting.category_value}`] >= setting.value
    ) {
      firstQuarterCompletedCategoryIDs.push(setting.id);
    }
    if (
      teamGameStat[`second_quarter_${setting.category_value}`] >= setting.value
    ) {
      secondQuarterCompletedCategoryIDs.push(setting.id);
    }
    if (
      teamGameStat[`third_quarter_${setting.category_value}`] >= setting.value
    ) {
      thirdQuarterCompletedCategoryIDs.push(setting.id);
    }
    if (
      teamGameStat[`fourth_quarter_${setting.category_value}`] >= setting.value
    ) {
      fourthQuarterCompletedCategoryIDs.push(setting.id);
    }
  });

  return {
    1: firstQuarterCompletedCategoryIDs,
    2: secondQuarterCompletedCategoryIDs,
    3: thirdQuarterCompletedCategoryIDs,
    4: fourthQuarterCompletedCategoryIDs,
  };
};

const calculateBingoCategoryProgress = async (
  teamGameStats: any[],
  categorySettings: {
    id: string;
    team_key: string;
    category_value: string;
    value: number;
  }[]
): Promise<{
  [key: string]: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  };
}> => {
  const firstQuarterProgress: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  } = {};
  const secondQuarterProgress: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  } = {};
  const thirdQuarterProgress: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  } = {};
  const fourthQuarterProgress: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  } = {};

  const getProgress = (
    teamStats: any[],
    categoryValue: string,
    quarter: string
  ) => {
    return teamStats.reduce((sum, stat) => {
      return sum + (stat[`${quarter}_${categoryValue}`] || 0);
    }, 0);
  };

  categorySettings.forEach((setting) => {
    const teamKey = setting.team_key;
    let teamStats = teamGameStats;

    if (teamKey !== "TOTAL") {
      teamStats = teamStats.filter((stat) => stat.team_key === teamKey);
    }

    const firstQuarterDone = getProgress(
      teamStats,
      setting.category_value,
      "first_quarter"
    );
    const secondQuarterDone = getProgress(
      teamStats,
      setting.category_value,
      "second_quarter"
    );
    const thirdQuarterDone = getProgress(
      teamStats,
      setting.category_value,
      "third_quarter"
    );
    const fourthQuarterDone = getProgress(
      teamStats,
      setting.category_value,
      "fourth_quarter"
    );

    const total = setting.value;

    firstQuarterProgress[setting.id] = {
      done: firstQuarterDone,
      total: total,
      completed: firstQuarterDone >= total,
    };
    secondQuarterProgress[setting.id] = {
      done: secondQuarterDone,
      total: total,
      completed: secondQuarterDone >= total,
    };
    thirdQuarterProgress[setting.id] = {
      done: thirdQuarterDone,
      total: total,
      completed: thirdQuarterDone >= total,
    };
    fourthQuarterProgress[setting.id] = {
      done: fourthQuarterDone,
      total: total,
      completed: fourthQuarterDone >= total,
    };
  });

  return {
    1: firstQuarterProgress,
    2: secondQuarterProgress,
    3: thirdQuarterProgress,
    4: fourthQuarterProgress,
  };
};

const getCurrentGameQuarter = async (
  abstract_contest_id: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("view_game_quarter_by_abstract_contest_id")
      .select("game_quarter")
      .eq("abstract_contest_id", abstract_contest_id)
      .limit(1);

    if (error) {
      console.error(
        "Error fetching current game quarter by abstract contest ID: ",
        error
      );
      throw new Error(
        "Error fetching current game quarter by abstract contest ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching current game quarter by abstract contest ID"
      );
      throw new Error(
        "No data returned from fetching current game quarter by abstract contest ID"
      );
    }

    return data[0].game_quarter;
  } catch (error) {
    console.error(
      "Error fetching current game quarter by abstract contest ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching current game quarter by abstract contest ID"
    );
  }
};

const fetchContestBingoID = async (
  abstract_contest_id: string,
  profile_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("view_contest_bingo_ids")
      .select("contest_bingo_id")
      .eq("abstract_contest_id", abstract_contest_id)
      .eq("profile_id", profile_id)
      .limit(1);

    if (error) {
      console.error(
        "Error fetching contest bingo ID by abstract contest ID and profile ID: ",
        error
      );
      throw new Error(
        "Error fetching contest bingo ID by abstract contest ID and profile ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest bingo ID by abstract contest ID and profile ID"
      );
      throw new Error(
        "No data returned from fetching contest bingo ID by abstract contest ID and profile ID"
      );
    }

    return data[0].contest_bingo_id;
  } catch (error) {
    console.error(
      "Error fetching contest bingo ID by abstract contest ID and profile ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest bingo ID by abstract contest ID and profile ID"
    );
  }
};

const fetchContestPredictorID = async (
  abstract_contest_id: string,
  profile_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("view_contest_predictor_ids")
      .select("contest_predictor_id")
      .eq("abstract_contest_id", abstract_contest_id)
      .eq("profile_id", profile_id)
      .limit(1);

    if (error) {
      console.error(
        "Error fetching contest predictor ID by abstract contest ID and profile ID: ",
        error
      );
      throw new Error(
        "Error fetching contest predictor ID by abstract contest ID and profile ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest predictor ID by abstract contest ID and profile ID"
      );
      throw new Error(
        "No data returned from fetching contest predictor ID by abstract contest ID and profile ID"
      );
    }

    return data[0].contest_predictor_id;
  } catch (error) {
    console.error(
      "Error fetching contest predictor ID by abstract contest ID and profile ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest predictor ID by abstract contest ID and profile ID"
    );
  }
};

const fetchContestBingoCategoryPoints = async (
  completedBingoCategoryIDs: string[]
): Promise<{ id: string; points: number }[]> => {
  try {
    const { data, error } = await supabase
      .from("contest_bingo_categories")
      .select("id, points")
      .in("id", completedBingoCategoryIDs);

    if (error) {
      console.error(
        "Error fetching contest bingo category points by completed bingo category IDs: ",
        error
      );
      throw new Error(
        "Error fetching contest bingo category points by completed bingo category IDs: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest bingo category points by completed bingo category IDs"
      );
      throw new Error(
        "No data returned from fetching contest bingo category points by completed bingo category IDs"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error fetching contest bingo category points by completed bingo category IDs: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest bingo category points by completed bingo category IDs"
    );
  }
};

const fetchBingoCategoriesByAbstractContestID = async (
  abstract_contest_id: string
): Promise<
  {
    id: string;
    team_key: string;
    description: string;
    value: number;
    points: number;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("view_bingo_categories_by_abstract_contest_id")
      .select("id, team_key, description, value, points")
      .eq("abstract_contest_id", abstract_contest_id);

    if (error) {
      console.error(
        "Error fetching bingo categories by abstract contest ID: ",
        error
      );
      throw new Error(
        "Error fetching bingo categories by abstract contest ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching bingo categories by abstract contest ID"
      );
      throw new Error(
        "No data returned from fetching bingo categories by abstract contest ID"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error fetching bingo categories by abstract contest ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching bingo categories by abstract contest ID"
    );
  }
};

const getMarkets = async (
  categories: {
    id: string;
    team_key: string;
    description: string;
    value: number;
    points: number;
  }[],
  contestBingoCards: {
    nickname: string;
    square_ids: { [key: string]: string };
    submitted_at: string;
  }[],
  categoryProgress: {
    [categoryId: string]: { done: number; total: number; completed: boolean };
  }
): Promise<
  {
    team_key: string;
    description: string;
    done: number;
    total: number;
    completed: boolean;
    points: number;
    required_count: number;
  }[]
> => {
  return categories.map(({ id, team_key, description, value, points }) => {
    let requiredCount = 0;
    for (const card of contestBingoCards) {
      const hasCategory = Object.values(card.square_ids).includes(id);
      if (hasCategory) {
        requiredCount += 1;
      }
    }
    const completed = categoryProgress[id]?.completed || false;
    return {
      team_key,
      description: `${value} ${description}`,
      completed,
      done: categoryProgress[id]?.done || 0,
      total: categoryProgress[id]?.total || 0,
      points: points,
      required_count: requiredCount,
    };
  });
};

const fetchContestPrizesAndWinners = async (
  abstract_contest_id: string,
  profile_id: string
): Promise<
  {
    quarter: string;
    prize: string;
    winner_nickname: string | null;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("view_contest_prizes_winners")
      .select("prizes, points_bar, points_sportsiq, quarter, winner_nickname")
      .eq("abstract_contest_id", abstract_contest_id)
      .eq("profile_id", profile_id)
      .order("quarter", { ascending: false });

    if (error) {
      console.error(
        "Error fetching contest prizes and winners by abstract contest ID and profile ID: ",
        error
      );
      throw new Error(
        "Error fetching contest prizes and winners by abstract contest ID and profile ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest prizes and winners by abstract contest ID and profile ID"
      );
      throw new Error(
        "No data returned from fetching contest prizes and winners by abstract contest ID and profile ID"
      );
    }

    // Use all possible quarters across all sports; callers filter by game type
    const quarters = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let prizes = data[0].prizes;
    const pointsBar = data[0].points_bar;
    const pointsSportsIQ = data[0].points_sportsiq;

    prizes = prizes
      ? prizes
      : pointsBar
      ? getPoints(pointsBar, "bar")
      : pointsSportsIQ
      ? getPoints(pointsSportsIQ, "sportsiq")
      : {};

    const convertedData = quarters.map((quarter) => {
      const item = data.find((item) => item.quarter === quarter) ?? null;
      const prize = prizes ? prizes[quarter] : "";

      return {
        quarter: quarter,
        prize: prize,
        winner_nickname: item ? item.winner_nickname : null,
      };
    });

    return convertedData;
  } catch (error) {
    console.error(
      "Error fetching contest prizes and winners by abstract contest ID and profile ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest prizes and winners by abstract contest ID and profile ID"
    );
  }
};

const fetchBingos = async (
  abstract_contest_id: string
): Promise<
  {
    contestID: string;
    contestBingoID: string;
    profileID: string;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("view_contest_bingos_by_abstract_contest_id")
      .select("contest_id, contest_bingo_id, profile_id")
      .eq("abstract_contest_id", abstract_contest_id);

    if (error) {
      console.error(
        "Error fetching contest bingos by abstract contest ID: ",
        error
      );
      throw new Error(
        "Error fetching contest bingos by abstract contest ID: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest bingos by abstract contest ID"
      );
      throw new Error(
        "No data returned from fetching contest bingos by abstract contest ID"
      );
    }

    return data.map((bingo) => ({
      contestID: bingo.contest_id,
      contestBingoID: bingo.contest_bingo_id,
      profileID: bingo.profile_id,
    }));
  } catch (error) {
    console.error(
      "Error fetching contest bingos by abstract contest ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching contest bingos by abstract contest ID"
    );
  }
};

const fetchPredictors = async (
  absContestID: string
): Promise<
  { contestID: string; contestPredictorID: string; profileID: string }[]
> => {
  try {
    const { data, error } = await supabase
      .from("view_contest_predictors_by_abstract_contest_id")
      .select("contest_id, contest_predictor_id, profile_id")
      .eq("abstract_contest_id", absContestID);

    if (error) {
      console.error(
        "Error fetching predictors by abstract contest ID: ",
        error
      );
      throw new Error(
        "Error fetching predictors by abstract contest ID: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching predictors by abstract contest ID"
      );
      throw new Error(
        "No data returned from fetching predictors by abstract contest ID"
      );
    }

    return data.map((predictor) => ({
      contestID: predictor.contest_id,
      contestPredictorID: predictor.contest_predictor_id,
      profileID: predictor.profile_id,
    }));
  } catch (error) {
    console.error("Error fetching predictors by abstract contest ID: ", error);
    throw new Error(
      "Internal server error while fetching predictors by abstract contest ID"
    );
  }
};

const upsertContestWinner = async (
  contest_id: string,
  contest_user_id: string,
  quarter: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("contest_winners")
      .upsert(
        {
          contest_id,
          contest_user_id,
          quarter,
          redeemed: false,
        },
        {
          onConflict: "contest_id, quarter",
        }
      )
      .select("id")
      .single();

    if (error) {
      console.error("Error upserting contest winner: ", error);
      throw new Error("Error upserting contest winner: " + error.message);
    }

    if (!data) {
      console.error("No data returned from upserting contest winner");
      throw new Error("No data returned from upserting contest winner");
    }

    return data.id;
  } catch (error) {
    console.error("Error upserting contest winner: ", error);
    throw new Error("Internal server error while upserting contest winner");
  }
};

const fetchGameByGameUUID = async (
  gameUUID: string
): Promise<{
  quarter: string;
  time_remaining_minutes: number;
  time_remaining_seconds: number;
}> => {
  try {
    const { data, error } = await supabase
      .from("general_games")
      .select("quarter, time_remaining_minutes, time_remaining_seconds")
      .eq("id", gameUUID)
      .limit(1);

    if (error) {
      console.error("Error fetching game by game UUID: ", error);
      throw new Error("Error fetching game by game UUID: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching game by game UUID");
      throw new Error("No data returned from fetching game by game UUID");
    }

    return data[0];
  } catch (error) {
    console.error("Error fetching game by game UUID: ", error);
    throw new Error("Internal server error while fetching game by game UUID");
  }
};

const processBingoQuarterStart = async (
  abstract_contest_id: string,
  gameQuarter: string
) => {
  /**
   * Fetch all contest bingo IDs for this abstract contest ID
   * Disable all retryable bingo cards for this quarter - `gameQuarter`, and `contest_bingo_id`s
   */
  const contestBingos = await fetchBingos(abstract_contest_id);
  const contestBingoIDs = contestBingos.map(
    (contestBingo) => contestBingo.contestBingoID
  );

  await disableAllRetryableBingoCards(contestBingoIDs, gameQuarter);
};

const disableAllRetryableBingoCards = async (
  contestBingoIDs: string[],
  gameQuarter: string
) => {
  try {
    const { error } = await supabase
      .from("contest_bingo_cards")
      .update({ retryable: false })
      .eq("quarter", gameQuarter)
      .in("contest_bingo_id", contestBingoIDs)
      .eq("retryable", true);

    if (error) {
      console.error("Error disabling all retryable bingo cards: ", error);
      throw new Error(
        "Error disabling all retryable bingo cards: " + error.message
      );
    }
  } catch (error) {
    console.error("Error disabling all retryable bingo cards: ", error);
    throw new Error(
      "Internal server error while disabling all retryable bingo cards"
    );
  }
};

const rankBingoCards = async (
  bingoCards: {
    user: {
      id: string;
      phone: string;
      nickname: string;
    };
    square_ids: { [key: string]: string };
    submitted_at: string;
  }[],
  points: { id: string; points: number }[]
): Promise<
  {
    user: { id: string; phone: string; nickname: string };
    squares: boolean[];
    points: number;
  }[]
> => {
  /**
   * Rank bingo cards by points and submitted_at
   */
  // Map for quick lookup of points by bingo category id
  const pointsMap = new Map<string, number>();
  points.forEach((p) => {
    pointsMap.set(p.id, p.points);
  });

  // Define the 8 ways to win (indexes for 3x3 bingo board)
  const winLines = [
    [0, 1, 2], // first row
    [3, 4, 5], // second row
    [6, 7, 8], // third row
    [0, 3, 6], // first column
    [1, 4, 7], // second column
    [2, 5, 8], // third column
    [0, 4, 8], // diagonal \
    [2, 4, 6], // diagonal /
  ];

  // Helper function to get points for a bingo card with doubled lines
  function calculateCardPoints(
    squares: boolean[],
    squareCategoryIds: string[],
    pointsMap: Map<string, number>
  ): number {
    let totalPoints = 0;
    // track which squares got doubled extra for those lines
    const doubled = new Array(9).fill(false);

    for (const line of winLines) {
      if (line.every((idx) => squares[idx])) {
        // This line is completed, double the points for these squares
        for (const idx of line) {
          doubled[idx] = true;
        }
      }
    }

    for (let i = 0; i < 9; i++) {
      const categoryId = squareCategoryIds[i];
      if (!categoryId) continue;
      const basePoints = pointsMap.get(categoryId) ?? 0;
      if (squares[i]) {
        totalPoints += basePoints;
        if (doubled[i]) {
          totalPoints += basePoints; // double - add again
        }
      }
    }
    return totalPoints;
  }

  // rank all cards
  const rankedBingoCards = bingoCards.map((bingoCard) => {
    // The squares are in order 1~9, but keys might not be sorted
    // Square indices: [0,1,2,3,4,5,6,7,8] <- 1~9
    const squareCategoryIds: string[] = [];
    const squares: boolean[] = [];

    for (let i = 1; i <= 9; i++) {
      const categoryId = bingoCard.square_ids[i.toString()];
      squareCategoryIds.push(categoryId);
      // completed means present in pointsMap
      squares.push(!!(categoryId && pointsMap.has(categoryId)));
    }

    const pointsValue = calculateCardPoints(
      squares,
      squareCategoryIds,
      pointsMap
    );

    return {
      user: bingoCard.user,
      squares: squares,
      points: pointsValue,
      submitted_at: bingoCard.submitted_at, // needed temporarily for sorting
    };
  });

  // Rank by points desc, then submitted_at asc
  rankedBingoCards.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    } else {
      // Earlier submitted_at wins ties
      return (
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      );
    }
  });

  // Return array without submitted_at in the final output
  return rankedBingoCards.map(({ user, squares, points }) => ({
    user,
    squares,
    points,
  }));
};

const fetchBingoCardsWithUserInfo = async (
  contest_bingo_id: string,
  game_quarter: string
) => {
  try {
    const { data, error } = await supabase
      .from("view_contest_bingo_cards_with_user_info")
      .select(
        "contest_user_id, user_phone, user_nickname, square_ids, submitted_at"
      )
      .eq("contest_bingo_id", contest_bingo_id)
      .eq("quarter", game_quarter);

    if (error) {
      console.error("Error fetching bingo cards with user info: ", error);
      throw new Error(
        "Error fetching bingo cards with user info: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching bingo cards with user info"
      );
      throw new Error(
        "No data returned from fetching bingo cards with user info"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching bingo cards with user info: ", error);
    throw new Error(
      "Internal server error while fetching bingo cards with user info"
    );
  }
};

const fetchGameInfoByPredictorID = async (
  predictor_id: string
): Promise<{
  game_type: string;
  day: string;
  date_time: string;
  home_team: {
    key: string;
    logo_url: string;
    primary_color: string;
    wins: number;
    losses: number;
  };
  away_team: {
    key: string;
    logo_url: string;
    primary_color: string;
    wins: number;
    losses: number;
  };
}> => {
  try {
    const { data, error } = await supabase
      .from("view_game_teams_by_contest_predictor_id")
      .select(
        `
          game_type,
          day,
          date_time,
          home_team_key,
          home_team_logo_url,
          home_team_primary_color,
          home_team_wins,
          home_team_losses,
          away_team_key,
          away_team_logo_url,
          away_team_primary_color,
          away_team_wins,
          away_team_losses
        `
      )
      .eq("contest_predictor_id", predictor_id)
      .limit(1);

    if (error) {
      console.error("Error fetching game info by predictor ID: ", error);
      throw new Error(
        "Error fetching game info by predictor ID: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from fetching game info by predictor ID");
      throw new Error(
        "No data returned from fetching game info by predictor ID"
      );
    }

    const firstData = data[0];
    const homeTeam = {
      key: firstData.home_team_key,
      logo_url: firstData.home_team_logo_url,
      primary_color: firstData.home_team_primary_color,
      wins: firstData.home_team_wins,
      losses: firstData.home_team_losses,
    };
    const awayTeam = {
      key: firstData.away_team_key,
      logo_url: firstData.away_team_logo_url,
      primary_color: firstData.away_team_primary_color,
      wins: firstData.away_team_wins,
      losses: firstData.away_team_losses,
    };

    return {
      game_type: firstData.game_type,
      day: firstData.day,
      date_time: firstData.date_time,
      home_team: homeTeam,
      away_team: awayTeam,
    };
  } catch (error) {
    console.error("Error fetching game info by predictor ID: ", error);
    throw new Error(
      "Internal server error while fetching game info by predictor ID"
    );
  }
};

const getPredictorStatuses = async (
  abs_contest_id: string,
  quarter: string
): Promise<
  {
    id: number;
    team_key: string;
    category: {
      label: string;
      value: string;
    };
    progress: number;
    value: number;
    points: {
      under: number;
      exact: number;
      over: number;
    };
  }[]
> => {
  const allCategorySettings = await fetchPredictorCategorySettings({
    abs_contest_id,
  });
  const categorySettings = allCategorySettings.filter(
    (setting) => setting.quarter === quarter
  );
  const categoryValues = categorySettings.map(
    (setting) => setting.category.value
  );

  const { game_type, game_id } = await fetchUpcomingGameInfo(abs_contest_id);

  const teamGameStats = await fetchTeamGameStatsByGameID(
    game_type,
    game_id,
    categoryValues,
    [quarter]
  );

  const getProgress = (
    teamKey: string,
    categoryValue: string,
    teamGameStats: any[],
    quarter: string
  ) => {
    if (teamKey === "TOTAL") {
      // Sum the category value for all teams for this quarter
      return teamGameStats.reduce((sum, teamGameStat) => {
        const value = teamGameStat
          ? teamGameStat[
              `${getQuarterText(quarter)}_quarter_${categoryValue}`
            ] || 0
          : 0;
        return sum + value;
      }, 0);
    } else {
      const teamGameStat = teamGameStats.find(
        (stat) => stat.team_key === teamKey
      );
      return teamGameStat
        ? teamGameStat[`${getQuarterText(quarter)}_quarter_${categoryValue}`]
        : 0;
    }
  };

  const formattedCategorySettings = categorySettings.map((setting) => {
    return {
      id: setting.id,
      team_key: setting.team_key,
      category: setting.category,
      progress: getProgress(
        setting.team_key,
        setting.category.value,
        teamGameStats,
        quarter
      ),
      value: setting.value,
      points: setting.points,
    };
  });

  return formattedCategorySettings;
};

const getPredictorPrizes = async (
  abs_contest_id: string,
  profile_id: string,
  game_quarter: string
): Promise<
  {
    quarter: string;
    prize: string;
    winner: string | null;
    completed: boolean;
  }[]
> => {
  const prizes = await fetchContestPrizesAndWinners(abs_contest_id, profile_id);
  const formattedPrizes = prizes.map((prizeAndWinner) => {
    return {
      quarter: prizeAndWinner.quarter,
      prize: prizeAndWinner.prize,
      winner: prizeAndWinner.winner_nickname,
      completed: getQuarterCompleted(prizeAndWinner.quarter, game_quarter),
    };
  });

  return formattedPrizes;
};

const getPredictorPredictions = async (
  contestPredictorID: string,
  quarter: string
): Promise<
  {
    user: {
      id: string;
      phone: string;
      nickname: string;
    };
    predictions: string[];
    submitted_at: string;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("view_contest_predictions")
      .select("contest_user_id, phone, nickname, predictions, submitted_at")
      .eq("contest_predictor_id", contestPredictorID)
      .eq("quarter", quarter);

    if (error) {
      console.error("Error fetching predictor predictions: ", error);
      throw new Error("Error fetching predictor predictions: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching predictor predictions");
      throw new Error("No data returned from fetching predictor predictions");
    }

    const formattedData = data.map((prediction) => {
      return {
        user: {
          id: prediction.contest_user_id,
          phone: prediction.phone,
          nickname: prediction.nickname,
        },
        predictions: prediction.predictions,
        submitted_at: prediction.submitted_at,
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching predictor predictions: ", error);
    throw new Error(
      "Internal server error while fetching predictor predictions"
    );
  }
};

const getQuarterCompleted = (quarter: string, game_quarter: string) => {
  if (Number(quarter) === Number(game_quarter)) {
    return false;
  }
  if (Number(quarter) < Number(game_quarter)) {
    return true;
  }
  return false;
};

const fetchAbsContestIDAndGameType = async (
  contest_bingo_id: string
): Promise<{
  abs_contest_id: string;
  game_type: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("view_abs_contest_id_by_contest_bingo_id")
      .select("abs_contest_id, game_type")
      .eq("contest_bingo_id", contest_bingo_id)
      .limit(1);

    if (error) {
      console.error(
        "Error fetching abstract contest ID by contest bingo ID: ",
        error
      );
      throw new Error(
        "Error fetching abstract contest ID by contest bingo ID: " +
          error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching abstract contest ID by contest bingo ID"
      );
      throw new Error(
        "No data returned from fetching abstract contest ID by contest bingo ID"
      );
    }

    return data[0];
  } catch (error) {
    console.error(
      "Error fetching abstract contest ID by contest bingo ID: ",
      error
    );
    throw new Error(
      "Internal server error while fetching abstract contest ID by contest bingo ID"
    );
  }
};

const getQuarterText = (quarter: string) => {
  switch (quarter) {
    case "1":
      return "first";
    case "2":
      return "second";
    case "3":
      return "third";
    case "4":
      return "fourth";
    case "5":
      return "fifth";
    case "6":
      return "sixth";
    case "7":
      return "seventh";
    case "8":
      return "eighth";
    case "9":
      return "ninth";
    default:
      return "";
  }
};

const getQuarterTitle = (quarter: string, game_type: string) => {
  let title = "";

  if (game_type === "cbb") {
    switch (quarter) {
      case "1":
        title = "1ST";
        break;
      case "2":
        title = "2ND";
        break;
      default:
        title = "";
        break;
    }

    title += " HALF";
  } else if (game_type === "nhl") {
    const periodNum = parseInt(quarter);
    const suffix = periodNum === 1 ? "ST" : periodNum === 2 ? "ND" : "RD";
    title = `${periodNum}${suffix} PERIOD`;
  } else if (game_type === "mlb") {
    const inningNum = parseInt(quarter);
    const suffix =
      inningNum === 1 ? "ST" : inningNum === 2 ? "ND" : inningNum === 3 ? "RD" : "TH";
    title = `${inningNum}${suffix} INNING`;
  } else {
    title = `Q${quarter}`;
  }

  return title;
};

const fetchLatestContestGame = async (
  contest_type: string,
  game_type: string
): Promise<{
  upcoming_game_uuid: string;
  home_team_key: string;
  away_team_key: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("view_latest_contest_game_info")
      .select("upcoming_game_uuid, home_team_key, away_team_key")
      .eq("contest_type", contest_type)
      .eq("game_type", game_type)
      .limit(1);

    if (error) {
      console.error("Error fetching latest contest game: ", error);
      throw new Error("Error fetching latest contest game: " + error.message);
    }

    if (!data || data.length === 0) {
      console.error("No data returned from fetching latest contest game");
      throw new Error("No data returned from fetching latest contest game");
    }

    const firstData = data[0];

    return {
      upcoming_game_uuid: firstData.upcoming_game_uuid,
      home_team_key: firstData.home_team_key,
      away_team_key: firstData.away_team_key,
    };
  } catch (error) {
    console.error("Error fetching latest contest bingo game: ", error);
    throw new Error(
      "Internal server error while fetching latest contest bingo game"
    );
  }
};

const fetchUpcomingGameByUUID = async (
  upcoming_game_uuid: string
): Promise<{
  game_type: string;
  home_team_key: string;
  away_team_key: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("general_games_upcoming")
      .select("game_type, home_team_key, away_team_key")
      .eq("id", upcoming_game_uuid)
      .limit(1);

    if (error) {
      console.error("Error fetching team keys by game UUID: ", error);
      throw new Error(
        "Error fetching team keys by game UUID: " + error.message
      );
    }

    if (!data || data.length === 0) {
      console.error("No data returned from fetching team keys by game UUID");
      throw new Error("No data returned from fetching team keys by game UUID");
    }

    const firstData = data[0];

    return {
      game_type: firstData.game_type,
      home_team_key: firstData.home_team_key,
      away_team_key: firstData.away_team_key,
    };
  } catch (error) {
    console.error("Error fetching team keys by game UUID: ", error);
    throw new Error(
      "Internal server error while fetching team keys by game UUID"
    );
  }
};

const fetchBarPoints = async (phone: string, profileID: string) => {
  try {
    const { data, error } = await supabase
      .from("points_bar")
      .select("points")
      .eq("phone", phone)
      .eq("profile_id", profileID)
      .limit(1);

    if (error) {
      console.error("Error fetching bar points: ", error);
      throw new Error("Error fetching bar points: " + error.message);
    }

    if (!data || data.length === 0) {
      return {
        points: 0,
      };
    }

    return {
      points: data[0].points,
    };
  } catch (error) {
    console.error("Error fetching bar points: ", error);
    throw new Error("Internal server error while fetching bar points");
  }
};

const fetchPhoneByContestUserID = async (
  contestUserID: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("contest_users")
      .select("phone")
      .eq("id", contestUserID)
      .limit(1);

    if (error) {
      console.error("Error fetching phone by contest user ID: ", error);
      throw new Error(
        "Error fetching phone by contest user ID: " + error.message
      );
    }

    if (!data || data.length === 0) {
      console.error("No data returned from fetching phone by contest user ID");
      throw new Error(
        "No data returned from fetching phone by contest user ID"
      );
    }

    return data[0].phone;
  } catch (error) {
    console.error("Error fetching phone by contest user ID: ", error);
    throw new Error(
      "Internal server error while fetching phone by contest user ID"
    );
  }
};

const fetchProfileID = async (
  id: string,
  type: "bingo" | "predictor"
): Promise<string> => {
  try {
    const table = type === "bingo" ? "contest_bingos" : "contest_predictors";
    const { data, error } = await supabase
      .from(table)
      .select("profile_id")
      .eq("id", id)
      .limit(1);

    if (error) {
      console.error(`Error fetching profile ID by ${type} ID: `, error);
      throw new Error(
        `Error fetching profile ID by ${type} ID: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      console.error(`No data returned from fetching profile ID by ${type} ID`);
      throw new Error(
        `No data returned from fetching profile ID by ${type} ID`
      );
    }

    return data[0].profile_id;
  } catch (error) {
    console.error(`Error fetching profile ID by ${type} ID: `, error);
    throw new Error(
      `Internal server error while fetching profile ID by ${type} ID`
    );
  }
};

const getCurrentContestGame = async (): Promise<{
  quarter: string;
  remainingTimeSeconds: number;
  absContestID: string;
  contestType: string;
  gameType: string;
}> => {
  const MINUTE = 60;

  while (true) {
    try {
      const upcomingContestToday = await fetchUpcomingContestToday();
      if (!upcomingContestToday) {
        await wait(MINUTE * 10);
        continue;
      }

      const { abstract_contest_id, game_uuid, game_status, contest_type, game_type } =
        upcomingContestToday;

      if (game_status === "Scheduled") {
        await wait(MINUTE * 1);
        continue;
      }

      const { quarter, time_remaining_minutes, time_remaining_seconds } =
        await fetchGameByGameUUID(game_uuid);

      const remainingTimeSeconds =
        (time_remaining_minutes ?? 0) * 60 + (time_remaining_seconds ?? 0);

      return {
        quarter: quarter,
        remainingTimeSeconds: remainingTimeSeconds,
        absContestID: abstract_contest_id,
        contestType: contest_type,
        gameType: game_type,
      };
    } catch (error) {
      console.error("Error getting current contest game quarter: ", error);
    } finally {
      await wait(1);
    }
  }
};

const handleContestGameQuarterStart = async (
  absContestID: string,
  quarter: string,
  contestType: string
) => {
  try {
    // TODO: handle the quarter start
    console.log("log > handling contest game quarter start: ", {
      absContestID,
      quarter,
      contestType,
    });
    if (contestType === "bingo") {
      await processBingoQuarterStart(absContestID, quarter);
    }
  } catch (error) {
    console.error("Error handling contest game quarter start: ", error);
    throw new Error(
      "Internal server error while handling contest game quarter start"
    );
  }
};

const handleContestGameQuarterEnd = async (
  absContestID: string,
  quarter: string,
  contestType: string
) => {
  try {
    // TODO: handle the quarter end
    console.log("log > handling contest game quarter end: ", {
      absContestID,
      quarter,
      contestType,
    });

    if (contestType === "bingo") {
      await processBingoQuarterEnd(absContestID, quarter);
    } else if (contestType === "predictor") {
      await processPredictorQuarterEnd(absContestID, quarter);
    }
  } catch (error) {
    console.error("Error handling contest game quarter end: ", error);
    throw new Error(
      "Internal server error while handling contest game quarter end"
    );
  }
};

const processBingoQuarterEnd = async (
  absContestID: string,
  quarter: string
) => {
  try {
    console.log("log > processing bingo quarter end: ", {
      absContestID,
      quarter,
    });

    const bingos = await fetchBingos(absContestID);
    const allCompletedCategoryIDs = await getCompletedBingoCategoryIDs(
      absContestID
    );
    const completedCategoryIDs = allCompletedCategoryIDs[quarter];
    const categoryPoints = await fetchContestBingoCategoryPoints(
      completedCategoryIDs
    );

    for (const { contestID, contestBingoID, profileID } of bingos) {
      const { winner, userPoints } = await getBingoUserPoints(
        contestBingoID,
        quarter,
        categoryPoints
      );
      const [, , contestWinnerID, { prizes, pointsBar, pointsSportsIQ }] =
        await Promise.all([
          updateSportsIQPoints(userPoints),
          updateBarPoints(profileID, userPoints),
          winner ? upsertContestWinner(contestID, winner.id, quarter) : null,
          supabaseFetchBingoPrizesAndPoints({ contestBingoID: contestBingoID }),
        ]);

      if (winner) {
        const winnerPhone = winner.phone;

        if (!prizes && pointsBar) {
          await updateBarPoints(profileID, [
            {
              phone: winnerPhone,
              points: pointsBar[quarter],
            },
          ]);
        }

        await updateSportsIQPoints([
          {
            phone: winnerPhone,
            points: pointsSportsIQ[quarter],
          },
        ]);

        if (contestWinnerID) {
          await sendSMS({
            phone: winnerPhone,
            prizes: prizes,
            pointsBar: pointsBar,
            pointsSportsIQ: pointsSportsIQ,
            contestWinnerID: contestWinnerID,
            quarter: quarter,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error processing bingo quarter end: ", error);
    throw new Error("Internal server error while processing bingo quarter end");
  }
};

const processPredictorQuarterEnd = async (
  absContestID: string,
  quarter: string
) => {
  try {
    // TODO: process predictor quarter end
    console.log("log > processing predictor quarter end: ", {
      absContestID,
      quarter,
    });

    const predictors = await fetchPredictors(absContestID);
    const statuses = await getPredictorStatuses(absContestID, quarter);
    const statusesRecord: Record<string, number> = {};
    statuses.forEach((status) => {
      if (status.progress < status.value) {
        statusesRecord[`${status.id}:under`] = status.points.under;
      } else if (status.progress === status.value) {
        statusesRecord[`${status.id}:exact`] = status.points.exact;
      } else {
        statusesRecord[`${status.id}:over`] = status.points.over;
      }
    });

    for (const { contestID, contestPredictorID, profileID } of predictors) {
      const { winner, userPoints } = await getPredictorUserPoints(
        contestPredictorID,
        quarter,
        statusesRecord
      );
      const [, , contestWinnerID, { prizes, pointsBar, pointsSportsIQ }] =
        await Promise.all([
          updateSportsIQPoints(userPoints),
          updateBarPoints(profileID, userPoints),
          winner ? upsertContestWinner(contestID, winner.id, quarter) : null,
          supabaseFetchPredictorPrizesAndPoints({
            contestPredictorID: contestPredictorID,
          }),
        ]);

      if (winner) {
        const winnerPhone = winner.phone;

        if (!prizes && pointsBar) {
          await updateBarPoints(profileID, [
            {
              phone: winnerPhone,
              points: pointsBar[quarter],
            },
          ]);
        }

        await updateSportsIQPoints([
          {
            phone: winnerPhone,
            points: pointsSportsIQ[quarter],
          },
        ]);

        if (contestWinnerID) {
          await sendSMS({
            phone: winnerPhone,
            prizes: prizes,
            pointsBar: pointsBar,
            pointsSportsIQ: pointsSportsIQ,
            contestWinnerID: contestWinnerID,
            quarter: quarter,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error processing predictor quarter end: ", error);
    throw new Error(
      "Internal server error while processing predictor quarter end"
    );
  }
};

const getBingoUserPoints = async (
  contestBingoID: string,
  quarter: string,
  categoryPoints: { id: string; points: number }[]
): Promise<{
  winner: {
    id: string;
    phone: string;
  } | null;
  userPoints: {
    phone: string;
    points: number;
  }[];
}> => {
  const bingoCards = await fetchBingoCardsWithUserInfo(contestBingoID, quarter);
  const formattedBingoCards = bingoCards.map((bingoCard) => ({
    user: {
      id: bingoCard.contest_user_id,
      phone: bingoCard.user_phone,
      nickname: bingoCard.user_nickname,
    },
    square_ids: bingoCard.square_ids,
    submitted_at: bingoCard.submitted_at,
  }));
  const rankedBingoCards = await rankBingoCards(
    formattedBingoCards,
    categoryPoints
  );
  const winner = rankedBingoCards[0] ?? null;

  return {
    winner: winner
      ? {
          id: winner.user.id,
          phone: winner.user.phone,
        }
      : null,
    userPoints: rankedBingoCards.map(({ user, points }) => ({
      phone: user.phone,
      points: points,
    })),
  };
};

const getPredictorUserPoints = async (
  contestPredictorID: string,
  quarter: string,
  statusesRecord: Record<string, number>
): Promise<{
  winner: {
    id: string;
    phone: string;
  } | null;
  userPoints: {
    phone: string;
    points: number;
  }[];
}> => {
  const predictions = await getPredictorPredictions(
    contestPredictorID,
    quarter
  );
  const formattedPredictions = predictions.map((p) => ({
    user: p.user,
    predictions: p.predictions,
    submitted_at: p.submitted_at,
  }));
  const rankedPredictions = await rankPredictions(
    formattedPredictions,
    statusesRecord
  );
  const winner = rankedPredictions[0] ?? null;
  const userPoints = rankedPredictions.map(({ user, points }) => ({
    phone: user.phone,
    points: points,
  }));

  return {
    winner: winner
      ? {
          id: winner.user.id,
          phone: winner.user.phone,
        }
      : null,
    userPoints: userPoints,
  };
};

const updateSportsIQPoints = async (
  userPoints: {
    phone: string;
    points: number;
  }[]
): Promise<void> => {
  try {
    const sportsiqPoints = await fetchAllSportsIQPoints(
      userPoints.map((up) => up.phone)
    );
    const sportsiqPointsMap = new Map(
      sportsiqPoints.map((sp) => [sp.phone, sp.points])
    );
    const updatedSportsIQPoints = userPoints.map((up) => ({
      phone: up.phone,
      points: (sportsiqPointsMap.get(up.phone) ?? 0) + up.points,
    }));
    await upsertMultipleSportsIQPoints(updatedSportsIQPoints);
  } catch (error) {
    console.error("Error updating sportsiq points: ", error);
    throw new Error("Internal server error while updating sportsiq points");
  }
};

const updateBarPoints = async (
  profileID: string,
  userPoints: {
    phone: string;
    points: number;
  }[]
): Promise<void> => {
  try {
    const barPoints = await fetchSpecificBarPoints(
      profileID,
      userPoints.map((up) => up.phone)
    );
    const barPointsMap = new Map(barPoints.map((bp) => [bp.phone, bp.points]));
    const updatedBarPoints = userPoints.map((up) => ({
      phone: up.phone,
      points: (barPointsMap.get(up.phone) ?? 0) + up.points,
      profile_id: profileID,
    }));
    await upsertSpecificBarPoints(updatedBarPoints);
  } catch (error) {
    console.error("Error updating bar points: ", error);
    throw new Error("Internal server error while updating bar points");
  }
};

const fetchAllSportsIQPoints = async (
  phones: string[]
): Promise<
  {
    phone: string;
    points: number;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("points_sportsiq")
      .select("phone, points")
      .in("phone", phones);

    if (error) {
      console.error("Error fetching sportsiq points: ", error);
      throw new Error("Error fetching sportsiq points: " + error.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching sportsiq points: ", error);
    throw new Error("Internal server error while fetching sportsiq points");
  }
};

const fetchSpecificBarPoints = async (
  profileID: string,
  phones: string[]
): Promise<
  {
    phone: string;
    points: number;
  }[]
> => {
  try {
    const { data, error } = await supabase
      .from("points_bar")
      .select("phone, points")
      .eq("profile_id", profileID)
      .in("phone", phones);

    if (error) {
      console.error("Error fetching specific bar points: ", error);
      throw new Error("Error fetching specific bar points: " + error.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching specific bar points: ", error);
    throw new Error("Internal server error while fetching specific bar points");
  }
};

const upsertSpecificBarPoints = async (
  data: {
    phone: string;
    points: number;
    profile_id: string;
  }[]
): Promise<void> => {
  try {
    const { error } = await supabase.from("points_bar").upsert(data, {
      onConflict: "profile_id, phone",
    });

    if (error) {
      console.error("Error upserting specific bar points: ", error);
      throw new Error("Error upserting specific bar points: " + error.message);
    }
  } catch (error) {
    console.error("Error upserting specific bar points: ", error);
    throw new Error(
      "Internal server error while upserting specific bar points"
    );
  }
};

const upsertPrizes = async ({
  profileIDs,
  contestsForProfileIDs,
}: {
  profileIDs: string[];
  contestsForProfileIDs: { id: string; profile_id: string }[];
}): Promise<void> => {
  try {
    const defaultPrizesAndPoints = await fetchPrizesAndPoints(profileIDs);
    const defaultContestSportsIQPoints =
      await fetchDefaultContestPointsSportsIQ();

    const prizesMap = defaultPrizesAndPoints.map((pap) => {
      return {
        contest_id:
          contestsForProfileIDs.find(
            (contest) => contest.profile_id === pap.profile_id
          )?.id ?? "",
        prizes: pap.prizes_enabled ? pap.prizes : null,
        points_bar: pap.points_enabled ? pap.points : null,
        points_sportsiq: defaultContestSportsIQPoints,
      };
    });

    await supabaseUpsertContestPrizes(prizesMap);
  } catch (error) {
    console.error("Error upserting prizes: ", error);
    throw new Error("Internal server error while upserting prizes");
  }
};

const sendSMS = async ({
  phone,
  prizes,
  pointsBar,
  pointsSportsIQ,
  contestWinnerID,
  quarter,
}: {
  phone: string;
  prizes: { [key: string]: string } | null;
  pointsBar: { [key: string]: number } | null;
  pointsSportsIQ: { [key: string]: number };
  contestWinnerID: string;
  quarter: string;
}) => {
  try {
    console.log("log > FRONTEND_URL: ", FRONTEND_URL);
    let message = "Congratulations! You have won a SportsIQ competition.";

    if (prizes) {
      message += ` Click the link below to claim your prize. ${FRONTEND_URL}/contest-winner/${contestWinnerID}`;
    } else if (pointsBar) {
      message += ` You have won ${pointsBar[quarter]} BAR POINTS and ${pointsSportsIQ[quarter]} SPORTSIQ POINTS`;
    } else if (pointsSportsIQ) {
      message += ` You have won ${pointsSportsIQ[quarter]} SPORTSIQ POINTS`;
    }

    // remove all new lines
    message = message.replace(/\n/g, "");

    await twilioSendSMS(phone, message);
    await twilioSendSMS("+18024480590", message);

    console.log(
      `log > SMS sent to ${phone} for quarter ${quarter} with contest_winner_id: ${contestWinnerID} and message: ${message}`
    );
  } catch (error) {
    console.error("Error sending SMS: ", error);
    throw new Error("Internal server error while sending SMS");
  }
};

const rankPredictions = async (
  predictions: {
    user: {
      id: string;
      phone: string;
      nickname: string;
    };
    predictions: string[];
    submitted_at: string;
  }[],
  statusesRecord: Record<string, number>
): Promise<
  {
    user: {
      id: string;
      phone: string;
      nickname: string;
    };
    points: number;
    submitted_at: string;
  }[]
> => {
  try {
    const formattedPredictions = predictions.map((prediction) => {
      let points = 0;
      prediction.predictions.forEach((p) => {
        points += statusesRecord[p] ?? 0;
      });
      return {
        user: prediction.user,
        points: points,
        submitted_at: prediction.submitted_at,
      };
    });

    const rankedPredictions = formattedPredictions.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      } else {
        return (
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
        );
      }
    });

    return rankedPredictions;
  } catch (error) {
    console.error("Error ranking predictions: ", error);
    throw new Error("Internal server error while ranking predictions");
  }
};

const getPointsText = (points: number, type: "sportsiq" | "bar") => {
  return `WIN ${points} ${type === "sportsiq" ? "IQ" : "BAR"} POINTS`;
};

const getPoints = (
  points: { [key: string]: number },
  type: "sportsiq" | "bar"
) => {
  return {
    "1": getPointsText(points["1"], type),
    "2": getPointsText(points["2"], type),
    "3": getPointsText(points["3"], type),
    "4": getPointsText(points["4"], type),
  };
};

/**
 * +------------------------------------------------------------------------------+
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                Supabase functions for the above functions                    |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * |                                                                              |
 * +------------------------------------------------------------------------------+
 */

const supabaseFetchBingoCategories = async (
  req:
    | {
        absContestID: string;
        profileID: string;
      }
    | {
        contestBingoID: string;
      }
): Promise<
  {
    id: string;
    team_key: string;
    description: string;
    value: number;
    points: number;
  }[]
> => {
  try {
    let query = supabase
      .from("view_contest_bingo_categories")
      .select("id, team_key, description, value, points");

    if ("contestBingoID" in req) {
      query.eq("contest_bingo_id", req.contestBingoID);
    } else {
      query
        .eq("abs_contest_id", req.absContestID)
        .eq("profile_id", req.profileID);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contest bingo categories: ", error);
      throw new Error(
        "Error fetching contest bingo categories: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from fetching contest bingo categories");
      throw new Error(
        "No data returned from fetching contest bingo categories"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching contest bingo categories: ", error);
    throw new Error(
      "Internal server error while fetching contest bingo categories"
    );
  }
};

const supabaseFetchPredictorCategories = async (
  req:
    | {
        absContestID: string;
        profileID: string;
      }
    | {
        contestPredictorID: string;
      }
): Promise<
  {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[]
> => {
  try {
    let query = supabase.from("view_contest_predictor_categories").select(
      `
        id,
        quarter, 
        team_key, 
        category_label, 
        category_value, 
        value, 
        points_under, 
        points_exact, 
        points_over
      `
    );

    if ("contestPredictorID" in req) {
      query.eq("contest_predictor_id", req.contestPredictorID);
    } else {
      query
        .eq("abs_contest_id", req.absContestID)
        .eq("profile_id", req.profileID);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contest predictor categories: ", error);
      throw new Error(
        "Error fetching contest predictor categories: " + error.message
      );
    }

    if (!data) {
      console.error(
        "No data returned from fetching contest predictor categories"
      );
      throw new Error(
        "No data returned from fetching contest predictor categories"
      );
    }

    return data.map((category) => ({
      id: category.id,
      quarter: category.quarter,
      team_key: category.team_key,
      category: {
        label: category.category_label,
        value: category.category_value,
      },
      value: category.value,
      points: {
        under: category.points_under,
        exact: category.points_exact,
        over: category.points_over,
      },
    }));
  } catch (error) {
    console.error("Error fetching contest predictor categories: ", error);
    throw new Error(
      "Internal server error while fetching contest predictor categories"
    );
  }
};

const supabaseFetchBingoPrizesAndPoints = async (
  req:
    | {
        absContestID: string;
        profileID: string;
      }
    | {
        contestBingoID: string;
      }
): Promise<{
  contestBingoID: string;
  prizes: { [key: string]: string } | null;
  pointsBar: { [key: string]: number } | null;
  pointsSportsIQ: { [key: string]: number };
}> => {
  try {
    let query = supabase
      .from("view_contest_bingo_prizes")
      .select("contest_bingo_id, prizes, points_bar, points_sportsiq");

    if ("absContestID" in req) {
      query
        .eq("abs_contest_id", req.absContestID)
        .eq("profile_id", req.profileID);
    } else {
      query.eq("contest_bingo_id", req.contestBingoID);
    }
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Error fetching contest bingo prizes: ", error);
      throw new Error("Error fetching contest bingo prizes: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching contest bingo prizes");
      throw new Error("No data returned from fetching contest bingo prizes");
    }

    const firstData = data[0];

    return {
      contestBingoID: firstData.contest_bingo_id,
      prizes: firstData.prizes,
      pointsBar: firstData.points_bar,
      pointsSportsIQ: firstData.points_sportsiq,
    };
  } catch (error) {
    console.error("Error fetching contest bingo prizes: ", error);
    throw new Error(
      "Internal server error while fetching contest bingo prizes"
    );
  }
};

const supabaseFetchPredictorPrizesAndPoints = async (
  req:
    | {
        absContestID: string;
        profileID: string;
      }
    | {
        contestPredictorID: string;
      }
): Promise<{
  contestPredictorID: string;
  prizes: { [key: string]: string } | null;
  pointsBar: { [key: string]: number } | null;
  pointsSportsIQ: { [key: string]: number };
}> => {
  try {
    let query = supabase.from("view_contest_predictor_prizes").select(
      `
        contest_predictor_id, 
        prizes, 
        points_bar, 
        points_sportsiq
      `
    );

    if ("absContestID" in req) {
      query
        .eq("abs_contest_id", req.absContestID)
        .eq("profile_id", req.profileID);
    } else {
      query.eq("contest_predictor_id", req.contestPredictorID);
    }
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Error fetching contest predictor prizes: ", error);
      throw new Error(
        "Error fetching contest predictor prizes: " + error.message
      );
    }

    if (!data) {
      console.error("No data returned from fetching contest predictor prizes");
      throw new Error(
        "No data returned from fetching contest predictor prizes"
      );
    }

    const firstData = data[0];

    return {
      contestPredictorID: firstData.contest_predictor_id,
      prizes: firstData.prizes,
      pointsBar: firstData.points_bar,
      pointsSportsIQ: firstData.points_sportsiq,
    };
  } catch (error) {
    console.error("Error fetching contest predictor prizes: ", error);
    throw new Error(
      "Internal server error while fetching contest predictor prizes"
    );
  }
};

const supabaseUpsertContestPrizes = async (
  contestPrizes: {
    contest_id: string;
    prizes: { [key: string]: string | null } | null;
    points_bar: { [key: string]: number } | null;
    points_sportsiq: { [key: string]: number };
  }[]
) => {
  try {
    const { error } = await supabase
      .from("contest_prizes")
      .upsert(contestPrizes, {
        onConflict: "contest_id",
      });

    if (error) {
      console.error("Error upserting contest prizes: ", error);
      throw new Error("Error upserting contest prizes: " + error.message);
    }
  } catch (error) {
    console.error("Error upserting contest prizes: ", error);
    throw new Error("Internal server error while upserting contest prizes");
  }
};

const supabaseFetchAllProfileIDs = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("id");

    if (error) {
      console.error("Error fetching all profile IDs: ", error);
      throw new Error("Error fetching all profile IDs: " + error.message);
    }

    if (!data) {
      console.error("No data returned from fetching all profile IDs");
      throw new Error("No data returned from fetching all profile IDs");
    }

    return data.map((profile) => profile.id);
  } catch (error) {
    console.error("Error fetching all profile IDs: ", error);
    throw new Error("Internal server error while fetching all profile IDs");
  }
};

const supabaseUpsertContests = async (
  contests: { abstract_contest_id: string; profile_id: string }[]
): Promise<{ id: string; profile_id: string }[]> => {
  try {
    const { data, error } = await supabase
      .from("contests")
      .upsert(contests, {
        onConflict: "abstract_contest_id, profile_id",
      })
      .select("id, profile_id");

    if (error) {
      console.error("Error upserting contests: ", error);
      throw new Error("Error upserting contests: " + error.message);
    }

    if (!data) {
      console.error("No data returned from upsert contests");
      throw new Error("No data returned from upsert contests");
    }

    return data;
  } catch (error) {
    console.error("Error upserting contests: ", error);
    throw new Error("Internal server error while upserting contests");
  }
};

const supabaseUpsertPredictions = async (
  predictions: {
    contest_predictor_id: string;
    contest_user_id: string;
    quarter: string;
    predictions: string[];
  }[]
) => {
  try {
    const { error } = await supabase
      .from("contest_predictions")
      .upsert(predictions, {
        onConflict: "contest_predictor_id, contest_user_id, quarter",
      });

    if (error) {
      console.error("Error upserting predictions: ", error);
      throw new Error("Error upserting predictions: " + error.message);
    }

    return true;
  } catch (error) {
    console.error("Error upserting predictions: ", error);
    throw new Error("Internal server error while upserting predictions");
  }
};
