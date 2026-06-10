import { config } from "../config";
import {
  BettingSplit,
  CBBTeamGameStats,
  GameOdd,
  GameQuarter,
  GameStats,
  LiveGameOdd,
  PreGameOdd,
  Probability,
  SupabaseTotalGame,
  SupabaseTotalTeamProfile,
  SupabaseTotalTeamSeasonStat,
} from "../types";
import {
  getDifferentTotalGames,
  getDifferentTotalTeamSeasonStats,
  getDifferentTotalTeamProfiles,
  upsertTotalGamesUpcoming,
  upsertTotalTeamSeasonStats,
  upsertTotalTeamProfiles,
  getToday,
  upsertTotalGames,
  getDifferentTotalPregameOdds,
  upsertTotalPregameOdds,
  getDifferentTotalLiveGameOdds,
  upsertTotalLiveGameOdds,
  getDifferentTotalTeamGameStats,
  upsertTotalTeamGameStats,
  getBettingSplit,
  getDifferentTotalBettingSplits,
  upsertTotalBettingSplits,
  getProbability,
  getSpecificSportsbookGameOdd,
  getRemainingTimeSeconds,
  getDifferentProbabilities,
  upsertProbabilities,
  parseGameQuarterToInteger,
  setGameOverAtOfFinalGames,
  getCurrentFinalGameIDs,
  removeOldGames,
} from "./generalService";
import { supabase } from "../utils/supabase";

const { DateTime } = require("luxon");
const { apiUrl, apiKey } = config.sportsData;
const allowedSportsbooks: string[] = config.allowedSportsbooks;

