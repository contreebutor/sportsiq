import {
  GameType,
  LiveGameOdd,
  PreGameOdd,
  SupabaseTotalGame,
  SupabaseTotalTeamProfile,
  SupabaseTotalTeamSeasonStat,
  GameStats,
  BettingSplit,
  Probability,
  GameOdd,
  GameQuarter,
} from "../types";
import {
  calculateTotalProbability,
  calculateCoverProbability,
  calculateWinProbability,
  calculateAlternateWinProbability,
} from "../utils/probabilities";
import { supabase } from "../utils/supabase";

const { DateTime } = require("luxon");

export const upsertTotalGamesUpcoming = async (
  games: SupabaseTotalGame[],
  gameType: GameType
) => {
  const formattedGames = games.map((game) => ({
    game_id: game.game_id,
    game_type: game.game_type,
    game_status: game.status,
    day: game.day,
    date_time: game.date_time,
    home_team_key: game.home_team_key,
    away_team_key: game.away_team_key,
  }));

  try {
    const { error } = await supabase
      .from("general_games_upcoming")
      .upsert(formattedGames, {
        onConflict: "game_type, game_id",
      });

    if (error) {
      console.error(`Error upserting ${gameType} games upcoming :`, error);
      throw new Error(
        `Error upserting ${gameType} games upcoming : ${error.message}`
      );
    }
    console.log(`log > upserted ${formattedGames.length} ${gameType} games upcoming`);
  } catch (error) {
    console.error(`Error upserting ${gameType} games upcoming :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} games upcoming`
    );
  }
};

export const upsertTotalTeamProfiles = async (
  teams: SupabaseTotalTeamProfile[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_team_profiles")
      .upsert(teams, {
        onConflict: "game_type, team_key",
      });

    if (error) {
      console.error(`Error upserting ${gameType} teams profiles :`, error);
      throw new Error(
        `Error upserting ${gameType} teams profiles : ${error.message}`
      );
    }
    console.log(`log > upserted ${teams.length} ${gameType} team profiles`);
  } catch (error) {
    console.error(`Error upserting ${gameType} teams profiles :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} teams profiles`
    );
  }
};

export const upsertTotalTeamSeasonStats = async (
  stats: SupabaseTotalTeamSeasonStat[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_team_season_stats")
      .upsert(stats, {
        onConflict: "game_type, team_key",
      });

    if (error) {
      console.error(`Error upserting ${gameType} team season stats :`, error);
      throw new Error(
        `Error upserting ${gameType} team season stats : ${error.message}`
      );
    }
    console.log(`log > upserted ${stats.length} ${gameType} team season stats`);
  } catch (error) {
    console.error(`Error upserting ${gameType} team season stats : `, error);
    throw new Error(
      `Internal server error while upserting ${gameType} team season stats`
    );
  }
};

export const getDifferentTotalGames = (
  curGames: SupabaseTotalGame[],
  preGames: SupabaseTotalGame[]
): SupabaseTotalGame[] => {
  if (JSON.stringify(curGames) === JSON.stringify(preGames)) {
    return [];
  }

  return curGames
    .map((game) => {
      const preGame = preGames.find(
        (g) => g.game_type === game.game_type && g.game_id === game.game_id
      );
      if (JSON.stringify(game) !== JSON.stringify(preGame)) {
        return game;
      }
      return null;
    })
    .filter((game) => game !== null);
};

export const getDifferentTotalTeamProfiles = (
  curTeams: SupabaseTotalTeamProfile[],
  preTeams: SupabaseTotalTeamProfile[]
): SupabaseTotalTeamProfile[] => {
  if (JSON.stringify(curTeams) === JSON.stringify(preTeams)) {
    return [];
  }

  return curTeams
    .map((team) => {
      const preTeam = preTeams.find(
        (t) => t.game_type === team.game_type && t.team_key === team.team_key
      );
      if (JSON.stringify(team) !== JSON.stringify(preTeam)) {
        return team;
      }
      return null;
    })
    .filter((team) => team !== null);
};

