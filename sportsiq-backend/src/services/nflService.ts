import { config } from "../config";

import {
  BettingSplit,
  GameOdd,
  GameQuarter,
  GameStats,
  LiveGameOdd,
  NFLTeamGameStats,
  PreGameOdd,
  Probability,
  Quarter,
  SupabaseTotalGame,
  SupabaseTotalTeamProfile,
  SupabaseTotalTeamSeasonStat,
} from "../types";
import { supabase } from "../utils/supabase";
import {
  getDifferentTotalGames,
  getDifferentTotalLiveGameOdds,
  getDifferentTotalPregameOdds,
  getDifferentTotalTeamGameStats,
  getDifferentTotalTeamProfiles,
  getDifferentTotalTeamSeasonStats,
  upsertTotalGames,
  upsertTotalGamesUpcoming,
  upsertTotalLiveGameOdds,
  upsertTotalPregameOdds,
  upsertTotalTeamGameStats,
  upsertTotalTeamProfiles,
  upsertTotalTeamSeasonStats,
  getBettingSplit,
  upsertTotalBettingSplits,
  getDifferentTotalBettingSplits,
  upsertProbabilities,
  getDifferentProbabilities,
  getProbability,
  getRemainingTimeSeconds,
  getSpecificSportsbookGameOdd,
  parseGameQuarterToInteger,
  setGameOverAtOfFinalGames,
  getCurrentFinalGameIDs,
  removeOldGames,
} from "./generalService";

const { apiUrl, apiKey } = config.sportsData;
const allowedSportsbooks: string[] = config.allowedSportsbooks;