export const startPollingCBBGames = async () => {
  let count: number = 0;
  const ONE_MINUTE: number = 60;
  const ONE_HOUR: number = ONE_MINUTE * 60;
  const ONE_DAY: number = ONE_HOUR * 24;

  let today: string = getToday();
  let oneWeek: string[] = [];
  let season: string = "";
  let teamProfiles: SupabaseTotalTeamProfile[] = [];
  let previousTeamProfiles: SupabaseTotalTeamProfile[] = [];
  let teamSeasonStats: SupabaseTotalTeamSeasonStat[] = [];
  let previousTeamSeasonStats: SupabaseTotalTeamSeasonStat[] = [];
  let gamesUpcoming: SupabaseTotalGame[] = [];
  let previousGamesUpcoming: SupabaseTotalGame[] = [];

  let games: SupabaseTotalGame[] = [];
  let previousGames: SupabaseTotalGame[] = [];
  let preGameOdds: PreGameOdd[] = [];
  let previousPreGameOdds: PreGameOdd[] = [];
  let liveGameOdds: LiveGameOdd[] = [];
  let previousLiveGameOdds: LiveGameOdd[] = [];
  let prevTeamGameStatsMain: GameStats[] = [];
  let bettingSplits: BettingSplit[] = [];
  let previousBettingSplits: BettingSplit[] = [];
  let probabilities: Probability[] = [];
  let previousProbabilities: Probability[] = [];
  let currentFinalGameIDs: number[] = [];
  let prevTeamGameStatsFull: CBBTeamGameStats[] = [];

  while (true) {
    try {
      if (count % ONE_HOUR === 0) {
        /// Get today
        today = getToday();
        await removeOldCBBGamesFromTotalGames();
      }

      if (count % ONE_MINUTE === 0) {
        /// pre game odds
        preGameOdds = await fetchCBBPreGameOddsByDate(today);
        const updatedPreGameOdds = getDifferentTotalPregameOdds(
          preGameOdds,
          previousPreGameOdds
        );
        if (updatedPreGameOdds.length > 0) {
          await upsertTotalPregameOdds(updatedPreGameOdds, "cbb");
        }
        previousPreGameOdds = preGameOdds;
      }

      if (count % 1 === 0) {
        /// games
        games = await fetchCBBGamesByDate(today);

        /// set `game_over_at` field of final games
        games = setGameOverAtOfFinalGames(currentFinalGameIDs, games);

        const updatedGames = getDifferentTotalGames(games, previousGames);
        if (updatedGames.length > 0) {
          await upsertTotalGames(updatedGames, "cbb");
        }
        previousGames = games;

        /// live game odds
        liveGameOdds = await fetchCBBLiveGameOddsByDate(today);
        const updatedLiveGameOdds = getDifferentTotalLiveGameOdds(
          liveGameOdds,
          previousLiveGameOdds
        );
        if (updatedLiveGameOdds.length > 0) {
          await upsertTotalLiveGameOdds(updatedLiveGameOdds, "cbb");
        }
        previousLiveGameOdds = liveGameOdds;

        /// probabilities
        probabilities = liveGameOdds.map((liveGameOdd: LiveGameOdd) => {
          const gameID: number = liveGameOdd.game_id;
          const preGameOdd = preGameOdds.find(
            (odd: PreGameOdd) => odd.game_id === gameID
          );
          const game = games.find(
            (game: SupabaseTotalGame) => game.game_id === gameID
          );
          const quarter = game!.quarter;
          const liveGameOddOfDraftKings = getSpecificSportsbookGameOdd(
            liveGameOdd.live_game_odds,
            "DraftKings"
          );
          const preGameOddOfDraftKings = getSpecificSportsbookGameOdd(
            preGameOdd?.pre_game_odds ?? [],
            "DraftKings"
          );
          const timeRemainingSeconds = getRemainingTimeSeconds(
            2 - (parseGameQuarterToInteger(quarter, "cbb") ?? 2),
            20,
            game!.time_remaining_minutes ?? 0,
            game!.time_remaining_seconds ?? 0
          );
          return getProbability(
            "cbb",
            gameID,
            liveGameOddOfDraftKings,
            preGameOddOfDraftKings,
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
          await upsertProbabilities(updatedProbabilities, "cbb");
        }
        previousProbabilities = probabilities;

        /// team game stats
        const { teamGameStatsMain, teamGameStatsFull } =
          await fetchCBBTeamGameStatsByDate(today);
        const updatedTeamGameStatsMain = getDifferentTotalTeamGameStats(
          teamGameStatsMain,
          prevTeamGameStatsMain
        );
        if (updatedTeamGameStatsMain.length > 0) {
          await upsertTotalTeamGameStats(updatedTeamGameStatsMain, "cbb");
        }
        prevTeamGameStatsMain = teamGameStatsMain;

        /// clean up currentFinalGameIDs
        currentFinalGameIDs = getCurrentFinalGameIDs(games);

        /// add quarter to cbbTeamGameStats
        const formattedTeamGameStatsFull = teamGameStatsFull
          .map((teamGameStat) => {
            const gameID = teamGameStat.game_id;
            const game = games.find(
              (game: SupabaseTotalGame) => game.game_id === gameID
            );
            const quarter = game!.quarter;
            if (quarter) {
              return {
                ...teamGameStat,
                quarter: quarter as GameQuarter,
              };
            }
            return null;
          })
          .filter((teamGameStat) => teamGameStat !== null);

        const updatedTeamGameStatsFull = getDifferentTotalCBBTeamGameStats(
          formattedTeamGameStatsFull,
          prevTeamGameStatsFull
        );
        if (updatedTeamGameStatsFull.length > 0) {
          await upsertTotalCBBTeamGameStats(updatedTeamGameStatsFull);
        }
        prevTeamGameStatsFull = formattedTeamGameStatsFull;
      }

      if (count % (ONE_MINUTE * 15) === 0) {
        /// betting splits
        const gameIDs: number[] = games.map(
          (game: SupabaseTotalGame) => game.game_id
        );
        bettingSplits = await Promise.all(
          gameIDs.map((gameID: number) =>
            fetchCBBGameBettingSplitsByGameID(gameID)
          )
        );
        const updatedBettingSplits = getDifferentTotalBettingSplits(
          bettingSplits,
          previousBettingSplits
        );
        if (updatedBettingSplits.length > 0) {
          await upsertTotalBettingSplits(updatedBettingSplits, "cbb");
        }
        previousBettingSplits = bettingSplits;
      }

      if (count === 0) {
        await removeOldCBBGamesFromTotalGamesUpcoming();
        season = await fetchCBBCurrentSeason();

        /// team profiles and team season stats
        [teamProfiles, teamSeasonStats] = await Promise.all([
          fetchCBBTeamsProfiles(),
          fetchCBBTeamSeasonStatsBySeason(season),
        ]);

        gamesUpcoming = [];
        oneWeek = getOneWeek();
        for (const date of oneWeek) {
          const games = await fetchCBBGamesByDate(date);
          gamesUpcoming.push(...games);
        }

        const updatedTeamsProfiles = getDifferentTotalTeamProfiles(
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

        if (updatedTeamsProfiles.length > 0) {
          await upsertTotalTeamProfiles(updatedTeamsProfiles, "cbb");
        }
        if (updatedTeamSeasonStats.length > 0) {
          await upsertTotalTeamSeasonStats(updatedTeamSeasonStats, "cbb");
        }
        if (updatedGamesUpcoming.length > 0) {
          await upsertTotalGamesUpcoming(updatedGamesUpcoming, "cbb");
        }

        previousGamesUpcoming = gamesUpcoming;
        previousTeamProfiles = teamProfiles;
        previousTeamSeasonStats = teamSeasonStats;
      }
    } catch (error) {
      console.error("Error polling CBB games:", error);
    } finally {
      count = (count + 1) % ONE_DAY;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const getOneWeek = (): string[] => {
  const today = getToday();
  const oneWeek = Array.from({ length: 7 }, (_, i) =>
    DateTime.fromFormat(today, "yyyy-MM-dd")
      .plus({ days: i })
      .toFormat("yyyy-MM-dd")
  );
  return oneWeek.filter((date) => date >= today);
};

const fetchCBBCurrentSeason = async (): Promise<string> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/scores/json/CurrentSeason?key=${apiKey}`
    );
    const data = await response.json();
    return data.ApiSeason;
  } catch (error) {
    console.error("Error fetching current season: ", error);
    throw new Error("Error fetching current season: " + error);
  }
};

const fetchCBBGamesByDate = async (
  date: string
): Promise<SupabaseTotalGame[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/scores/json/GamesByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map((game: any) => {
      const quarters = [
        ...(game.Periods ?? []).map((quarter: any) => ({
          name: quarter.Name,
          home_team_score: quarter.HomeScore,
          away_team_score: quarter.AwayScore,
        })),
        {
          name: "full",
          home_team_score: game.HomeTeamScore ?? 0,
          away_team_score: game.AwayTeamScore ?? 0,
        },
      ];

      return {
        game_id: game.GameID,
        game_type: "cbb",
        day: game.Day?.split("T")[0] ?? null,
        date_time: game.DateTime,

        status: game.Status,
        home_team_key: game.HomeTeam,
        home_team_score: game.HomeTeamScore ?? 0,
        away_team_key: game.AwayTeam,
        away_team_score: game.AwayTeamScore ?? 0,

        quarter: game.Period,
        time_remaining_minutes: game.TimeRemainingMinutes,
        time_remaining_seconds: game.TimeRemainingSeconds,

        home_moneyline: game.HomeTeamMoneyLine,
        away_moneyline: game.AwayTeamMoneyLine,
        point_spread: game.PointSpread,
        point_spread_home_moneyline: game.HomePointSpreadPayout,
        point_spread_away_moneyline: game.AwayPointSpreadPayout,
        over_under: game.OverUnder,
        over_payout: game.OverPayout,
        under_payout: game.UnderPayout,
        quarters: quarters,
        game_over_at: null,

        possession: null, // The team that has the ball
        down: null, // The down number
        distance: null, // The distance to the first down
        yard_line: null, // The yard line of the ball
      } as SupabaseTotalGame;
    });
    return formattedData;
  } catch (error) {
    console.error("Error fetching games by date: ", error);
    throw new Error("Error fetching games by date: " + error);
  }
};

const fetchCBBTeamsProfiles = async (): Promise<SupabaseTotalTeamProfile[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/scores/json/TeamsBasic?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map(
      (team: any) =>
        ({
          game_type: "cbb",
          team_key: team.Key,
          team_logo_url: team.TeamLogoUrl,
          team_primary_color: `#${team.PrimaryColor ?? "000000"}`,
        } as SupabaseTotalTeamProfile)
    );
    return formattedData;
  } catch (error) {
    console.error("Error fetching teams profiles: ", error);
    throw new Error("Error fetching teams profiles: " + error);
  }
};

const fetchCBBTeamSeasonStatsBySeason = async (
  season: string
): Promise<SupabaseTotalTeamSeasonStat[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/scores/json/TeamSeasonStats/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map(
      (stat: any) =>
        ({
          game_type: "cbb",
          team_key: stat.Team,
          team_wins: stat.Wins ?? 0,
          team_losses: stat.Losses ?? 0,
        } as SupabaseTotalTeamSeasonStat)
    );
    return formattedData;
  } catch (error) {
    console.error("Error fetching team season stats by season: ", error);
    throw new Error("Error fetching team season stats by season: " + error);
  }
};