export const getDifferentTotalTeamSeasonStats = (
  curStats: SupabaseTotalTeamSeasonStat[],
  preStats: SupabaseTotalTeamSeasonStat[]
): SupabaseTotalTeamSeasonStat[] => {
  if (JSON.stringify(curStats) === JSON.stringify(preStats)) {
    return [];
  }

  return curStats
    .map((stat) => {
      const preStat = preStats.find(
        (s) => s.game_type === stat.game_type && s.team_key === stat.team_key
      );
      if (JSON.stringify(stat) !== JSON.stringify(preStat)) {
        return stat;
      }
      return null;
    })
    .filter((stat) => stat !== null);
};

export const getDifferentTotalPregameOdds = (
  curPregameOdds: PreGameOdd[],
  prePregameOdds: PreGameOdd[]
): PreGameOdd[] => {
  if (JSON.stringify(curPregameOdds) === JSON.stringify(prePregameOdds)) {
    return [];
  }

  return curPregameOdds
    .map((pregameOdd) => {
      const prePregameOdd = prePregameOdds.find(
        (p) =>
          p.game_type === pregameOdd.game_type &&
          p.game_id === pregameOdd.game_id
      );
      if (JSON.stringify(pregameOdd) !== JSON.stringify(prePregameOdd)) {
        return pregameOdd;
      }
      return null;
    })
    .filter((pregameOdd) => pregameOdd !== null);
};

export const getDifferentTotalLiveGameOdds = (
  curLiveGameOdds: LiveGameOdd[],
  preLiveGameOdds: LiveGameOdd[]
): LiveGameOdd[] => {
  if (JSON.stringify(curLiveGameOdds) === JSON.stringify(preLiveGameOdds)) {
    return [];
  }

  return curLiveGameOdds
    .map((liveGameOdd) => {
      const preLiveGameOdd = preLiveGameOdds.find(
        (l) =>
          l.game_type === liveGameOdd.game_type &&
          l.game_id === liveGameOdd.game_id
      );
      if (JSON.stringify(liveGameOdd) !== JSON.stringify(preLiveGameOdd)) {
        return liveGameOdd;
      }
      return null;
    })
    .filter((liveGameOdd) => liveGameOdd !== null);
};

export const getDifferentTotalTeamGameStats = (
  curTeamGameStats: GameStats[],
  preTeamGameStats: GameStats[]
): GameStats[] => {
  if (JSON.stringify(curTeamGameStats) === JSON.stringify(preTeamGameStats)) {
    return [];
  }
  return curTeamGameStats
    .map((teamGameStat) => {
      const preTeamGameStat = preTeamGameStats.find(
        (s) =>
          s.game_type === teamGameStat.game_type &&
          s.team_key === teamGameStat.team_key
      );
      if (JSON.stringify(teamGameStat) !== JSON.stringify(preTeamGameStat)) {
        return teamGameStat;
      }
      return null;
    })
    .filter((teamGameStat) => teamGameStat !== null);
};

export const getDifferentTotalBettingSplits = (
  curBettingSplits: BettingSplit[],
  preBettingSplits: BettingSplit[]
): BettingSplit[] => {
  if (JSON.stringify(curBettingSplits) === JSON.stringify(preBettingSplits)) {
    return [];
  }
  return curBettingSplits
    .map((bettingSplit) => {
      const preBettingSplit = preBettingSplits.find(
        (b) =>
          b.game_type === bettingSplit.game_type &&
          b.game_id === bettingSplit.game_id
      );
      if (JSON.stringify(bettingSplit) !== JSON.stringify(preBettingSplit)) {
        return bettingSplit;
      }
      return null;
    })
    .filter((bettingSplit) => bettingSplit !== null);
};

export const getDifferentProbabilities = (
  curProbabilities: Probability[],
  preProbabilities: Probability[]
): Probability[] => {
  if (JSON.stringify(curProbabilities) === JSON.stringify(preProbabilities)) {
    return [];
  }

  return curProbabilities
    .map((probability) => {
      const preProbability = preProbabilities.find(
        (p) => p.game_id === probability.game_id
      );
      if (JSON.stringify(probability) !== JSON.stringify(preProbability)) {
        return probability;
      }
      return null;
    })
    .filter((probability) => probability !== null);
};

