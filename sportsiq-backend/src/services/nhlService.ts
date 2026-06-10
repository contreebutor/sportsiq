import { config } from "../config";
import {
  BettingSplit,
  GameOdd,
  GameQuarter,
  GameStats,
  LiveGameOdd,
  NHLTeamGameStats,
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

export const startPollingNHLGames = async () => {
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
  let nhlTeamGameStats: NHLTeamGameStats[] = [];
  let previousNHLTeamGameStats: NHLTeamGameStats[] = [];

  while (true) {
    try {
      if (count % ONE_HOUR === 0) {
        today = getToday();
        await removeOldNHLGamesFromTotalGames();

        await removeCanceledGames("general_games");
        await removeCanceledGames("general_games_upcoming");
      }

      if (count % ONE_MINUTE === 0) {
        preGameOdds = await fetchNHLPreGameOddsByDate(today);
        const updatedPreGameOdds = getDifferentTotalPregameOdds(
          preGameOdds,
          previousPreGameOdds
        );
        if (updatedPreGameOdds.length > 0) {
          await upsertTotalPregameOdds(updatedPreGameOdds, "nhl");
        }
        previousPreGameOdds = preGameOdds;
      }

      if (count % 1 === 0) {
        games = await fetchNHLGamesByDate(today);

        games = setGameOverAtOfFinalGames(currentFinalGameIDs, games);

        const updatedGames = getDifferentTotalGames(games, previousGames);
        if (updatedGames.length > 0) {
          await upsertTotalGames(updatedGames, "nhl");
        }
        previousGames = games;

        liveGameOdds = await fetchNHLLiveGameOddsByDate(today);
        const updatedLiveGameOdds = getDifferentTotalLiveGameOdds(
          liveGameOdds,
          previousLiveGameOdds
        );
        if (updatedLiveGameOdds.length > 0) {
          await upsertTotalLiveGameOdds(updatedLiveGameOdds, "nhl");
        }
        previousLiveGameOdds = liveGameOdds;

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
          const periodInt = parseGameQuarterToInteger(quarter, "nhl") ?? 3;
          const remainingPeriods = Math.max(
            0,
            3 - (periodInt >= 4 ? 3 : periodInt)
          );
          const timeRemainingSeconds = getRemainingTimeSeconds(
            remainingPeriods,
            20,
            game!.time_remaining_minutes ?? 0,
            game!.time_remaining_seconds ?? 0
          );
          return getProbability(
            "nhl",
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
          await upsertProbabilities(updatedProbabilities, "nhl");
        }
        previousProbabilities = probabilities;

        const { teamGameStatsMain, teamGameStatsFull } =
          await fetchNHLTeamGameStatsByDate(today);
        const updatedTeamGameStats = getDifferentTotalTeamGameStats(
          teamGameStatsMain,
          previousTeamGameStats
        );
        if (updatedTeamGameStats.length > 0) {
          await upsertTotalTeamGameStats(updatedTeamGameStats, "nhl");
        }
        previousTeamGameStats = teamGameStatsMain;

        currentFinalGameIDs = getCurrentFinalGameIDs(games);

        nhlTeamGameStats = teamGameStatsFull
          .map((nhlTeamGameStat) => {
            const gameID = nhlTeamGameStat.game_id;
            const game = games.find(
              (game: SupabaseTotalGame) => game.game_id === gameID
            );
            const quarter = game!.quarter;
            if (quarter) {
              return {
                ...nhlTeamGameStat,
                period: quarter as GameQuarter,
              };
            }
            return null;
          })
          .filter((nhlTeamGameStat) => nhlTeamGameStat !== null);

        const updatedNHLTeamGameStats = getDifferentTotalNHLTeamGameStats(
          nhlTeamGameStats,
          previousNHLTeamGameStats
        );
        if (updatedNHLTeamGameStats.length > 0) {
          await upsertTotalNHLTeamGameStats(updatedNHLTeamGameStats);
        }
        previousNHLTeamGameStats = nhlTeamGameStats;
      }

      if (count % (ONE_MINUTE * 15) === 0) {
        const gameIDs: number[] = games.map(
          (game: SupabaseTotalGame) => game.game_id
        );
        bettingSplits = await Promise.all(
          gameIDs.map((gameID: number) =>
            fetchNHLGameBettingSplitsByGameID(gameID)
          )
        );
        const updatedBettingSplits = getDifferentTotalBettingSplits(
          bettingSplits,
          previousBettingSplits
        );
        if (updatedBettingSplits.length > 0) {
          await upsertTotalBettingSplits(updatedBettingSplits, "nhl");
        }
        previousBettingSplits = bettingSplits;
      }

      if (count === 0) {
        await removeOldNHLGamesFromTotalGamesUpcoming();
        season = await fetchCurrentNHLSeason();

        [teamProfiles, teamSeasonStats] = await Promise.all([
          fetchNHLTeamsProfilesBySeason(season),
          fetchNHLTeamSeasonStatsBySeason(season),
        ]);

        gamesUpcoming = [];
        oneWeek = getOneWeek();
        for (const date of oneWeek) {
          const gamesByDate = await fetchNHLGamesByDate(date);
          gamesUpcoming.push(...gamesByDate);
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
          await upsertTotalTeamProfiles(updatedTeamsProfiles, "nhl");
        }
        if (updatedTeamSeasonStats.length > 0) {
          await upsertTotalTeamSeasonStats(updatedTeamSeasonStats, "nhl");
        }
        if (updatedGamesUpcoming.length > 0) {
          await upsertTotalGamesUpcoming(updatedGamesUpcoming, "nhl");
        }

        previousGamesUpcoming = gamesUpcoming;
        previousTeamProfiles = teamProfiles;
        previousTeamSeasonStats = teamSeasonStats;
      }
    } catch (error) {
      console.error("Error polling NHL games:", error);
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

const fetchNHLGamesByDate = async (
  date: string
): Promise<SupabaseTotalGame[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/scores/json/GamesByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();

    const formattedData = data.map((game: any) => {
      const periods = game.Periods ?? [];
      const quarters = [
        // TODO: double-check this
        ...periods.map((period: any) => ({
          name: period.Name ?? "",
          home_team_score: period.HomeScore ?? 0,
          away_team_score: period.AwayScore ?? 0,
        })),
        {
          name: "full",
          home_team_score: game.HomeTeamScore ?? 0,
          away_team_score: game.AwayTeamScore ?? 0,
        },
      ];

      const periodToQuarter = (p: any): string | null => {
        if (p == null) return null;
        const s = p.toString().toUpperCase();
        if (s === "OT" || s === "1" || s === "2" || s === "3") return s;
        if (s === "F" || s === "FINAL") return "F";
        return s;
      };

      return {
        game_type: "nhl",
        game_id: game.GameID,
        day: game.Day?.split("T")[0] ?? null,
        date_time: game.DateTime,
        status: game.Status,
        home_team_key: game.HomeTeam,
        home_team_score: game.HomeTeamScore ?? 0,
        away_team_key: game.AwayTeam,
        away_team_score: game.AwayTeamScore ?? 0,
        quarter: periodToQuarter(game.Period),
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
        yard_line: null,
      } as SupabaseTotalGame;
    });

    return formattedData;
  } catch (error) {
    console.error(`Error fetching NHL games by date ${date}:`, error);
    throw new Error(`Internal server error while fetching NHL games by date`);
  }
};

const fetchCurrentNHLSeason = async (): Promise<string> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/scores/json/CurrentSeason?key=${apiKey}`
    );
    const data = await response.json();
    // ApiSeason includes the season type suffix (e.g., "2026POST", "2026REG")
    return data.ApiSeason;
  } catch (error) {
    console.error("Error fetching current NHL season:", error);
    throw new Error("Internal server error while fetching current NHL season");
  }
};

const fetchNHLTeamsProfilesBySeason = async (
  season: string
): Promise<SupabaseTotalTeamProfile[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/scores/json/teams/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = data.map(
      (team: any) =>
        ({
          game_type: "nhl",
          team_key: team.Key,
          team_logo_url: team.WikipediaLogoUrl,
          team_primary_color: `#${team.PrimaryColor ?? "000000"}`,
        } as SupabaseTotalTeamProfile)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NHL teams profiles by season ${season}:`,
      error
    );
    throw new Error("Internal server error while fetching NHL teams profiles");
  }
};

const fetchNHLTeamSeasonStatsBySeason = async (
  season: string
): Promise<SupabaseTotalTeamSeasonStat[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/scores/json/Standings/${season}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData: SupabaseTotalTeamSeasonStat[] = data.map(
      (standing: any) =>
        ({
          game_type: "nhl",
          team_key: standing.Team ?? standing.Key,
          team_wins: standing.Wins ?? 0,
          team_losses: standing.Losses ?? 0,
        } as SupabaseTotalTeamSeasonStat)
    );
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NHL team season stats by season ${season}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching NHL team season stats"
    );
  }
};

const fetchNHLTeamGameStatsByDate = async (
  date: string
): Promise<{
  teamGameStatsMain: GameStats[];
  teamGameStatsFull: NHLTeamGameStats[];
}> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/scores/json/TeamGameStatsByDate/${date}?key=${apiKey}`
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
    let teamGameStatsFull: NHLTeamGameStats[] = [];

    data.forEach((stat: any) => {
      // For gameStats
      teamGameStatsMain.push({
        game_type: "nhl",
        team_key: stat.Team,
        stat_one_title: "Goals",
        stat_one_value: getStateValue(stat.Goals) ?? "",
        stat_two_title: "Assists",
        stat_two_value: getStateValue(stat.Assists) ?? "",
        stat_three_title: "Shots",
        stat_three_value: getStateValue(stat.Shots) ?? "",
        stat_four_title: "Power Play Goals",
        stat_four_value: getStateValue(stat.PowerPlayGoals) ?? "",
        stat_five_title: "Penalty Minutes",
        stat_five_value: getStateValue(stat.PenaltyMinutes) ?? "",
        stat_six_title: "Hits",
        stat_six_value: getStateValue(stat.Hits) ?? "",
      });

      // For teamGameStats
      teamGameStatsFull.push({
        game_type: "nhl",
        team_key: stat.Team,
        game_id: stat.GameID,
        period: null as GameQuarter,
        goals: round(stat.Goals),
        assists: round(stat.Assists),
        shots_on_goal: round(stat.ShotsOnGoal),
        power_play_goals: round(stat.PowerPlayGoals),
        short_handed_goals: round(stat.ShortHandedGoals),
        empty_net_goals: round(stat.EmptyNetGoals),
        power_play_assists: round(stat.PowerPlayAssists),
        short_handed_assists: round(stat.ShortHandedAssists),
        hat_tricks: round(stat.HatTricks),
        shootout_goals: round(stat.ShootoutGoals),
        plus_minus: round(stat.PlusMinus),
        penalty_minutes: round(stat.PenaltyMinutes),
        blocks: round(stat.Blocks),
        hits: round(stat.Hits),
        takeaways: round(stat.Takeaways),
        giveaways: round(stat.Giveaways),
        faceoffs_won: round(stat.FaceoffsWon),
        faceoffs_lost: round(stat.FaceoffsLost),
        shifts: round(stat.Shifts),
        goaltending_shots_against: round(stat.GoaltendingShotsAgainst),
        goaltending_goals_against: round(stat.GoaltendingGoalsAgainst),
        goaltending_saves: round(stat.GoaltendingSaves),
        goaltending_shutouts: round(stat.GoaltendingShutouts),
        bench_penalty_minutes: round(stat.BenchPenaltyMinutes),
      });
    });

    return { teamGameStatsMain, teamGameStatsFull };
  } catch (error) {
    console.error(`Error fetching NHL team game stats by date ${date}:`, error);
    throw new Error("Internal server error while fetching NHL team game stats");
  }
};