const fetchCBBLiveGameOddsByDate = async (
  date: string
): Promise<LiveGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/odds/json/LiveGameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map((game: any) => ({
      game_type: "cbb",
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
    }));
    return filteredData;
  } catch (error) {
    console.error("Error fetching CBB live game odds by date: ", error);
    throw new Error("Error fetching CBB live game odds by date: " + error);
  }
};

const fetchCBBPreGameOddsByDate = async (
  date: string
): Promise<PreGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/odds/json/GameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map(
      (game: any) =>
        ({
          game_type: "cbb",
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
  } catch (error) {
    console.error(`Error fetching CBB pre-game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching CBB pre-game odds");
  }
};

const fetchCBBTeamGameStatsByDate = async (
  date: string
): Promise<{
  teamGameStatsMain: GameStats[];
  teamGameStatsFull: CBBTeamGameStats[];
}> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/scores/json/TeamGameStatsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const getStateValue = (value: number | null) => {
      if (value === null) return null;
      return Math.round(value).toString();
    };
    const round = (value: number | null) => {
      return Math.round(value ?? 0);
    };
    let teamGameStatsMain: GameStats[] = [];
    let teamGameStatsFull: CBBTeamGameStats[] = [];

    data.forEach((stat: any) => {
      // For gameStats
      teamGameStatsMain.push({
        game_type: "cbb",
        team_key: stat.Team,
        stat_one_title: "Rebounds",
        stat_one_value: getStateValue(stat.Rebounds) ?? "",
        stat_two_title: "Assists",
        stat_two_value: getStateValue(stat.Assists) ?? "",
        stat_three_title: "Blocks",
        stat_three_value: getStateValue(stat.BlockedShots) ?? "",
        stat_four_title: "Turnovers",
        stat_four_value: getStateValue(stat.Turnovers) ?? "",
        stat_five_title: "FG%",
        stat_five_value: getStateValue(stat.FieldGoalsPercentage) ?? "",
        stat_six_title: "3PT%",
        stat_six_value: getStateValue(stat.ThreePointersPercentage) ?? "",
      });

      // For teamGameStats
      teamGameStatsFull.push({
        game_type: "cbb",
        team_key: stat.Team,
        game_id: stat.GameID,
        quarter: null,
        three_pointers_made: round(stat.ThreePointersMade),
        three_pointers_missed:
          round(stat.ThreePointersAttempted) - round(stat.ThreePointersMade),
        steals: round(stat.Steals),
        turnovers: round(stat.Turnovers),
        personal_fouls: round(stat.PersonalFouls),
        points: round(stat.Points),
        offensive_rebounds: round(stat.OffensiveRebounds),
        defensive_rebounds: round(stat.DefensiveRebounds),
        rebounds: round(stat.Rebounds),
        blocked_shots: round(stat.BlockedShots),
        field_goals_attempted: round(stat.FieldGoalsAttempted),
        field_goals_made: round(stat.FieldGoalsMade),
        field_goals_missed:
          round(stat.FieldGoalsAttempted) - round(stat.FieldGoalsMade),
        free_throws_attempted: round(stat.FreeThrowsAttempted),
        free_throws_made: round(stat.FreeThrowsMade),
        free_throws_missed:
          round(stat.FreeThrowsAttempted) - round(stat.FreeThrowsMade),
        assists: round(stat.Assists),
      });
    });

    return { teamGameStatsMain, teamGameStatsFull };
  } catch (error) {
    console.error(`Error fetching CBB team game stats by date ${date}:`, error);
    throw new Error("Internal server error while fetching CBB team game stats");
  }
};

const fetchCBBGameBettingSplitsByGameID = async (
  gameID: number
): Promise<BettingSplit> => {
  try {
    const response = await fetch(
      `${apiUrl}/cbb/odds/json/BettingSplitsByGameId/${gameID}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = getBettingSplit(data, "cbb", data.GameID);
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching CBB game betting splits by game ID ${gameID}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching CBB game betting splits"
    );
  }
};

const removeOldCBBGamesFromTotalGames = async () => {
  try {
    await removeOldGames("general_games", "cbb", getToday());
  } catch (error) {
    console.error("Error removing old CBB games from total games:", error);
    throw new Error("Internal server error while removing old CBB games");
  }
};

const removeOldCBBGamesFromTotalGamesUpcoming = async () => {
  try {
    await removeOldGames("general_games_upcoming", "cbb", getToday());
  } catch (error) {
    console.error(
      "Error removing old CBB games from total games upcoming:",
      error
    );
    throw new Error(
      "Internal server error while removing old CBB games from upcoming"
    );
  }
};

const getDifferentTotalCBBTeamGameStats = (
  curCBBTeamGameStats: CBBTeamGameStats[],
  preCBBTeamGameStats: CBBTeamGameStats[]
): CBBTeamGameStats[] => {
  if (
    JSON.stringify(curCBBTeamGameStats) === JSON.stringify(preCBBTeamGameStats)
  ) {
    return [];
  }
  return curCBBTeamGameStats
    .map((cbbTeamGameStat) => {
      const preCBBTeamGameStat = preCBBTeamGameStats.find(
        (s) =>
          s.game_type === cbbTeamGameStat.game_type &&
          s.team_key === cbbTeamGameStat.team_key
      );
      if (
        JSON.stringify(cbbTeamGameStat) !== JSON.stringify(preCBBTeamGameStat)
      ) {
        return cbbTeamGameStat;
      }
      return null;
    })
    .filter((cbbTeamGameStat) => cbbTeamGameStat !== null);
};

const upsertTotalCBBTeamGameStats = async (
  cbbTeamGameStats: CBBTeamGameStats[]
) => {
  try {
    const now = new Date().toISOString();
    const dataToUpsert = cbbTeamGameStats.map((cbbTeamGameStat) => ({
      ...cbbTeamGameStat,
      updated_at: now,
    }));
    const { error } = await supabase
      .from("team_game_stats_cbb")
      .upsert(dataToUpsert, {
        onConflict: "game_type, team_key, quarter",
      });
    if (error) {
      console.error(`Error upserting cbb team game stats :`, error);
      throw new Error(`Error upserting cbb team game stats : ${error.message}`);
    }
    console.log(`log > upserted ${cbbTeamGameStats.length} cbb team game stats`);
  } catch (error) {
    console.error(`Error upserting cbb team game stats :`, error);
    throw new Error("Error upserting cbb team game stats");
  }
};