export const getToday = (): string => {
  return DateTime.now().setZone("America/Los_Angeles").toFormat("yyyy-MM-dd");
};

export const upsertTotalGames = async (
  games: SupabaseTotalGame[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase.from("general_games").upsert(games, {
      onConflict: "game_type, game_id",
    });

    if (error) {
      console.error(`Error upserting ${gameType} games :`, error);
      throw new Error(`Error upserting ${gameType} games : ${error.message}`);
    }
    console.log(`log > upserted ${games.length} ${gameType} games`);
  } catch (error) {
    console.error(`Error upserting ${gameType} games :`, error);
    throw new Error(`Internal server error while upserting ${gameType} games`);
  }
};

export const upsertTotalPregameOdds = async (
  preGameOdds: PreGameOdd[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_pre_game_odds")
      .upsert(preGameOdds, {
        onConflict: "game_type, game_id",
      });
    if (error) {
      console.error(`Error upserting ${gameType} pregame odds :`, error);
      throw new Error(
        `Error upserting ${gameType} pregame odds : ${error.message}`
      );
    }
    console.log(`log > upserted ${preGameOdds.length} ${gameType} pregame odds`);
  } catch (error) {
    console.error(`Error upserting ${gameType} pregame odds :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} pregame odds`
    );
  }
};

export const upsertTotalLiveGameOdds = async (
  liveGameOdds: LiveGameOdd[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_live_game_odds")
      .upsert(liveGameOdds, {
        onConflict: "game_type, game_id",
      });
    if (error) {
      console.error(`Error upserting ${gameType} live game odds :`, error);
      throw new Error(
        `Error upserting ${gameType} live game odds : ${error.message}`
      );
    }
    console.log(`log > upserted ${liveGameOdds.length} ${gameType} live game odds`);
  } catch (error) {
    console.error(`Error upserting ${gameType} live game odds :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} live game odds`
    );
  }
};

export const upsertTotalTeamGameStats = async (
  teamGameStats: GameStats[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_team_game_stats")
      .upsert(teamGameStats, {
        onConflict: "game_type, team_key",
      });
    if (error) {
      console.error(`Error upserting ${gameType} team game stats :`, error);
      throw new Error(
        `Error upserting ${gameType} team game stats : ${error.message}`
      );
    }
    console.log(`log > upserted ${teamGameStats.length} ${gameType} team game stats`);
  } catch (error) {
    console.error(`Error upserting ${gameType} team game stats :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} team game stats`
    );
  }
};

export const upsertTotalBettingSplits = async (
  bettingSplits: BettingSplit[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_betting_splits")
      .upsert(bettingSplits, {
        onConflict: "game_type, game_id",
      });
    if (error) {
      console.error(`Error upserting ${gameType} betting splits :`, error);
      throw new Error(
        `Error upserting ${gameType} betting splits : ${error.message}`
      );
    }
    console.log(`log > upserted ${bettingSplits.length} ${gameType} betting splits`);
  } catch (error) {
    console.error(`Error upserting ${gameType} betting splits :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} betting splits`
    );
  }
};

export const upsertProbabilities = async (
  probabilities: Probability[],
  gameType: GameType
) => {
  try {
    const { error } = await supabase
      .from("general_probabilities")
      .upsert(probabilities, {
        onConflict: "game_type, game_id",
      });
    if (error) {
      console.error(`Error upserting ${gameType} probabilities :`, error);
      throw new Error(
        `Error upserting ${gameType} probabilities : ${error.message}`
      );
    }
    console.log(`log > upserted ${probabilities.length} ${gameType} probabilities`);
  } catch (error) {
    console.error(`Error upserting ${gameType} probabilities :`, error);
    throw new Error(
      `Internal server error while upserting ${gameType} probabilities`
    );
  }
};