const startPollingNFLGames = async () => {
  let count: number = 0;
  const ONE_MINUTE: number = 60;
  const ONE_HOUR: number = ONE_MINUTE * 60;
  const ONE_DAY: number = ONE_HOUR * 24;

  let season: string | null = null;
  let week: number | null = null;
  let teamSeasonStats: SupabaseTotalTeamSeasonStat[] = [];
  let previousTeamSeasonStats: SupabaseTotalTeamSeasonStat[] = [];
  let teamProfiles: SupabaseTotalTeamProfile[] = [];
  let previousTeamProfiles: SupabaseTotalTeamProfile[] = [];
  let gamesUpcoming: SupabaseTotalGame[] = [];
  let previousGamesUpcoming: SupabaseTotalGame[] = [];

  let games: SupabaseTotalGame[] = [];
  let previousGames: SupabaseTotalGame[] = [];
  let preGameOdds: PreGameOdd[] = [];
  let previousPreGameOdds: PreGameOdd[] = [];
  let liveGameOdds: LiveGameOdd[] = [];
  let previousLiveGameOdds: LiveGameOdd[] = [];
  let previousTeamGameStats: GameStats[] = [];
  let bettingSplits: BettingSplit[] = [];
  let previousBettingSplits: BettingSplit[] = [];
  let probabilities: Probability[] = [];
  let previousProbabilities: Probability[] = [];
  let currentFinalGameIDs: number[] = [];
  let nflTeamGameStats: NFLTeamGameStats[] = [];
  let previousNFLTeamGameStats: NFLTeamGameStats[] = [];

  [season, week] = await Promise.all([
    fetchNFLCurrentSeason(),
    fetchNFLCurrentWeek(),
  ]);

  while (true) {
    try {
      if (count % ONE_MINUTE === 0) {
        preGameOdds = await fetchNFLPreGameOddsBySeasonAndWeek(season, week);
        const updatedPreGameOdds = getDifferentTotalPregameOdds(
          preGameOdds,
          previousPreGameOdds
        );
        if (updatedPreGameOdds.length > 0) {
          await upsertTotalPregameOdds(updatedPreGameOdds, "nfl");
        }
        previousPreGameOdds = preGameOdds;
      }

      if (count % 1 === 0) {
        games = await fetchNFLGamesByWeek(season, week);

        /// set `game_over_at` field of final games
        games = setGameOverAtOfFinalGames(currentFinalGameIDs, games);

        const updatedGames = getDifferentTotalGames(games, previousGames);
        if (updatedGames.length > 0) {
          await upsertTotalGames(updatedGames, "nfl");
        }
        previousGames = games;

        liveGameOdds = await fetchNFLLiveGameOddsBySeasonAndWeek(season, week);
        const updatedLiveGameOdds = getDifferentTotalLiveGameOdds(
          liveGameOdds,
          previousLiveGameOdds
        );
        if (updatedLiveGameOdds.length > 0) {
          await upsertTotalLiveGameOdds(updatedLiveGameOdds, "nfl");
        }
        previousLiveGameOdds = liveGameOdds;

        const { teamGameStatsMain, teamGameStatsFull } =
          await fetchNFLTeamGameStatsBySeasonAndWeek(season, week);
        const updatedTeamGameStats = getDifferentTotalTeamGameStats(
          teamGameStatsMain,
          previousTeamGameStats
        );
        if (updatedTeamGameStats.length > 0) {
          await upsertTotalTeamGameStats(updatedTeamGameStats, "nfl");
        }
        previousTeamGameStats = teamGameStatsMain;

        probabilities = liveGameOdds.map((liveGameOdd: LiveGameOdd) => {
          const gameID: number = liveGameOdd.game_id;
          const preGameOdd = preGameOdds.find(
            (odd: PreGameOdd) => odd.game_id === gameID
          );
          const game = games.find(
            (game: SupabaseTotalGame) => game.game_id === gameID
          );
          const quarter = game!.quarter;
          const liveGameOddOfFanDuel = getSpecificSportsbookGameOdd(
            liveGameOdd.live_game_odds,
            "FanDuel"
          );
          const preGameOddOfFanDuel = getSpecificSportsbookGameOdd(
            preGameOdd?.pre_game_odds ?? [],
            "FanDuel"
          );
          const timeRemainingSeconds = getRemainingTimeSeconds(
            4 - (parseGameQuarterToInteger(quarter, "nfl") ?? 4),
            12,
            game!.time_remaining_minutes ?? 0,
            game!.time_remaining_seconds ?? 0
          );
          return getProbability(
            "nfl",
            gameID,
            liveGameOddOfFanDuel,
            preGameOddOfFanDuel,
            timeRemainingSeconds,
            game!.home_team_score,
            game!.away_team_score
          );
        });
        const updatedProbabilities = getDifferentProbabilities(
          probabilities,
          previousProbabilities
        );
        if (updatedProbabilities.length > 0) {
          await upsertProbabilities(updatedProbabilities, "nfl");
        }
        previousProbabilities = probabilities;

        /// clean up currentFinalGameIDs
        currentFinalGameIDs = getCurrentFinalGameIDs(games);

        /// add quarter to nflTeamGameStats
        nflTeamGameStats = teamGameStatsFull
          .map((nflTeamGameStat) => {
            const gameID = nflTeamGameStat.game_id;
            const game = games.find(
              (game: SupabaseTotalGame) => game.game_id === gameID
            );
            const quarter = game!.quarter;
            if (quarter) {
              return {
                ...nflTeamGameStat,
                quarter: quarter as GameQuarter,
              };
            }
            return null;
          })
          .filter((nflTeamGameStat) => nflTeamGameStat !== null);

        const updatedNFLTeamGameStats = getDifferentTotalNFLTeamGameStats(
          nflTeamGameStats,
          previousNFLTeamGameStats
        );
        if (updatedNFLTeamGameStats.length > 0) {
          await upsertTotalNFLTeamGameStats(updatedNFLTeamGameStats);
        }
        previousNFLTeamGameStats = nflTeamGameStats;
      }

      if (count % (ONE_MINUTE * 15) === 0) {
        const gameIDs: number[] = games.map(
          (game: SupabaseTotalGame) => game.game_id
        );
        bettingSplits = await Promise.all(
          gameIDs.map((gameID: number) =>
            fetchNFLGameBettingSplitsByGameID(gameID)
          )
        );
        const updatedBettingSplits = getDifferentTotalBettingSplits(
          bettingSplits,
          previousBettingSplits
        );
        if (updatedBettingSplits.length > 0) {
          await upsertTotalBettingSplits(updatedBettingSplits, "nfl");
        }
        previousBettingSplits = bettingSplits;
      }

      if (count === 0) {
        /// remove old games
        const sortedGames = games.sort((a, b) => {
          return (
            new Date(a.date_time ?? "").getTime() -
            new Date(b.date_time ?? "").getTime()
          );
        });
        const soonestGame = sortedGames[0];
        const soonestGameDay = soonestGame.day ?? "";

        await removeOldNFLGamesFromTotalGames(soonestGameDay);
        await removeOldNFLGamesFromTotalGamesUpcoming(soonestGameDay);

        season = await fetchNFLCurrentSeason();
        week = await fetchNFLCurrentWeek();
        [teamProfiles, teamSeasonStats] = await Promise.all([
          fetchNFLTeamProfilesBySeason(season),
          fetchNFLTeamSeasonStats(season),
        ]);

        gamesUpcoming = [];
        const weeks = [week, week + 1];
        for (const week of weeks) {
          const games = await fetchNFLGamesByWeek(season, week);
          gamesUpcoming.push(...games);
        }

        const updatedTeamProfiles = getDifferentTotalTeamProfiles(
          teamProfiles,
          previousTeamProfiles
        );
        const updatedTeamSeasonStats = getDifferentTotalTeamSeasonStats(
          teamSeasonStats,
          previousTeamSeasonStats
        );
        const updatedGamesUpcoming = getDifferentTotalGames(
          gamesUpcoming,
          previousGamesUpcoming
        );

        if (updatedTeamProfiles.length > 0) {
          await upsertTotalTeamProfiles(updatedTeamProfiles, "nfl");
        }
        if (updatedTeamSeasonStats.length > 0) {
          await upsertTotalTeamSeasonStats(updatedTeamSeasonStats, "nfl");
        }
        if (updatedGamesUpcoming.length > 0) {
          await upsertTotalGamesUpcoming(updatedGamesUpcoming, "nfl");
        }

        previousGamesUpcoming = gamesUpcoming;
        previousTeamProfiles = teamProfiles;
        previousTeamSeasonStats = teamSeasonStats;
      }
    } catch (error) {
      console.error("Error polling NFL games:", error);
    } finally {
      count = (count + 1) % ONE_DAY;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const fetchNFLCurrentSeason = async (): Promise<string> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/CurrentSeason?key=${apiKey}`
  );
  const data = await response.json();
  const formattedData = data.toString();
  return formattedData.includes("POST")
    ? formattedData
    : formattedData + "POST";
};

const fetchNFLCurrentWeek = async (): Promise<number> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/CurrentWeek?key=${apiKey}`
  );
  const data = await response.json();
  return data;
};

const fetchNFLGamesByWeek = async (
  season: string,
  week: number
): Promise<SupabaseTotalGame[]> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/ScoresByWeek/${season}/${week}?key=${apiKey}`
  );
  const data = await response.json();
  const formattedData = data.map((game: any) => {
    let timeRemainingMinutes = null;
    let timeRemainingSeconds = null;
    if (game.TimeRemaining) {
      const [minutes, seconds] = game.TimeRemaining.split(":").map(Number);
      timeRemainingMinutes = minutes;
      timeRemainingSeconds = seconds;
    }
    const quarterOne: Quarter = {
      name: "1",
      home_team_score: game.HomeScoreQuarter1 ?? 0,
      away_team_score: game.AwayScoreQuarter1 ?? 0,
    };
    const quarterTwo: Quarter = {
      name: "2",
      home_team_score: game.HomeScoreQuarter2 ?? 0,
      away_team_score: game.AwayScoreQuarter2 ?? 0,
    };
    const quarterThree: Quarter = {
      name: "3",
      home_team_score: game.HomeScoreQuarter3 ?? 0,
      away_team_score: game.AwayScoreQuarter3 ?? 0,
    };
    const quarterFour: Quarter = {
      name: "4",
      home_team_score: game.HomeScoreQuarter4 ?? 0,
      away_team_score: game.AwayScoreQuarter4 ?? 0,
    };
    const quarterOvertime: Quarter = {
      name: "OT",
      home_team_score: game.HomeScoreOvertime ?? 0,
      away_team_score: game.AwayScoreOvertime ?? 0,
    };
    const quarterFull: Quarter = {
      name: "full",
      home_team_score: game.HomeScore ?? 0,
      away_team_score: game.AwayScore ?? 0,
    };
    const quarters: Quarter[] = [
      quarterOne,
      quarterTwo,
      quarterThree,
      quarterFour,
      quarterOvertime,
      quarterFull,
    ];

    return {
      game_type: "nfl",
      game_id: game.ScoreID,
      day: game.Day?.split("T")[0] ?? null,
      date_time: game.DateTime,
      status: game.Status,
      home_team_key: game.HomeTeam,
      home_team_score: game.HomeScore ?? 0,
      away_team_key: game.AwayTeam,
      away_team_score: game.AwayScore ?? 0,
      quarter: game.Quarter,
      time_remaining_minutes: timeRemainingMinutes,
      time_remaining_seconds: timeRemainingSeconds,
      home_moneyline: game.HomeTeamMoneyLine,
      away_moneyline: game.AwayTeamMoneyLine,
      point_spread: game.PointSpread,
      point_spread_home_moneyline: game.PointSpreadHomeTeamMoneyLine,
      point_spread_away_moneyline: game.PointSpreadAwayTeamMoneyLine,
      over_under: game.OverUnder,
      over_payout: game.OverPayout,
      under_payout: game.UnderPayout,
      quarters: quarters,
      game_over_at: null,
      possession: game.Possession,
      down: game.Down,
      distance: game.Distance,
      yard_line: game.YardLine,
    } as SupabaseTotalGame;
  });
  return formattedData;
};

const fetchNFLTeamSeasonStats = async (
  season: string
): Promise<SupabaseTotalTeamSeasonStat[]> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/Standings/${season}?key=${apiKey}`
  );
  const data = await response.json();
  const formattedData = data.map(
    (standing: any) =>
      ({
        game_type: "nfl",
        team_key: standing.Team,
        team_wins: standing.Wins ?? 0,
        team_losses: standing.Losses ?? 0,
      } as SupabaseTotalTeamSeasonStat)
  );
  return formattedData;
};