const fetchNHLGameBettingSplitsByGameID = async (
  gameID: number
): Promise<BettingSplit> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/odds/json/BettingSplitsByGameId/${gameID}?key=${apiKey}`
    );
    const data = await response.json();
    const formattedData = getBettingSplit(data, "nhl", data.GameID ?? gameID);
    return formattedData;
  } catch (error) {
    console.error(
      `Error fetching NHL game betting splits by game ID ${gameID}:`,
      error
    );
    throw new Error(
      "Internal server error while fetching NHL game betting splits"
    );
  }
};

const fetchNHLLiveGameOddsByDate = async (
  date: string
): Promise<LiveGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/odds/json/LiveGameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map((game: any) => ({
      game_type: "nhl",
      game_id: game.GameId ?? game.GameID,
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
    console.error(`Error fetching NHL live game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching NHL live game odds");
  }
};

const fetchNHLPreGameOddsByDate = async (
  date: string
): Promise<PreGameOdd[]> => {
  try {
    const response = await fetch(
      `${apiUrl}/nhl/odds/json/GameOddsByDate/${date}?key=${apiKey}`
    );
    const data = await response.json();
    const filteredData = data.map(
      (game: any) =>
        ({
          game_type: "nhl",
          game_id: game.GameId ?? game.GameID,
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
    console.error(`Error fetching NHL pre-game odds by date ${date}:`, error);
    throw new Error("Internal server error while fetching NHL pre-game odds");
  }
};

const removeOldNHLGamesFromTotalGames = async () => {
  try {
    await removeOldGames("general_games", "nhl", getToday());
  } catch (error) {
    console.error("Error removing old NHL games from total games:", error);
    throw new Error("Internal server error while removing old NHL games");
  }
};

const removeOldNHLGamesFromTotalGamesUpcoming = async () => {
  try {
    await removeOldGames("general_games_upcoming", "nhl", getToday());
  } catch (error) {
    console.error(
      "Error removing old NHL games from total games upcoming:",
      error
    );
    throw new Error(
      "Internal server error while removing old NHL games from upcoming"
    );
  }
};


const getDifferentTotalNHLTeamGameStats = (
  curNHLTeamGameStats: NHLTeamGameStats[],
  preNHLTeamGameStats: NHLTeamGameStats[]
): NHLTeamGameStats[] => {
  if (
    JSON.stringify(curNHLTeamGameStats) === JSON.stringify(preNHLTeamGameStats)
  ) {
    return [];
  }
  return curNHLTeamGameStats
    .map((nhlTeamGameStat) => {
      const preNHLTeamGameStat = preNHLTeamGameStats.find(
        (s) =>
          s.game_type === nhlTeamGameStat.game_type &&
          s.team_key === nhlTeamGameStat.team_key &&
          s.period === nhlTeamGameStat.period
      );
      if (
        JSON.stringify(nhlTeamGameStat) !== JSON.stringify(preNHLTeamGameStat)
      ) {
        return nhlTeamGameStat;
      }
      return null;
    })
    .filter((nhlTeamGameStat) => nhlTeamGameStat !== null);
};

const upsertTotalNHLTeamGameStats = async (
  nhlTeamGameStats: NHLTeamGameStats[]
) => {
  try {
    const now = new Date().toISOString();
    const dataToUpsert = nhlTeamGameStats.map((nhlTeamGameStat) => ({
      ...nhlTeamGameStat,
      updated_at: now,
    }));
    const { error } = await supabase
      .from("team_game_stats_nhl")
      .upsert(dataToUpsert, {
        onConflict: "game_type, team_key, period",
      });
    if (error) {
      console.error(`Error upserting nhl team game stats :`, error);
      throw new Error(
        `Internal server error while upserting nhl team game stats`
      );
    }
    console.log(`log > upserted ${nhlTeamGameStats.length} team game stats`)
  } catch (error) {
    console.error(`Error upserting nhl team game stats :`, error);
    throw new Error(
      `Internal server error while upserting nhl team game stats`
    );
  }
};