export const getBettingSplit = (
  data: any,
  gameType: GameType,
  gameID: number
) => {
  const bettingMarketSplits = data.BettingMarketSplits;
  const markets: Record<string, any> = {};
  for (const market of bettingMarketSplits || []) {
    markets[market.BettingBetType] = market;
  }
  const moneyline = markets["Moneyline"] || null;
  const spread = markets["Spread"] || null;
  const total = markets["Total Points"] || null;
  const getSplit = (market: any, outcome: string) =>
    market?.BettingSplits?.find(
      (split: any) => split.BettingOutcomeType === outcome
    ) || null;
  const homeMoneyline = getSplit(moneyline, "Home");
  const awayMoneyline = getSplit(moneyline, "Away");
  const homeSpread = getSplit(spread, "Home");
  const awaySpread = getSplit(spread, "Away");
  const overTotal = getSplit(total, "Over");
  const underTotal = getSplit(total, "Under");

  return {
    game_type: gameType,
    game_id: gameID,
    home_bet_moneyline: homeMoneyline?.BetPercentage ?? null,
    home_bet_spread: homeSpread?.BetPercentage ?? null,
    home_bet_total: overTotal?.BetPercentage ?? null,
    home_money_moneyline: homeMoneyline?.MoneyPercentage ?? null,
    home_money_spread: homeSpread?.MoneyPercentage ?? null,
    home_money_total: overTotal?.MoneyPercentage ?? null,
    away_bet_moneyline: awayMoneyline?.BetPercentage ?? null,
    away_bet_spread: awaySpread?.BetPercentage ?? null,
    away_bet_total: underTotal?.BetPercentage ?? null,
    away_money_moneyline: awayMoneyline?.MoneyPercentage ?? null,
    away_money_spread: awaySpread?.MoneyPercentage ?? null,
    away_money_total: underTotal?.MoneyPercentage ?? null,
  };
};

export const parseGameQuarterToInteger = (
  quarter: GameQuarter,
  gameType: GameType
): number | null => {
  switch (quarter) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return gameType === "mlb" ? 4 : 4;
    case "5":
      return 5;
    case "6":
      return 6;
    case "7":
      return 7;
    case "8":
      return 8;
    case "9":
      return 9;
    case "OT":
    case "F":
    case "F/OT":
      return gameType === "mlb" ? 9 : 4;
    case "HALF":
      return gameType === "cbb" ? 1 : 2;
    default:
      return null;
  }
};

export const getRemainingTimeSeconds = (
  remainingQuarters: number,
  minutesPerQuarter: number,
  timeRemainingMinutes: number,
  timeRemainingSeconds: number
) => {
  return (
    (remainingQuarters * minutesPerQuarter + timeRemainingMinutes) * 60 +
    timeRemainingSeconds
  );
};

export const getSpecificSportsbookGameOdd = (
  gameOdds: GameOdd[],
  sportsbook: string
) => {
  return gameOdds.find((gameOdd) => gameOdd.sportsbook === sportsbook) ?? null;
};