const fetchNFLTeamProfilesBySeason = async (
  season: string
): Promise<SupabaseTotalTeamProfile[]> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/Teams/${season}?key=${apiKey}`
  );
  const data = await response.json();
  const formattedData = data.map(
    (team: any) =>
      ({
        game_type: "nfl",
        team_key: team.Key,
        team_logo_url: team.WikipediaLogoUrl,
        team_primary_color: `#${team.PrimaryColor ?? "000000"}`,
      } as SupabaseTotalTeamProfile)
  );
  return formattedData;
};

const fetchNFLTeamGameStatsBySeasonAndWeek = async (
  season: string,
  week: number
): Promise<{
  teamGameStatsMain: GameStats[];
  teamGameStatsFull: NFLTeamGameStats[];
}> => {
  const response = await fetch(
    `${apiUrl}/nfl/scores/json/TeamGameStats/${season}/${week}?key=${apiKey}`
  );
  const data = await response.json();
  const getStateValue = (value: number | null) => {
    if (value === null) return null;
    return value.toString();
  };
  const round = (value: number | null) => {
    return Math.round(value ?? 0);
  };
  let teamGameStatsMain: GameStats[] = [];
  let teamGameStatsFull: NFLTeamGameStats[] = [];

  data.forEach((stat: any) => {
    // For gameStats
    teamGameStatsMain.push({
      game_type: "nfl",
      team_key: stat.Team,
      stat_one_title: "Total Yards",
      stat_one_value: getStateValue(stat.OffensiveYards) ?? "",
      stat_two_title: "Rushing Yards",
      stat_two_value: getStateValue(stat.RushingYards) ?? "",
      stat_three_title: "Passing Yards",
      stat_three_value: getStateValue(stat.PassingYards) ?? "",
      stat_four_title: "First Downs",
      stat_four_value: getStateValue(stat.FirstDowns) ?? "",
      stat_five_title: "Turnovers",
      stat_five_value: getStateValue(stat.Giveaways) ?? "",
      stat_six_title: "Time of Possession",
      stat_six_value: stat.TimeOfPossession ?? "",
    });

    // For teamGameStats
    teamGameStatsFull.push({
      game_type: "nfl",
      team_key: stat.Team,
      game_id: stat.GlobalGameID,
      quarter: null,
      touchdowns: round(stat.Touchdowns),
      field_goals_made: round(stat.FieldGoalsMade),
      field_goals_missed:
        round(stat.FieldGoalAttempts) - round(stat.FieldGoalsMade),
      sacks: round(stat.Sacks),
      safeties: round(stat.Safeties),
      passing_interceptions: round(stat.PassingInterceptions),
      fumbles: round(stat.Fumbles),
      punts: round(stat.Punts),
      extra_point_made: round(stat.ExtraPointKickingConversions),
      extra_point_missed:
        round(stat.ExtraPointKickingAttempts) -
        round(stat.ExtraPointKickingConversions),
      two_pt_conversion_made:
        round(stat.ExtraPointRushingConversions) +
        round(stat.ExtraPointPassingConversions),
      two_pt_conversion_missed:
        round(stat.ExtraPointRushingAttempts) +
        round(stat.ExtraPointPassingAttempts) -
        round(stat.ExtraPointRushingConversions) -
        round(stat.ExtraPointPassingConversions),
      penalties: round(stat.Penalties),
      first_downs: round(stat.FirstDowns),
      points: round(stat.Score),
      first_downs_by_rushing: round(stat.FirstDownsByRushing),
      offensive_yards: round(stat.OffensiveYards),
      offensive_plays: round(stat.OffensivePlays),
      rushing_yards: round(stat.RushingYards),
      passing_yards: round(stat.PassingYards),
      passing_attempts: round(stat.PassingAttempts),
      passing_completions: round(stat.PassingCompletions),
      third_down_conversions: round(stat.ThirdDownConversions),
      fourth_down_conversions: round(stat.FourthDownConversions),
      passing_touchdowns: round(stat.PassingTouchdowns),
      rushing_touchdowns: round(stat.RushingTouchdowns),
    });
  });

  return { teamGameStatsMain, teamGameStatsFull };
};

