import { config } from "../config";
import {
  BettingSplit,
  GameOdd,
  GameQuarter,
  GameStats,
  LiveGameOdd,
  MLBTeamGameStats,
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

export const startPollingMLBGames = async () => {
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
  let mlbTeamGameStats: MLBTeamGameStats[] = [];
  let previousMLBTeamGameStats: MLBTeamGameStats[] = [];

  while (true) {
    try {
      if (count % ONE_HOUR === 0) {
        /// Get today
        today = getToday();
        await removeOldMLBGamesFromTotalGames();

        /// remove all canceled games whatever the game type is
        await removeCanceledGames("general_games");
        await removeCanceledGames("general_games_upcoming");
      }

      if (count % ONE_MINUTE === 0) {
        /// pre game odds
        preGameOdds = await fetchMLBPreGameOddsByDate(today);
        const updatedPreGameOdds = getDifferentTotalPregameOdds(
          preGameOdds,
          previousPreGameOdds
        );
        if (updatedPreGameOdds.length > 0) {
          await upsertTotalPregameOdds(updatedPreGameOdds, "mlb");
        }
        previousPreGameOdds = preGameOdds;
      }

      if (count % 1 === 0) {
        /// games
        games = await fetchMLBGamesByDate(today);

        /// set `game_over_at` field of final games
        games = setGameOverAtOfFinalGames(currentFinalGameIDs, games);

        const updatedGames = getDifferentTotalGames(games, previousGames);
        if (updatedGames.length > 0) {
          await upsertTotalGames(updatedGames, "mlb");
        }
        previousGames = games;

        /// live game odds
        liveGameOdds = await fetchMLBLiveGameOddsByDate(today);
        const updatedLiveGameOdds = getDifferentTotalLiveGameOdds(
          liveGameOdds,
          previousLiveGameOdds
        );
        if (updatedLiveGameOdds.length > 0) {
          await upsertTotalLiveGameOdds(updatedLiveGameOdds, "mlb");
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
          // MLB has 9 innings; estimate remaining time based on innings left
          const currentInning = parseGameQuarterToInteger(quarter, "mlb") ?? 9;
          const inningsLeft = 9 - currentInning;
          // Approximate ~20 minutes per inning for time remaining estimation
          const timeRemainingSeconds = inningsLeft * 20 * 60;
          return getProbability(
            "mlb",
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
          await upsertProbabilities(updatedProbabilities, "mlb");
        }
        previousProbabilities = probabilities;

        /// team game stats
        const { teamGameStatsMain, teamGameStatsFull } =
          await fetchMLBTeamGameStatsByDate(today);
        const updatedTeamGameStats = getDifferentTotalTeamGameStats(
          teamGameStatsMain,
          previousTeamGameStats
        );
        if (updatedTeamGameStats.length > 0) {
          await upsertTotalTeamGameStats(updatedTeamGameStats, "mlb");
        }
        previousTeamGameStats = teamGameStatsMain;

        /// clean up currentFinalGameIDs
        currentFinalGameIDs = getCurrentFinalGameIDs(games);

        /// add inning to mlbTeamGameStats
        mlbTeamGameStats = teamGameStatsFull
          .map((mlbTeamGameStat) => {
            const gameID = mlbTeamGameStat.game_id;
            const game = games.find(
              (game: SupabaseTotalGame) => game.game_id === gameID
            );
            const quarter = game!.quarter;
            if (quarter) {
              return {
                ...mlbTeamGameStat,
                inning: quarter as GameQuarter,
              };
            }
            return null;
          })
          .filter((mlbTeamGameStat) => mlbTeamGameStat !== null);

        const updatedMLBTeamGameStats = getDifferentTotalMLBTeamGameStats(
          mlbTeamGameStats,
          previousMLBTeamGameStats
        );
        if (updatedMLBTeamGameStats.length > 0) {
          await upsertTotalMLBTeamGameStats(updatedMLBTeamGameStats);
        }
        previousMLBTeamGameStats = mlbTeamGameStats;
      }

      if (count % (ONE_MINUTE * 15) === 0) {
        /// betting splits
        const gameIDs: number[] = games.map(
          (game: SupabaseTotalGame) => game.game_id
        );
        bettingSplits = await Promise.all(
          gameIDs.map((gameID: number) =>
            fetchMLBGameBettingSplitsByGameID(gameID)
          )
        );
        const updatedBettingSplits = getDifferentTotalBettingSplits(
          bettingSplits,
          previousBettingSplits
        );
        if (updatedBettingSplits.length > 0) {
          await upsertTotalBettingSplits(updatedBettingSplits, "mlb");
        }
        previousBettingSplits = bettingSplits;
      }

      if (count === 0) {
        season = await fetchCurrentMLBSeason();

        /// team profiles and team season stats
        [teamProfiles, teamSeasonStats] = await Promise.all([
          fetchMLBTeamsProfilesBySeason(season),
          fetchMLBTeamSeasonStatsBySeason(season),
        ]);

        gamesUpcoming = [];
        oneWeek = getOneWeek();
        for (const date of oneWeek) {
          const games = await fetchMLBGamesByDate(date);
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
          await upsertTotalTeamProfiles(updatedTeamsProfiles, "mlb");
        }
        if (updatedTeamSeasonStats.length > 0) {
          await upsertTotalTeamSeasonStats(updatedTeamSeasonStats, "mlb");
        }
        if (updatedGamesUpcoming.length > 0) {
          await upsertTotalGamesUpcoming(updatedGamesUpcoming, "mlb");
        }

        previousGamesUpcoming = gamesUpcoming;
        previousTeamProfiles = teamProfiles;
        previousTeamSeasonStats = teamSeasonStats;
      }
    } catch (error) {
      console.error("Error polling MLB games:", error);
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

const fetchMLBGamesByDate = async (
  date: string
): Promise<SupabaseTotalGame[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/scores/json/GamesByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();

    const formattedData = data.map((game: any) => {
      const innings = [
        ...(game.Innings ?? []).map((inning: any) => ({
          name: inning.InningNumber?.toString() ?? "",
          home_team_score: inning.HomeTeamRuns ?? 0,
          away_team_score: inning.AwayTeamRuns ?? 0,
        })),
        {
          name: "full",
          home_team_score: game.HomeTeamRuns ?? 0,
          away_team_score: game.AwayTeamRuns ?? 0,
        },
      ];

      return {
        game_type: "mlb",
        game_id: game.GameID,
        day: game.Day?.split("T")[0] ?? null,
        date_time: game.DateTime,
        status: game.Status,
        home_team_key: game.HomeTeam,
        home_team_score: game.HomeTeamRuns ?? 0,
        away_team_key: game.AwayTeam,
        away_team_score: game.AwayTeamRuns ?? 0,
        quarter: !!game.Inning
          ? game.Inning.toString().toUpperCase()
          : null,
        time_remaining_minutes: null,
        time_remaining_seconds: null,
        home_moneyline: game.HomeTeamMoneyLine,
        away_moneyline: game.AwayTeamMoneyLine,
        point_spread: game.PointSpread,
        point_spread_home_moneyline: game.PointSpreadHomeTeamMoneyLine,
        point_spread_away_moneyline: game.PointSpreadAwayTeamMoneyLine,
        over_under: game.OverUnder,
        over_payout: game.OverPayout,
        under_payout: game.UnderPayout,
        quarters: innings,
        game_over_at: null,
        possession: null,
        down: null,
        distance: null,
        yard_line: null,
      } as SupabaseTotalGame;
    });

    return formattedData;
  } catch (error) {
    console.error(`Error fetching MLB games by date ${date}:`, error);
    throw new Error(`Internal server error while fetching MLB games by date`);
  }
};

const fetchCurrentMLBSeason = async (): Promise<string> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/scores/json/CurrentSeason?key=${apiKey}`
    );
    const data = await response.json();
    // ApiSeason includes the season type suffix (e.g., "2026POST", "2026REG")
    return data.ApiSeason;
  } catch (error) {
    console.error("Error fetching current MLB season:", error);
    throw new Error("Internal server error while fetching current MLB season");
  }
};

const fetchMLBTeamsProfilesBySeason = async (
  season: string
): Promise<SupabaseTotalTeamProfile[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/scores/json/teams/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map(
      (team: any) =>
        ({
          game_type: "mlb",
          team_key: team.Key,
          team_logo_url: team.WikipediaLogoUrl,
          team_primary_color: `#${team.PrimaryColor ?? "000000"}`,
        } as SupabaseTotalTeamProfile)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching MLB teams profiles by season ${season}:`,
      error
    );
    throw new Error("Internal server error while fetching MLB teams profiles");
  }
};

const fetchMLBTeamSeasonStatsBySeason = async (
  season: string
): Promise<SupabaseTotalTeamSeasonStat[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/scores/json/TeamSeasonStats/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData: SupabaseTotalTeamSeasonStat[] = data.map(
      (stat: any) =>
        ({
          game_type: "mlb",
          team_key: stat.Team,
          team_wins: stat.Wins ?? 0,
          team_losses: stat.Losses ?? 0,
        } as SupabaseTotalTeamSeasonStat)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching MLB team season stats by season ${season}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching MLB team season stats"
    );
  }
};

const fetchMLBTeamGameStatsByDate = async (
  date: string
): Promise<{
  teamGameStatsMain: GameStats[];
  teamGameStatsFull: MLBTeamGameStats[];
}> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/scores/json/TeamGameStatsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const round = (value: number | null) => {
      return Math.round(value ?? 0);
    };
    const toFixed = (value: number | null, decimals: number = 3) => {
      return (value ?? 0).toFixed(decimals);
    };
    let teamGameStatsMain: GameStats[] = [];
    let teamGameStatsFull: MLBTeamGameStats[] = [];

    data.forEach((stat: any) => {
      teamGameStatsMain.push({
        game_type: "mlb",
        team_key: stat.Team,
        stat_one_title: "Hits",
        stat_one_value: round(stat.Hits).toString(),
        stat_two_title: "Runs",
        stat_two_value: round(stat.Runs).toString(),
        stat_three_title: "HRs",
        stat_three_value: round(stat.HomeRuns).toString(),
        stat_four_title: "Errors",
        stat_four_value: round(stat.Errors).toString(),
        stat_five_title: "AVG",
        stat_five_value: toFixed(stat.BattingAverage),
        stat_six_title: "ERA",
        stat_six_value: toFixed(stat.EarnedRunAverage, 2),
      });

      teamGameStatsFull.push({
        game_type: "mlb",
        team_key: stat.Team,
        game_id: stat.GameID,
        inning: null,
        at_bats: round(stat.AtBats),
        runs: round(stat.Runs),
        hits: round(stat.Hits),
        singles: round(stat.Singles),
        doubles: round(stat.Doubles),
        triples: round(stat.Triples),
        home_runs: round(stat.HomeRuns),
        rbi: round(stat.RunsBattedIn),
        batting_average: stat.BattingAverage ?? 0,
        outs: round(stat.Outs),
        strikeouts: round(stat.Strikeouts),
        walks: round(stat.Walks),
        hit_by_pitch: round(stat.HitByPitch),
        sacrifices: round(stat.Sacrifices),
        sacrifice_flies: round(stat.SacrificeFlies),
        ground_into_double_play: round(stat.GroundIntoDoublePlay),
        stolen_bases: round(stat.StolenBases),
        caught_stealing: round(stat.CaughtStealing),
        on_base_percentage: stat.OnBasePercentage ?? 0,
        slugging_percentage: stat.SluggingPercentage ?? 0,
        on_base_plus_slugging: stat.OnBasePlusSlugging ?? 0,
        errors: round(stat.Errors),
        pitching_hits: round(stat.PitchingHits),
        pitching_runs: round(stat.PitchingRuns),
        pitching_earned_runs: round(stat.PitchingEarnedRuns),
        pitching_walks: round(stat.PitchingWalks),
        pitching_strikeouts: round(stat.PitchingStrikeouts),
        pitching_home_runs: round(stat.PitchingHomeRuns),
        pitching_earned_run_average: stat.EarnedRunAverage ?? 0,
        innings_pitched_decimal: stat.InningsPitchedDecimal ?? 0,
        pitches_thrown: round(stat.PitchesThrown),
        pitches_thrown_strikes: round(stat.PitchesThrownStrikes),
        walks_hits_per_innings_pitched: stat.WalksHitsPerInningsPitched ?? 0,
        pitching_batting_average_against: stat.PitchingBattingAverageAgainst ?? 0,
        pitching_complete_games: round(stat.PitchingCompleteGames),
        pitching_shut_outs: round(stat.PitchingShutOuts),
        pitching_no_hitters: round(stat.PitchingNoHitters),
        double_plays: round(stat.DoublePlays),
        left_on_base: round(stat.LeftOnBase),
      });
    });

    return { teamGameStatsMain, teamGameStatsFull };
  } catch (error) {
    console.error(`Error fetching MLB team game stats by date ${date}:`, error);
    throw new Error("Internal server error while fetching MLB team game stats");
  }
};

const fetchMLBGameBettingSplitsByGameID = async (
  gameID: number
): Promise<BettingSplit> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/odds/json/BettingSplitsByGameId/${gameID}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = getBettingSplit(data, "mlb", data.GameID);
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching MLB game betting splits by game ID ${gameID}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching MLB game betting splits"
    );
  }
};

const fetchMLBLiveGameOddsByDate = async (
  date: string
): Promise<LiveGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/odds/json/LiveGameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map((game: any) => ({
      game_type: "mlb",
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
    console.error(`Error fetching MLB live game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching MLB live game odds");
  }
};

