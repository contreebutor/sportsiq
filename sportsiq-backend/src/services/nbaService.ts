import { config } from "../config";
import {
  BettingSplit,
  GameOdd,
  GameQuarter,
  GameStats,
  LiveGameOdd,
  NBATeamGameStats,
  PreGameOdd,
  Probability,
  SupabaseTotalGame,
  SupabaseTotalTeamProfile,
  SupabaseTotalTeamSeasonStat,
} from "../types";
import { supabase } from "../utils/supabase";
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
  removeCanceledGames,
} from "./generalService";

const { DateTime } = require("luxon");
const { apiUrl, apiKey } = config.sportsData;
const allowedSportsbooks: string[] = config.allowedSportsbooks;

export const startPollingNBAGames = async () => {
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
  let previousTeamGameStats: GameStats[] = [];
  let bettingSplits: BettingSplit[] = [];
  let previousBettingSplits: BettingSplit[] = [];
  let probabilities: Probability[] = [];
  let previousProbabilities: Probability[] = [];
  let currentFinalGameIDs: number[] = [];
  let nbaTeamGameStats: NBATeamGameStats[] = [];
  let previousNBATeamGameStats: NBATeamGameStats[] = [];

  while (true) {
    try {
      if (count % ONE_HOUR === 0) {
        /// Get today
        today = getToday();
        await removeOldNBAGamesFromTotalGames();

        /// remove all canceled games whatever the game type is
        await removeCanceledGames("general_games");
        await removeCanceledGames("general_games_upcoming");
      }

      if (count % ONE_MINUTE === 0) {
        /// pre game odds
        preGameOdds = await fetchNBAPreGameOddsByDate(today);
        const updatedPreGameOdds = getDifferentTotalPregameOdds(
          preGameOdds,
          previousPreGameOdds
        );
        if (updatedPreGameOdds.length > 0) {
          await upsertTotalPregameOdds(updatedPreGameOdds, "nba");
        }
        previousPreGameOdds = preGameOdds;
      }

      if (count % 1 === 0) {
        /// games
        games = await fetchNBAGamesByDate(today);

        /// set `game_over_at` field of final games
        games = setGameOverAtOfFinalGames(currentFinalGameIDs, games);

        const updatedGames = getDifferentTotalGames(games, previousGames);
        if (updatedGames.length > 0) {
          await upsertTotalGames(updatedGames, "nba");
        }
        previousGames = games;

        /// live game odds
        liveGameOdds = await fetchNBALiveGameOddsByDate(today);
        const updatedLiveGameOdds = getDifferentTotalLiveGameOdds(
          liveGameOdds,
          previousLiveGameOdds
        );
        if (updatedLiveGameOdds.length > 0) {
          await upsertTotalLiveGameOdds(updatedLiveGameOdds, "nba");
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
            4 - (parseGameQuarterToInteger(quarter, "nba") ?? 4),
            12,
            game!.time_remaining_minutes ?? 0,
            game!.time_remaining_seconds ?? 0
          );
          return getProbability(
            "nba",
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
          await upsertProbabilities(updatedProbabilities, "nba");
        }
        previousProbabilities = probabilities;

        /// team game stats
        const { teamGameStatsMain, teamGameStatsFull } =
          await fetchNBATeamGameStatsByDate(today);
        const updatedTeamGameStats = getDifferentTotalTeamGameStats(
          teamGameStatsMain,
          previousTeamGameStats
        );
        if (updatedTeamGameStats.length > 0) {
          await upsertTotalTeamGameStats(updatedTeamGameStats, "nba");
        }
        previousTeamGameStats = teamGameStatsMain;

        /// clean up currentFinalGameIDs
        currentFinalGameIDs = getCurrentFinalGameIDs(games);

        /// add quarter to nbaTeamGameStats
        nbaTeamGameStats = teamGameStatsFull
          .map((nbaTeamGameStat) => {
            const gameID = nbaTeamGameStat.game_id;
            const game = games.find(
              (game: SupabaseTotalGame) => game.game_id === gameID
            );
            const quarter = game!.quarter;
            if (quarter) {
              return {
                ...nbaTeamGameStat,
                quarter: quarter as GameQuarter,
              };
            }
            return null;
          })
          .filter((nbaTeamGameStat) => nbaTeamGameStat !== null);

        const updatedNBATeamGameStats = getDifferentTotalNBATeamGameStats(
          nbaTeamGameStats,
          previousNBATeamGameStats
        );
        if (updatedNBATeamGameStats.length > 0) {
          await upsertTotalNBATeamGameStats(updatedNBATeamGameStats);
        }
        previousNBATeamGameStats = nbaTeamGameStats;
      }

      if (count % (ONE_MINUTE * 15) === 0) {
        /// betting splits
        const gameIDs: number[] = games.map(
          (game: SupabaseTotalGame) => game.game_id
        );
        bettingSplits = await Promise.all(
          gameIDs.map((gameID: number) =>
            fetchNBAGameBettingSplitsByGameID(gameID)
          )
        );
        const updatedBettingSplits = getDifferentTotalBettingSplits(
          bettingSplits,
          previousBettingSplits
        );
        if (updatedBettingSplits.length > 0) {
          await upsertTotalBettingSplits(updatedBettingSplits, "nba");
        }
        previousBettingSplits = bettingSplits;
      }

      if (count === 0) {
        await removeOldNBAGamesFromTotalGamesUpcoming();
        season = await fetchCurrentNBASeason();

        /// team profiles and team season stats
        [teamProfiles, teamSeasonStats] = await Promise.all([
          fetchNBATeamsProfilesBySeason(season),
          fetchNBATeamSeasonStatsBySeason(season),
        ]);

        gamesUpcoming = [];
        oneWeek = getOneWeek();
        for (const date of oneWeek) {
          const games = await fetchNBAGamesByDate(date);
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
          await upsertTotalTeamProfiles(updatedTeamsProfiles, "nba");
        }
        if (updatedTeamSeasonStats.length > 0) {
          await upsertTotalTeamSeasonStats(updatedTeamSeasonStats, "nba");
        }
        if (updatedGamesUpcoming.length > 0) {
          await upsertTotalGamesUpcoming(updatedGamesUpcoming, "nba");
        }

        previousGamesUpcoming = gamesUpcoming;
        previousTeamProfiles = teamProfiles;
        previousTeamSeasonStats = teamSeasonStats;
      }
    } catch (error) {
      console.error("Error polling NBA games:", error);
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

const fetchNBAGamesByDate = async (
  date: string
): Promise<SupabaseTotalGame[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/scores/json/GamesByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();

    const formattedData = data.map((game: any) => {
      const quarters = [
        ...(game.Quarters ?? []).map((quarter: any) => ({
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
        game_type: "nba",
        game_id: game.GameID,
        day: game.Day?.split("T")[0] ?? null,
        date_time: game.DateTime,
        status: game.Status,
        home_team_key: game.HomeTeam,
        home_team_score: game.HomeTeamScore ?? 0,
        away_team_key: game.AwayTeam,
        away_team_score: game.AwayTeamScore ?? 0,
        quarter: !!game.Quarter ? game.Quarter.toString().toUpperCase() : null,
        time_remaining_minutes: game.TimeRemainingMinutes,
        time_remaining_seconds: game.TimeRemainingSeconds,
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
        possession: null,
        down: null,
        distance: null,
      } as SupabaseTotalGame;
    });

    return formattedData;
  } catch (error) {
    console.error(`Error fetching NBA games by date ${date}:`, error);
    throw new Error(`Internal server error while fetching NBA games by date`);
  }
};

const fetchCurrentNBASeason = async (): Promise<string> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/scores/json/CurrentSeason?key=${apiKey}`
    );
    const data = await response.json();
    // ApiSeason includes the season type suffix (e.g., "2026POST", "2026REG")
    return data.ApiSeason;
  } catch (error) {
    console.error("Error fetching current NBA season:", error);
    throw new Error("Internal server error while fetching current NBA season");
  }
};

const fetchNBATeamsProfilesBySeason = async (
  season: string
): Promise<SupabaseTotalTeamProfile[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/scores/json/teams/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map(
      (team: any) =>
        ({
          game_type: "nba",
          team_key: team.Key,
          team_logo_url: team.WikipediaLogoUrl,
          team_primary_color: `#${team.PrimaryColor ?? "000000"}`,
        } as SupabaseTotalTeamProfile)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NBA teams profiles by season ${season}:`,
      error
    );
    throw new Error("Internal server error while fetching NBA teams profiles");
  }
};

const fetchNBATeamSeasonStatsBySeason = async (
  season: string
): Promise<SupabaseTotalTeamSeasonStat[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/scores/json/TeamSeasonStats/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData: SupabaseTotalTeamSeasonStat[] = data.map(
      (stat: any) =>
        ({
          game_type: "nba",
          team_key: stat.Team,
          team_wins: stat.Wins ?? 0,
          team_losses: stat.Losses ?? 0,
        } as SupabaseTotalTeamSeasonStat)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NBA team season stats by season ${season}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching NBA team season stats"
    );
  }
};

const fetchNBATeamGameStatsByDate = async (
  date: string
): Promise<{
  teamGameStatsMain: GameStats[];
  teamGameStatsFull: NBATeamGameStats[];
}> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/scores/json/TeamGameStatsByDate/${date}?key=${apiKey}`
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
    let teamGameStatsFull: NBATeamGameStats[] = [];

    data.forEach((stat: any) => {
      // For gameStats
      teamGameStatsMain.push({
        game_type: "nba",
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
        game_type: "nba",
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
    console.error(`Error fetching NBA team game stats by date ${date}:`, error);
    throw new Error("Internal server error while fetching NBA team game stats");
  }
};

const fetchNBAGameBettingSplitsByGameID = async (
  gameID: number
): Promise<BettingSplit> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/odds/json/BettingSplitsByGameId/${gameID}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = getBettingSplit(data, "nba", data.GameID);
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NBA game betting splits by game ID ${gameID}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching NBA game betting splits"
    );
  }
};

const fetchNBALiveGameOddsByDate = async (
  date: string
): Promise<LiveGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/odds/json/LiveGameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map((game: any) => ({
      game_type: "nba",
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
    console.error(`Error fetching NBA live game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching NBA live game odds");
  }
};

const fetchNBAPreGameOddsByDate = async (
  date: string
): Promise<PreGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nba/odds/json/GameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map(
      (game: any) =>
        ({
          game_type: "nba",
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
    console.error(`Error fetching NBA pre-game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching NBA pre-game odds");
  }
};

const removeOldNBAGamesFromTotalGames = async () => {
  try {
    await removeOldGames("general_games", "nba", getToday());
  } catch (error) {
    console.error("Error removing old NBA games from total games:", error);
    throw new Error("Internal server error while removing old NBA games");
  }
};

const removeOldNBAGamesFromTotalGamesUpcoming = async () => {
  try {
    await removeOldGames("general_games_upcoming", "nba", getToday());
  } catch (error) {
    console.error(
      "Error removing old NBA games from total games upcoming:",
      error
    );
    throw new Error(
      "Internal server error while removing old NBA games from upcoming"
    );
  }
};


const getDifferentTotalNBATeamGameStats = (
  curNBATeamGameStats: NBATeamGameStats[],
  preNBATeamGameStats: NBATeamGameStats[]
): NBATeamGameStats[] => {
  if (
    JSON.stringify(curNBATeamGameStats) === JSON.stringify(preNBATeamGameStats)
  ) {
    return [];
  }
  return curNBATeamGameStats
    .map((nbaTeamGameStat) => {
      const preNBATeamGameStat = preNBATeamGameStats.find(
        (s) =>
          s.game_type === nbaTeamGameStat.game_type &&
          s.team_key === nbaTeamGameStat.team_key
      );
      if (
        JSON.stringify(nbaTeamGameStat) !== JSON.stringify(preNBATeamGameStat)
      ) {
        return nbaTeamGameStat;
      }
      return null;
    })
    .filter((nbaTeamGameStat) => nbaTeamGameStat !== null);
};

const upsertTotalNBATeamGameStats = async (
  nbaTeamGameStats: NBATeamGameStats[]
) => {
  try {
    const now = new Date().toISOString();
    const dataToUpsert = nbaTeamGameStats.map((nbaTeamGameStat) => ({
      ...nbaTeamGameStat,
      updated_at: now,
    }));
    const { error } = await supabase
      .from("team_game_stats_nba")
      .upsert(dataToUpsert, {
        onConflict: "game_type, team_key, quarter",
      });
    if (error) {
      console.error(`Error upserting nba team game stats :`, error);
      throw new Error(
        `Internal server error while upserting nba team game stats`
      );
    }
    console.log(`log > upserted ${nbaTeamGameStats.length} nba team game stats`);
  } catch (error) {
    console.error(`Error upserting nba team game stats :`, error);
    throw new Error(
      `Internal server error while upserting nba team game stats`
    );
  }
};