const fetchNFLGameBettingSplitsByGameID = async (
  gameID: number
): Promise<BettingSplit> => {
  const response = await fetch(
    `${apiUrl}/nfl/odds/json/BettingSplitsByScoreId/${gameID}?key=${apiKey}`
  );
  const data = await response.json();
  const formattedData = getBettingSplit(data, "nfl", data.ScoreId);
  return formattedData;
};

const fetchNFLPreGameOddsBySeasonAndWeek = async (
  season: string,
  week: number
): Promise<PreGameOdd[]> => {
  const response = await fetch(
    `${apiUrl}/nfl/odds/json/GameOddsByWeek/${season}/${week}?key=${apiKey}`
  );
  const data = await response.json();
  const filteredData = data.map(
    (game: any) =>
      ({
        game_type: "nfl",
        game_id: game.GameId,
        pre_game_odds: [...(game.PregameOdds ?? [])]
          .filter((odd: any) => allowedSportsbooks.includes(odd.Sportsbook))
          .map(
            (odd: any) =>
              ({
                sportsbook: odd.Sportsbook,
                home_moneyline: odd.HomeMoneyLine,
                away_moneyline: odd.AwayMoneyLine,
                home_point_spread: odd.HomePointSpread,
                away_point_spread: odd.AwayPointSpread,
                home_point_spread_payout: odd.HomePointSpreadPayout,
                away_point_spread_payout: odd.AwayPointSpreadPayout,
                over_under: odd.OverUnder,
                over_payout: odd.OverPayout,
                under_payout: odd.UnderPayout,
              } as GameOdd)
          ),
      } as PreGameOdd)
  );
  return filteredData;
};