export const getProbability = (
  gameType: GameType,
  gameID: number,
  liveGameOdd: GameOdd | null,
  preGameOdd: GameOdd | null,
  timeRemainingSeconds: number,
  homeScore?: number | null,
  awayScore?: number | null
): Probability => {
  const isWinProbabilityCalculable =
    !!liveGameOdd?.home_moneyline && !!liveGameOdd?.away_moneyline;
  const isCoverProbabilityCalculable =
    !!liveGameOdd?.home_point_spread && !!preGameOdd?.home_point_spread;
  // Total probability is calculable if we have pregame total and current scores
  // (liveTotal can be null and will be calculated)
  const isTotalProbabilityCalculable =
    !!preGameOdd?.over_under &&
    homeScore !== null &&
    homeScore !== undefined &&
    awayScore !== null &&
    awayScore !== undefined;

  // Calculate win probability using moneyline if available, otherwise use alternate method
  let winProb: { teamA: number | null; teamB: number | null };
  if (isWinProbabilityCalculable) {
    winProb = calculateWinProbability(
      liveGameOdd.home_moneyline!,
      liveGameOdd.away_moneyline!
    );
  } else if (
    homeScore !== null &&
    homeScore !== undefined &&
    awayScore !== null &&
    awayScore !== undefined
  ) {
    // Use alternate win probability calculation when moneyline is NULL
    const currentLead = homeScore - awayScore;
    winProb = calculateAlternateWinProbability(
      currentLead,
      timeRemainingSeconds,
      gameType
    );
  } else {
    winProb = { teamA: null, teamB: null };
  }

  const coverProb = isCoverProbabilityCalculable
    ? calculateCoverProbability(
        liveGameOdd.home_point_spread!,
        preGameOdd.home_point_spread!,
        timeRemainingSeconds,
        gameType
      )
    : { teamA: null, teamB: null };

  const totalProb = isTotalProbabilityCalculable
    ? calculateTotalProbability(
        liveGameOdd?.over_under ?? null,
        preGameOdd.over_under!,
        timeRemainingSeconds,
        gameType,
        (homeScore ?? 0) + (awayScore ?? 0)
      )
    : { over: null, under: null };

  const getRoundedPercent = (value: number | null): number | null => {
    return !!value ? Math.round(value * 100) : null;
  };

  return {
    game_type: gameType,
    game_id: gameID,
    home_win_probability: getRoundedPercent(winProb.teamA),
    away_win_probability: getRoundedPercent(winProb.teamB),
    home_cover_probability: getRoundedPercent(coverProb.teamA),
    away_cover_probability: getRoundedPercent(coverProb.teamB),
    home_total_probability: getRoundedPercent(totalProb.over),
    away_total_probability: getRoundedPercent(totalProb.under),
  };
};

export const setGameOverAtOfFinalGames = (
  currentFinalGameIDs: number[],
  games: SupabaseTotalGame[]
): SupabaseTotalGame[] => {
  const updatedGames = games.map((game) => {
    const isFinalGame = ["Final", "F/OT"].includes(game.status);
    const isNewFinalGame =
      isFinalGame && !currentFinalGameIDs.includes(game.game_id);

    if (isNewFinalGame) {
      const currentTime = DateTime.now().setZone("America/New_York");
      return {
        ...game,
        game_over_at: currentTime.toISO(),
      };
    }

    return game;
  });

  return updatedGames;
};

export const getCurrentFinalGameIDs = (
  games: SupabaseTotalGame[]
): number[] => {
  return games
    .filter((game) => ["Final", "F/OT"].includes(game.status))
    .map((game) => game.game_id);
};

export const removeOldGames = async (
  tableName: string,
  gameType: string,
  standardDay: string
) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq("game_type", gameType)
      .lt("date_time", `${standardDay}T00:00:00`)
      .select();

    if (error) {
      console.error(
        `Error removing old ${gameType} games from ${tableName}:`,
        error
      );
      throw new Error(
        `Error removing old ${gameType} games from ${tableName}: ` +
          error.message
      );
    }
  } catch (error) {
    console.log(
      `error removing old ${gameType} games from ${tableName}: `,
      error
    );
  }
};