const fetchMLBPreGameOddsByDate = async (
  date: string
): Promise<PreGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/mlb/odds/json/GameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map(
      (game: any) =>
        ({
          game_type: "mlb",
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
    console.error(`Error fetching MLB pre-game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching MLB pre-game odds");
  }
};

const removeOldMLBGamesFromTotalGames = async () => {
  try {
    await removeOldGames("general_games", "mlb", getToday());
  } catch (error) {
    console.error("Error removing old MLB games from total games:", error);
    throw new Error("Internal server error while removing old MLB games");
  }
};

const getDifferentTotalMLBTeamGameStats = (
  curMLBTeamGameStats: MLBTeamGameStats[],
  preMLBTeamGameStats: MLBTeamGameStats[]
): MLBTeamGameStats[] => {
  if (
    JSON.stringify(curMLBTeamGameStats) === JSON.stringify(preMLBTeamGameStats)
  ) {
    return [];
  }
  return curMLBTeamGameStats
    .map((mlbTeamGameStat) => {
      const preMLBTeamGameStat = preMLBTeamGameStats.find(
        (s) =>
          s.game_type === mlbTeamGameStat.game_type &&
          s.team_key === mlbTeamGameStat.team_key
      );
      if (
        JSON.stringify(mlbTeamGameStat) !== JSON.stringify(preMLBTeamGameStat)
      ) {
        return mlbTeamGameStat;
      }
      return null;
    })
    .filter((mlbTeamGameStat) => mlbTeamGameStat !== null);
};

const upsertTotalMLBTeamGameStats = async (
  mlbTeamGameStats: MLBTeamGameStats[]
) => {
  try {
    const now = new Date().toISOString();
    const dataToUpsert = mlbTeamGameStats.map((mlbTeamGameStat) => ({
      ...mlbTeamGameStat,
      updated_at: now,
    }));
    const { error } = await supabase
      .from("team_game_stats_mlb")
      .upsert(dataToUpsert, {
        onConflict: "game_type, team_key, inning",
      });
    if (error) {
      console.error(`Error upserting mlb team game stats :`, error);
      throw new Error(
        `Internal server error while upserting mlb team game stats`
      );
    }
    console.log(`log > upserted ${mlbTeamGameStats.length} mlb team game stats`);
  } catch (error) {
    console.error(`Error upserting mlb team game stats :`, error);
    throw new Error(
      `Internal server error while upserting mlb team game stats`
    );
  }
};