const fetchNFLLiveGameOddsBySeasonAndWeek = async (
  season: string,
  week: number
): Promise<LiveGameOdd[]> => {
  const response = await fetch(
    `${apiUrl}/nfl/odds/json/LiveGameOddsByWeek/${season}/${week}?key=${apiKey}`
  );
  const data = await response.json();
  const filteredData = data.map(
    (game: any) =>
      ({
        game_type: "nfl",
        game_id: game.GameId,
        live_game_odds: [...(game.LiveOdds ?? [])]
          .filter((odd: any) => allowedSportsbooks.includes(odd.Sportsbook))
          .map(
            (odd: any) =>
              ({
                sportsbook: odd.Sportsbook,
                home_moneyline: odd.HomeMoneyLine,
                away_moneyline: odd.AwayMoneyLine,
                home_point_spread: odd.HomePointSpread,
                away_point_spread: odd.AwayPointSpread,
                home_point_spread_payout: odd.HomePointSpreadPayout,
                away_point_spread_payout: odd.AwayPointSpreadPayout,
                over_under: odd.OverUnder,
                over_payout: odd.OverPayout,
                under_payout: odd.UnderPayout,
              } as GameOdd)
          ),
      } as LiveGameOdd)
  );
  return filteredData;
};

const removeOldNFLGamesFromTotalGames = async (standardDay: string) => {
  await removeOldGames("general_games", "nfl", standardDay);
};