export const removeCanceledGames = async (
  tableName: "general_games" | "general_games_upcoming"
) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(tableName === "general_games" ? "status" : "game_status", "Canceled");
    if (error) {
      const errorMessage = `Error removing canceled games from ${tableName}: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = `Error removing canceled games from ${tableName}: ${error}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export const fetchSportsIQPoints = async (
  phone: string
): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from("points_sportsiq")
      .select("points")
      .eq("phone", phone)
      .limit(1);

    if (error) {
      const message = `Error fetching sportsiq points: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0].points;
  } catch (error) {
    const message = `Error fetching sportsiq points: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const upsertMultipleSportsIQPoints = async (
  userPoints: {
    phone: string;
    points: number;
  }[]
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("points_sportsiq")
      .upsert(userPoints, { onConflict: "phone" });

    if (error) {
      const message = `Error upserting sportsiq points: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }

    return;
  } catch (error) {
    const message = `Error upserting sportsiq points: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const wait = async (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

// ---------- Local trivia question bank (A1) ----------

export interface LocalTriviaQuestion {
  id: number;
  no: number;
  question: string;
  answers: string[];
  correct_answer: string;
  category: string;
  fun_fact: string;
  profile_tags: string[];
}

const TOTAL_QUESTIONS = 750;

/**
 * Generate `count` unique random numbers between 1 and TOTAL_QUESTIONS,
 * excluding any numbers in `excludeNos`.
 */
function generateRandomNos(count: number, excludeNos: number[] = []): number[] {
  const excludeSet = new Set(excludeNos);
  const available: number[] = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    if (!excludeSet.has(i)) available.push(i);
  }

  // Fisher-Yates shuffle and take first `count`
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, count);
}

/**
 * Fetch a random trivia question from the local DB using the "no" column.
 * Generates a random number between 1-500 and fetches that question.
 * Optionally pass `excludeNos` to avoid recently-used question numbers.
 */
export const fetchRandomTriviaQuestion = async (
  excludeNos: number[] = []
): Promise<LocalTriviaQuestion | null> => {
  try {
    const randomNos = generateRandomNos(1, excludeNos);
    if (randomNos.length === 0) return null;

    const { data, error } = await supabase
      .from("trivia_questions")
      .select("id, no, question, answers, correct_answer, category, fun_fact, profile_tags")
      .eq("no", randomNos[0])
      .single();

    if (error) {
      console.error("Error fetching trivia question:", error.message);
      return null;
    }

    return data as LocalTriviaQuestion;
  } catch (err) {
    console.error("Error fetching trivia question:", err);
    return null;
  }
};

export const incrementTriviaQuestionStats = async (
  questionId: number,
  answered: number,
  correct: number
): Promise<void> => {
  if (answered <= 0) return;
  const { error } = await supabase.rpc("increment_trivia_stats", {
    q_id: questionId,
    answered,
    correct,
  });
  if (error) {
    console.error("Error incrementing trivia question stats:", error.message);
  }
};

// ---------- Login Streak (B6) ----------

const STREAK_BONUS: Record<number, number> = {
  1: 500,
  2: 750,
  3: 1000,
  4: 1500,
  5: 2000,
  6: 3000,
};
const STREAK_BONUS_MAX = 5000; // 7+

/**
 * Process daily login streak for a user.
 * Reads login_streak and last_streak_date from m_users,
 * increments if yesterday, resets if gap, no-op if today.
 * Returns { loginStreak, bonusAwarded } — bonusAwarded is 0 if already logged in today.
 */
export const processLoginStreak = async (
  phone: string
): Promise<{ loginStreak: number; bonusAwarded: number }> => {
  const todayStr = getToday(); // yyyy-MM-dd in America/Los_Angeles

  const { data, error } = await supabase
    .from("m_users")
    .select("id, login_streak, last_streak_date")
    .eq("phone", phone)
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Error fetching streak data:", error);
    return { loginStreak: 0, bonusAwarded: 0 };
  }

  const lastDate: string | null = data.last_streak_date;
  let streak: number = data.login_streak ?? 0;

  if (lastDate === todayStr) {
    // Already logged in today — no-op
    return { loginStreak: streak, bonusAwarded: 0 };
  }

  // Check if last login was yesterday
  const today = new Date(todayStr + "T00:00:00");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (lastDate === yesterdayStr) {
    streak += 1;
  } else {
    streak = 1; // gap — reset to day 1
  }

  // Calculate bonus
  const bonusAwarded =
    streak >= 7 ? STREAK_BONUS_MAX : STREAK_BONUS[streak] ?? 500;

  // Update streak in m_users
  const { error: updateError } = await supabase
    .from("m_users")
    .update({ login_streak: streak, last_streak_date: todayStr })
    .eq("id", data.id);

  if (updateError) {
    console.error("Error updating login streak:", updateError);
  }

  // Award bonus points
  const currentPoints = (await fetchSportsIQPoints(phone)) ?? 0;
  await upsertMultipleSportsIQPoints([
    { phone, points: currentPoints + bonusAwarded },
  ]);

  return { loginStreak: streak, bonusAwarded };
};