const removeOldNFLGamesFromTotalGamesUpcoming = async (standardDay: string) => {
  await removeOldGames("general_games_upcoming", "nfl", standardDay);
};


const getDifferentTotalNFLTeamGameStats = (
  curNFLTeamGameStats: NFLTeamGameStats[],
  preNFLTeamGameStats: NFLTeamGameStats[]
): NFLTeamGameStats[] => {
  if (
    JSON.stringify(curNFLTeamGameStats) === JSON.stringify(preNFLTeamGameStats)
  ) {
    return [];
  }
  return curNFLTeamGameStats
    .map((nflTeamGameStat) => {
      const preNFLTeamGameStat = preNFLTeamGameStats.find(
        (s) =>
          s.game_type === nflTeamGameStat.game_type &&
          s.team_key === nflTeamGameStat.team_key
      );
      if (
        JSON.stringify(nflTeamGameStat) !== JSON.stringify(preNFLTeamGameStat)
      ) {
        return nflTeamGameStat;
      }
      return null;
    })
    .filter((teamGameStat) => teamGameStat !== null);
};

const upsertTotalNFLTeamGameStats = async (
  nflTeamGameStats: NFLTeamGameStats[]
) => {
  try {
    const now = new Date().toISOString();
    const dataToUpsert = nflTeamGameStats.map((nflTeamGameStat) => ({
      ...nflTeamGameStat,
      updated_at: now,
    }));
    const { error } = await supabase
      .from("team_game_stats_nfl")
      .upsert(dataToUpsert, {
        onConflict: "game_type, team_key, quarter",
      });
    if (error) {
      console.error(`Error upserting nfl team game stats :`, error);
      throw new Error(
        `Internal server error while upserting nfl team game stats`
      );
    }
    console.log(`log > upserted ${nflTeamGameStats.length} nfl team game stats`);
  } catch (error) {
    console.error(`Error upserting nfl team game stats :`, error);
    throw new Error(
      `Internal server error while upserting nfl team game stats`
    );
  }
};

export { startPollingNFLGames };
