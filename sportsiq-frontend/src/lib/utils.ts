import { DateTime } from "luxon";
import {
  HighlightedOdd,
  HighlightedOdds,
  SportsbookCardProps,
} from "../types/general";
import { VSProgressBarCardProps } from "../components/Dashboard/VSProgressBarCard";
import { Quarter } from "../types/contests";
import {
  BottomCardProps,
  FinalGame,
  Game,
  GameOdd,
  LiveGame,
  PreGame,
  SupabaseGame,
} from "../types/general";
import { sportsbooksIcons } from "../data/data";
import { SubBettingCardProps } from "../components/Dashboard/Common/General/MainCards/SubBettingCard";

export const convertSupabaseGameToGame = (game: SupabaseGame): Game => {
  const getRemainingSeconds = (timeString: string): number => {
    if (!timeString) return 0;
    const [minutes, seconds] = timeString.split(":");
    return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
  };

  const getStatValueString = (value: string): string => {
    if (value === null) return null;
    return value + (game.game_type === "nba" ? "%" : "");
  };

  const homeTeamStatOnePercentage = convertValueToPercentage(
    Number(game.home_team_stat_one_value),
    Number(game.away_team_stat_one_value)
  );
  const homeTeamStatTwoPercentage = convertValueToPercentage(
    Number(game.home_team_stat_two_value),
    Number(game.away_team_stat_two_value)
  );
  const homeTeamStatThreePercentage = convertValueToPercentage(
    Number(game.home_team_stat_three_value),
    Number(game.away_team_stat_three_value)
  );
  const homeTeamStatFourPercentage = convertValueToPercentage(
    Number(game.home_team_stat_four_value),
    Number(game.away_team_stat_four_value)
  );
  const homeTeamStatFivePercentage = convertValueToPercentage(
    Number(game.home_team_stat_five_value),
    Number(game.away_team_stat_five_value)
  );
  const homeTeamStatSixPercentage = convertValueToPercentage(
    Number(
      game.game_type === "nfl"
        ? getRemainingSeconds(game.home_team_stat_six_value)
        : game.home_team_stat_six_value
    ),
    Number(
      game.game_type === "nfl"
        ? getRemainingSeconds(game.away_team_stat_six_value)
        : game.away_team_stat_six_value
    )
  );
  const awayTeamStatOnePercentage = convertValueToPercentage(
    Number(game.away_team_stat_one_value),
    Number(game.home_team_stat_one_value)
  );
  const awayTeamStatTwoPercentage = convertValueToPercentage(
    Number(game.away_team_stat_two_value),
    Number(game.home_team_stat_two_value)
  );
  const awayTeamStatThreePercentage = convertValueToPercentage(
    Number(game.away_team_stat_three_value),
    Number(game.home_team_stat_three_value)
  );
  const awayTeamStatFourPercentage = convertValueToPercentage(
    Number(game.away_team_stat_four_value),
    Number(game.home_team_stat_four_value)
  );
  const awayTeamStatFivePercentage = convertValueToPercentage(
    Number(game.away_team_stat_five_value),
    Number(game.home_team_stat_five_value)
  );
  const awayTeamStatSixPercentage = convertValueToPercentage(
    Number(
      game.game_type === "nfl"
        ? getRemainingSeconds(game.away_team_stat_six_value)
        : game.away_team_stat_six_value
    ),
    Number(
      game.game_type === "nfl"
        ? getRemainingSeconds(game.home_team_stat_six_value)
        : game.home_team_stat_six_value
    )
  );
  const homeTeamStatFiveValue = getStatValueString(
    game.home_team_stat_five_value
  );
  const awayTeamStatFiveValue = getStatValueString(
    game.away_team_stat_five_value
  );
  const homeTeamStatSixValue = getStatValueString(
    game.home_team_stat_six_value
  );
  const awayTeamStatSixValue = getStatValueString(
    game.away_team_stat_six_value
  );
  return {
    ...game,
    home_team_stat_five_value: homeTeamStatFiveValue,
    away_team_stat_five_value: awayTeamStatFiveValue,
    home_team_stat_six_value: homeTeamStatSixValue,
    away_team_stat_six_value: awayTeamStatSixValue,
    home_team_stat_one_percentage: homeTeamStatOnePercentage,
    home_team_stat_two_percentage: homeTeamStatTwoPercentage,
    home_team_stat_three_percentage: homeTeamStatThreePercentage,
    home_team_stat_four_percentage: homeTeamStatFourPercentage,
    home_team_stat_five_percentage: homeTeamStatFivePercentage,
    home_team_stat_six_percentage: homeTeamStatSixPercentage,
    away_team_stat_one_percentage: awayTeamStatOnePercentage,
    away_team_stat_two_percentage: awayTeamStatTwoPercentage,
    away_team_stat_three_percentage: awayTeamStatThreePercentage,
    away_team_stat_four_percentage: awayTeamStatFourPercentage,
    away_team_stat_five_percentage: awayTeamStatFivePercentage,
    away_team_stat_six_percentage: awayTeamStatSixPercentage,
  };
};

export const convertGameToPreGame = (game: Game): PreGame => ({
  game_uuid: game.game_uuid,
  game_type: game.game_type,
  game_id: game.game_id,
  day: game.day,
  date_time: game.date_time,
  status: game.status,

  home_team_key: game.home_team_key,
  home_team_score: game.home_team_score,
  home_team_logo_url: game.home_team_logo_url,
  home_team_primary_color: game.home_team_primary_color,
  home_team_wins: game.home_team_wins,
  home_team_losses: game.home_team_losses,

  away_team_key: game.away_team_key,
  away_team_score: game.away_team_score,
  away_team_logo_url: game.away_team_logo_url,
  away_team_primary_color: game.away_team_primary_color,
  away_team_wins: game.away_team_wins,
  away_team_losses: game.away_team_losses,

  home_moneyline: game.home_moneyline,
  away_moneyline: game.away_moneyline,
  point_spread: game.point_spread,
  point_spread_home_moneyline: game.point_spread_home_moneyline,
  point_spread_away_moneyline: game.point_spread_away_moneyline,
  over_under: game.over_under,
  over_payout: game.over_payout,
  under_payout: game.under_payout,

  pre_game_odds: game.pre_game_odds,

  home_bet_moneyline: game.home_bet_moneyline,
  home_bet_spread: game.home_bet_spread,
  home_bet_total: game.home_bet_total,
  home_money_moneyline: game.home_money_moneyline,
  home_money_spread: game.home_money_spread,
  home_money_total: game.home_money_total,

  away_bet_moneyline: game.away_bet_moneyline,
  away_bet_spread: game.away_bet_spread,
  away_bet_total: game.away_bet_total,
  away_money_moneyline: game.away_money_moneyline,
  away_money_spread: game.away_money_spread,
  away_money_total: game.away_money_total,
});

export const convertGameToLiveGame = (game: Game): LiveGame => ({
  game_uuid: game.game_uuid,
  game_type: game.game_type,
  game_id: game.game_id,
  day: game.day,
  date_time: game.date_time,
  status: game.status,

  home_team_key: game.home_team_key,
  home_team_score: game.home_team_score,
  home_team_logo_url: game.home_team_logo_url,
  home_team_primary_color: game.home_team_primary_color,
  home_team_wins: game.home_team_wins,
  home_team_losses: game.home_team_losses,

  away_team_key: game.away_team_key,
  away_team_score: game.away_team_score,
  away_team_logo_url: game.away_team_logo_url,
  away_team_primary_color: game.away_team_primary_color,
  away_team_wins: game.away_team_wins,
  away_team_losses: game.away_team_losses,
  quarter: game.quarter,
  time_remaining_minutes: game.time_remaining_minutes,
  time_remaining_seconds: game.time_remaining_seconds,

  possession: game.possession,
  down: game.down,
  distance: game.distance,
  yard_line: game.yard_line,
  home_moneyline: game.home_moneyline,
  away_moneyline: game.away_moneyline,
  point_spread: game.point_spread,
  point_spread_home_moneyline: game.point_spread_home_moneyline,
  point_spread_away_moneyline: game.point_spread_away_moneyline,
  over_under: game.over_under,
  over_payout: game.over_payout,
  under_payout: game.under_payout,

  pre_game_odds: game.pre_game_odds,
  live_game_odds: game.live_game_odds,

  home_win_probability: game.home_win_probability,
  home_cover_probability: game.home_cover_probability,
  home_total_probability: game.home_total_probability,
  away_win_probability: game.away_win_probability,
  away_cover_probability: game.away_cover_probability,
  away_total_probability: game.away_total_probability,

  stat_one_title: game.stat_one_title,
  stat_two_title: game.stat_two_title,
  stat_three_title: game.stat_three_title,
  stat_four_title: game.stat_four_title,
  stat_five_title: game.stat_five_title,
  stat_six_title: game.stat_six_title,

  home_team_stat_one_value: game.home_team_stat_one_value,
  home_team_stat_two_value: game.home_team_stat_two_value,
  home_team_stat_three_value: game.home_team_stat_three_value,
  home_team_stat_four_value: game.home_team_stat_four_value,
  home_team_stat_five_value: game.home_team_stat_five_value,
  home_team_stat_six_value: game.home_team_stat_six_value,

  away_team_stat_one_value: game.away_team_stat_one_value,
  away_team_stat_two_value: game.away_team_stat_two_value,
  away_team_stat_three_value: game.away_team_stat_three_value,
  away_team_stat_four_value: game.away_team_stat_four_value,
  away_team_stat_five_value: game.away_team_stat_five_value,
  away_team_stat_six_value: game.away_team_stat_six_value,

  home_team_stat_one_percentage: game.home_team_stat_one_percentage,
  home_team_stat_two_percentage: game.home_team_stat_two_percentage,
  home_team_stat_three_percentage: game.home_team_stat_three_percentage,
  home_team_stat_four_percentage: game.home_team_stat_four_percentage,
  home_team_stat_five_percentage: game.home_team_stat_five_percentage,
  home_team_stat_six_percentage: game.home_team_stat_six_percentage,

  away_team_stat_one_percentage: game.away_team_stat_one_percentage,
  away_team_stat_two_percentage: game.away_team_stat_two_percentage,
  away_team_stat_three_percentage: game.away_team_stat_three_percentage,
  away_team_stat_four_percentage: game.away_team_stat_four_percentage,
  away_team_stat_five_percentage: game.away_team_stat_five_percentage,
  away_team_stat_six_percentage: game.away_team_stat_six_percentage,
});

export const convertGameToFinalGame = (game: Game): FinalGame => ({
  game_uuid: game.game_uuid,
  game_type: game.game_type,
  game_id: game.game_id,
  day: game.day,
  date_time: game.date_time,
  status: game.status,

  home_team_key: game.home_team_key,
  home_team_score: game.home_team_score,
  home_team_logo_url: game.home_team_logo_url,
  home_team_primary_color: game.home_team_primary_color,
  home_team_wins: game.home_team_wins,
  home_team_losses: game.home_team_losses,

  away_team_key: game.away_team_key,
  away_team_score: game.away_team_score,
  away_team_logo_url: game.away_team_logo_url,
  away_team_primary_color: game.away_team_primary_color,
  away_team_wins: game.away_team_wins,
  away_team_losses: game.away_team_losses,
  game_over_at: game.game_over_at,

  pre_game_odds: game.pre_game_odds,

  stat_one_title: game.stat_one_title,
  stat_two_title: game.stat_two_title,
  stat_three_title: game.stat_three_title,
  stat_four_title: game.stat_four_title,
  stat_five_title: game.stat_five_title,
  stat_six_title: game.stat_six_title,

  home_team_stat_one_value: game.home_team_stat_one_value,
  home_team_stat_two_value: game.home_team_stat_two_value,
  home_team_stat_three_value: game.home_team_stat_three_value,
  home_team_stat_four_value: game.home_team_stat_four_value,
  home_team_stat_five_value: game.home_team_stat_five_value,
  home_team_stat_six_value: game.home_team_stat_six_value,

  away_team_stat_one_value: game.away_team_stat_one_value,
  away_team_stat_two_value: game.away_team_stat_two_value,
  away_team_stat_three_value: game.away_team_stat_three_value,
  away_team_stat_four_value: game.away_team_stat_four_value,
  away_team_stat_five_value: game.away_team_stat_five_value,
  away_team_stat_six_value: game.away_team_stat_six_value,

  home_team_stat_one_percentage: game.home_team_stat_one_percentage,
  home_team_stat_two_percentage: game.home_team_stat_two_percentage,
  home_team_stat_three_percentage: game.home_team_stat_three_percentage,
  home_team_stat_four_percentage: game.home_team_stat_four_percentage,
  home_team_stat_five_percentage: game.home_team_stat_five_percentage,
  home_team_stat_six_percentage: game.home_team_stat_six_percentage,

  away_team_stat_one_percentage: game.away_team_stat_one_percentage,
  away_team_stat_two_percentage: game.away_team_stat_two_percentage,
  away_team_stat_three_percentage: game.away_team_stat_three_percentage,
  away_team_stat_four_percentage: game.away_team_stat_four_percentage,
  away_team_stat_five_percentage: game.away_team_stat_five_percentage,
  away_team_stat_six_percentage: game.away_team_stat_six_percentage,
});

export const convertPreGamesToScoreboards = (
  preGames: PreGame[]
): BottomCardProps[] =>
  preGames.map((preGame: PreGame) => {
    const date = new Date(
      convertToClientTimezone(preGame.date_time ?? preGame.day)
    );
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const day = date
      .toLocaleDateString([], {
        weekday: "long",
      })
      .slice(0, 3);

    let title = "";
    if (isToday) {
      title = time;
    } else {
      title = `${time} · ${day}`;
    }

    const highlightedOdds = getHighlightedOdds(preGame.pre_game_odds);

    const getFirstOdd = (odds: HighlightedOdd[]) =>
      odds.length > 0 ? [odds[0]] : [];

    return {
      status: "Scheduled",
      title: title,

      home_team_key: preGame.home_team_key,
      home_team_primary_color: preGame.home_team_primary_color,
      home_team_logo_url: preGame.home_team_logo_url,
      home_team_score: preGame.home_team_score,
      away_team_key: preGame.away_team_key,
      away_team_primary_color: preGame.away_team_primary_color,
      away_team_logo_url: preGame.away_team_logo_url,
      away_team_score: preGame.away_team_score,

      moneyline: {
        home: getFirstOdd(highlightedOdds.moneyline.home),
        away: getFirstOdd(highlightedOdds.moneyline.away),
      },
      spread: {
        home: getFirstOdd(highlightedOdds.spread.home),
        away: getFirstOdd(highlightedOdds.spread.away),
      },
      total: {
        home: getFirstOdd(highlightedOdds.total.home),
        away: getFirstOdd(highlightedOdds.total.away),
      },
    } as BottomCardProps;
  });

export const convertLiveGamesToScoreboards = (
  liveGames: LiveGame[]
): BottomCardProps[] =>
  liveGames.map((liveGame: LiveGame) => {
    let title: string = "";

    const {
      quarter,
      time_remaining_minutes,
      time_remaining_seconds,
      game_type,
    } = liveGame;

    if (quarter.toUpperCase() === "HALF") {
      title = "HALFTIME";
    } else if (quarter === "OT") {
      title = "OVERTIME";
    } else if (quarter === "F") {
      title = "FINAL";
    } else if (quarter === "F/OT") {
      title = "F/OT";
    } else {
      const timeString = `${time_remaining_minutes ?? 0}:${String(
        time_remaining_seconds ?? 0
      ).padStart(2, "0")}`;
      if (game_type === "cbb") {
        if (quarter === "1") {
          title = "1ST";
        } else if (quarter === "2") {
          title = "2ND";
        }
        title += ` HALF · ${timeString}`;
      } else if (game_type === "mlb") {
        const inningNum = parseInt(quarter);
        const suffix =
          inningNum === 1 ? "ST" : inningNum === 2 ? "ND" : inningNum === 3 ? "RD" : "TH";
        title = `${inningNum}${suffix} INN`;
      } else {
        title = `Q${quarter} · ${timeString}`;
      }
    }

    const highlightedOdds = getHighlightedOdds(liveGame.live_game_odds);
    const getFirstOdd = (odds: HighlightedOdd[]) =>
      odds.length > 0 ? [odds[0]] : [];

    return {
      status: liveGame.status,
      title: title,

      home_team_key: liveGame.home_team_key,
      home_team_primary_color: liveGame.home_team_primary_color,
      home_team_logo_url: liveGame.home_team_logo_url,
      home_team_score: liveGame.home_team_score,
      away_team_key: liveGame.away_team_key,
      away_team_primary_color: liveGame.away_team_primary_color,
      away_team_logo_url: liveGame.away_team_logo_url,
      away_team_score: liveGame.away_team_score,

      moneyline: {
        home: getFirstOdd(highlightedOdds.moneyline.home),
        away: getFirstOdd(highlightedOdds.moneyline.away),
      },
      spread: {
        home: getFirstOdd(highlightedOdds.spread.home),
        away: getFirstOdd(highlightedOdds.spread.away),
      },
      total: {
        home: getFirstOdd(highlightedOdds.total.home),
        away: getFirstOdd(highlightedOdds.total.away),
      },
    } as BottomCardProps;
  });

export const convertFinalGamesToScoreboards = (
  finalGames: FinalGame[]
): BottomCardProps[] =>
  finalGames.map((finalGame: FinalGame) => {
    const title: string = finalGame.status.toUpperCase();

    const highlightedOdds = getHighlightedOdds(finalGame.pre_game_odds);
    const getFirstOdd = (odds: HighlightedOdd[]) =>
      odds.length > 0 ? [odds[0]] : [];

    return {
      status: finalGame.status,
      title: title,

      home_team_key: finalGame.home_team_key,
      home_team_primary_color: finalGame.home_team_primary_color,
      home_team_logo_url: finalGame.home_team_logo_url,
      home_team_score: finalGame.home_team_score,
      away_team_key: finalGame.away_team_key,
      away_team_primary_color: finalGame.away_team_primary_color,
      away_team_logo_url: finalGame.away_team_logo_url,
      away_team_score: finalGame.away_team_score,

      moneyline: {
        home: getFirstOdd(highlightedOdds.moneyline.home),
        away: getFirstOdd(highlightedOdds.moneyline.away),
      },
      spread: {
        home: getFirstOdd(highlightedOdds.spread.home),
        away: getFirstOdd(highlightedOdds.spread.away),
      },
      total: {
        home: getFirstOdd(highlightedOdds.total.home),
        away: getFirstOdd(highlightedOdds.total.away),
      },
    } as BottomCardProps;
  });

export const getStatsDataFromGame = (
  game: LiveGame | FinalGame
): VSProgressBarCardProps[] => [
  {
    title: game.stat_one_title,
    homeValue: game.home_team_stat_one_value,
    awayValue: game.away_team_stat_one_value,
    homePercent: game.home_team_stat_one_percentage,
    awayPercent: game.away_team_stat_one_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
  {
    title: game.stat_two_title,
    homeValue: game.home_team_stat_two_value,
    awayValue: game.away_team_stat_two_value,
    homePercent: game.home_team_stat_two_percentage,
    awayPercent: game.away_team_stat_two_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
  {
    title: game.stat_three_title,
    homeValue: game.home_team_stat_three_value,
    awayValue: game.away_team_stat_three_value,
    homePercent: game.home_team_stat_three_percentage,
    awayPercent: game.away_team_stat_three_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
  {
    title: game.stat_four_title,
    homeValue: game.home_team_stat_four_value,
    awayValue: game.away_team_stat_four_value,
    homePercent: game.home_team_stat_four_percentage,
    awayPercent: game.away_team_stat_four_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
  {
    title: game.stat_five_title,
    homeValue: game.home_team_stat_five_value,
    awayValue: game.away_team_stat_five_value,
    homePercent: game.home_team_stat_five_percentage,
    awayPercent: game.away_team_stat_five_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
  {
    title: game.stat_six_title,
    homeValue: game.home_team_stat_six_value,
    awayValue: game.away_team_stat_six_value,
    homePercent: game.home_team_stat_six_percentage,
    awayPercent: game.away_team_stat_six_percentage,
    homeColor: game.home_team_primary_color,
    awayColor: game.away_team_primary_color,
    titleWidth: "w-40",
  },
];

export const quarterText = (quarter: Quarter): string => {
  if (quarter === "1") return "1ST QUARTER";
  if (quarter === "2") return "2ND QUARTER";
  if (quarter === "3") return "3RD QUARTER";
  if (quarter === "4") return "4TH QUARTER";
  if (quarter === "full") return "FULL GAME";
};

export const convertValueToPercentage = (
  mainValue: number,
  additionalValue: number
) => {
  if (mainValue + additionalValue === 0) return 0;
  return Math.round((mainValue / (mainValue + additionalValue)) * 100);
};

// Utility: Determine if a color is "light" based on luminance.
// Accepts hex color string, returns true if color is light.
const isColorLight = (color: string): boolean => {
  // Remove hash if present
  const sanitized = color.replace(/^#/, "");
  // Expand shorthand form (e.g. "abc") to full form (e.g. "aabbcc")
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((x) => x + x)
          .join("")
      : sanitized;
  // Parse r,g,b values
  const num = parseInt(fullHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Calculate luminance
  // formula: https://www.w3.org/TR/AERT/#color-contrast
  const luminance = (299 * r + 587 * g + 114 * b) / 1000;
  return luminance > 180; // threshold (180 is quite light, 128 is midpoint)
};

export const getContrastColor = (bgColor: string): string => {
  return isColorLight(bgColor) ? "#222222" : bgColor;
};

export const getReversedColor = (bgColor: string): string => {
  return isColorLight(bgColor) ? "#222222" : "#ffffff";
};

export const convertToClientTimezone = (dateTimeEST: string): string => {
  // Parse the input as EST (Eastern Time)
  const estTime = DateTime.fromISO(dateTimeEST, { zone: "America/New_York" });

  // Detect client timezone
  const clientZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Convert to client timezone
  const clientTime = estTime.setZone(clientZone);

  // Return in same format
  return clientTime.toFormat("yyyy-MM-dd'T'HH:mm:ss");
};

// ----- New version ----- //
export const getExactGamesToDisplay = (
  newFinalGames: FinalGame[],
  liveGames: LiveGame[],
  preGames: PreGame[],
  oldFinalGames: FinalGame[],
  cardCount: number
) => {
  const newFinalGamesToDisplay = newFinalGames.slice(0, cardCount);
  const availableCardCountForLiveGames = Math.max(
    0,
    cardCount - newFinalGamesToDisplay.length
  );
  const liveGamesToDisplay = liveGames.slice(0, availableCardCountForLiveGames);
  const availableCardCountForPreGames = Math.max(
    0,
    cardCount - (newFinalGamesToDisplay.length + liveGamesToDisplay.length)
  );
  const preGamesToDisplay = preGames.slice(0, availableCardCountForPreGames);
  const availableCardCountForOldFinalGames = Math.max(
    0,
    cardCount -
      (newFinalGamesToDisplay.length +
        liveGamesToDisplay.length +
        preGamesToDisplay.length)
  );
  const oldFinalGamesToDisplay = oldFinalGames.slice(
    0,
    availableCardCountForOldFinalGames
  );

  return {
    newFinalGames: newFinalGamesToDisplay,
    liveGames: liveGamesToDisplay,
    preGames: preGamesToDisplay,
    oldFinalGames: oldFinalGamesToDisplay,
  };
};

export const getHighlightedOdds = (odds: GameOdd[]): HighlightedOdds => {
  let homeMoneyline: HighlightedOdd[] = [];
  let awayMoneyline: HighlightedOdd[] = [];
  let homeSpread: HighlightedOdd[] = [];
  let awaySpread: HighlightedOdd[] = [];
  let homeTotal: HighlightedOdd[] = [];
  let awayTotal: HighlightedOdd[] = [];

  let maxHomeMoneyline: number = -Infinity;
  let maxAwayMoneyline: number = -Infinity;
  let maxHomeSpread: number = -Infinity;
  let maxAwaySpread: number = -Infinity;
  let maxHomeSpreadPayout: number = -Infinity;
  let maxAwaySpreadPayout: number = -Infinity;
  let minHomeOverUnder: number = -Infinity;
  let minHomeOverPayout: number = -Infinity;
  let maxAwayOverUnder: number = -Infinity;
  let maxAwayUnderPayout: number = -Infinity;

  odds.forEach((odd: GameOdd) => {
    // Home Moneyline
    if (odd.home_moneyline) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: getStringFromValue(odd.home_moneyline),
      };

      if (odd.home_moneyline > maxHomeMoneyline) {
        maxHomeMoneyline = odd.home_moneyline;
        homeMoneyline = [newOdd];
      } else if (odd.home_moneyline === maxHomeMoneyline) {
        homeMoneyline.push(newOdd);
      }
    }

    // Away Moneyline
    if (odd.away_moneyline) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: getStringFromValue(odd.away_moneyline),
      };

      if (odd.away_moneyline > maxAwayMoneyline) {
        maxAwayMoneyline = odd.away_moneyline;
        awayMoneyline = [newOdd];
      } else if (odd.away_moneyline === maxAwayMoneyline) {
        awayMoneyline.push(newOdd);
      }
    }

    // Home Spread
    if (odd.home_point_spread) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: getStringFromValue(odd.home_point_spread),
        additionalValue: getStringFromValue(odd.home_point_spread_payout),
      };

      if (odd.home_point_spread > maxHomeSpread) {
        maxHomeSpread = odd.home_point_spread;
        maxHomeSpreadPayout = odd.home_point_spread_payout || -Infinity;
        homeSpread = [newOdd];
      } else if (odd.home_point_spread === maxHomeSpread) {
        if ((odd.home_point_spread_payout || -Infinity) > maxHomeSpreadPayout) {
          maxHomeSpreadPayout = odd.home_point_spread_payout;
          homeSpread = [newOdd];
        } else if (
          (odd.home_point_spread_payout || -Infinity) === maxHomeSpreadPayout
        ) {
          homeSpread.push(newOdd);
        }
      }
    }

    // Away Spread
    if (odd.away_point_spread) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: getStringFromValue(odd.away_point_spread),
        additionalValue: getStringFromValue(odd.away_point_spread_payout),
      };

      if (odd.away_point_spread > maxAwaySpread) {
        maxAwaySpread = odd.away_point_spread;
        maxAwaySpreadPayout = odd.away_point_spread_payout || -Infinity;
        awaySpread = [newOdd];
      } else if (odd.away_point_spread === maxAwaySpread) {
        if ((odd.away_point_spread_payout || -Infinity) > maxAwaySpreadPayout) {
          maxAwaySpreadPayout = odd.away_point_spread_payout;
          awaySpread = [newOdd];
        } else if (
          (odd.away_point_spread_payout || -Infinity) === maxAwaySpreadPayout
        ) {
          awaySpread.push(newOdd);
        }
      }
    }

    // Home Total
    if (odd.over_under) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: odd.over_under.toString(),
        additionalValue: getStringFromValue(odd.over_payout),
      };

      if (Math.abs(odd.over_under) < Math.abs(minHomeOverUnder)) {
        minHomeOverUnder = odd.over_under;
        minHomeOverPayout = odd.over_payout || -Infinity;
        homeTotal = [newOdd];
      } else if (Math.abs(odd.over_under) === Math.abs(minHomeOverUnder)) {
        if (
          Math.abs(odd.over_payout || Infinity) < Math.abs(minHomeOverPayout)
        ) {
          minHomeOverPayout = odd.over_payout;
          homeTotal = [newOdd];
        } else if ((odd.over_payout || -Infinity) === minHomeOverPayout) {
          homeTotal.push(newOdd);
        }
      }
    }

    // Away Total
    if (odd.over_under) {
      const newOdd: HighlightedOdd = {
        sportsbook: odd.sportsbook,
        logoURL: sportsbooksIcons[odd.sportsbook].logo_url_symbol,
        value: odd.over_under.toString(),
        additionalValue: getStringFromValue(odd.under_payout),
      };

      if (odd.over_under > maxAwayOverUnder) {
        maxAwayOverUnder = odd.over_under;
        maxAwayUnderPayout = odd.under_payout || -Infinity;
        awayTotal = [newOdd];
      } else if (odd.over_under === maxAwayOverUnder) {
        if ((odd.under_payout || -Infinity) > maxAwayUnderPayout) {
          maxAwayUnderPayout = odd.under_payout;
          awayTotal = [newOdd];
        } else if ((odd.under_payout || Infinity) === maxAwayUnderPayout) {
          awayTotal.push(newOdd);
        }
      }
    }
  });

  return {
    moneyline: {
      home: homeMoneyline,
      away: awayMoneyline,
    },
    spread: {
      home: homeSpread,
      away: awaySpread,
    },
    total: {
      home: homeTotal,
      away: awayTotal,
    },
  };
};

const getStringFromValue = (value: number | null): string => {
  if (value === null) return "";

  return (value > 0 ? "+" : "") + value.toString();
};

const getPercent = (
  mainValue: number | null,
  additionalValue: number | null
) => {
  if (mainValue === null || additionalValue === null) return 0;
  if (mainValue === 0 && additionalValue === 0) return 0;
  return (mainValue / (mainValue + additionalValue)) * 100;
};

export const getSportsbookDataFromPreGame = (
  pregame: PreGame
): SportsbookCardProps[] => {
  const highlightedOdds: HighlightedOdds = getHighlightedOdds(
    pregame.pre_game_odds
  );

  return (
    pregame.pre_game_odds?.map(
      (odd: GameOdd) =>
        ({
          logo: sportsbooksIcons[odd.sportsbook].logo_url_full,
          name: odd.sportsbook,
          homeTeam: pregame.home_team_key,
          awayTeam: pregame.away_team_key,
          homeColor: pregame.home_team_primary_color,
          awayColor: pregame.away_team_primary_color,
          homeMoneyline: getStringFromValue(odd.home_moneyline),
          awayMoneyline: getStringFromValue(odd.away_moneyline),
          homePointSpread: getStringFromValue(odd.home_point_spread),
          awayPointSpread: getStringFromValue(odd.away_point_spread),
          homePointSpreadPayout: getStringFromValue(
            odd.home_point_spread_payout
          ),
          awayPointSpreadPayout: getStringFromValue(
            odd.away_point_spread_payout
          ),
          overUnder: (odd.over_under || "").toString(),
          overPayout: getStringFromValue(odd.over_payout),
          underPayout: getStringFromValue(odd.under_payout),

          isHomeMoneylineHighlighted: highlightedOdds.moneyline.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isAwayMoneylineHighlighted: highlightedOdds.moneyline.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isHomePointSpreadHighlighted: highlightedOdds.spread.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isAwayPointSpreadHighlighted: highlightedOdds.spread.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isOverPayoutHighlighted: highlightedOdds.total.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isUnderPayoutHighlighted: highlightedOdds.total.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
        } as SportsbookCardProps)
    ) || []
  );
};

export const getBettingDataFromPreGame = (
  pregame: PreGame,
  isTitleLarge: boolean
): SubBettingCardProps[] => {
  const homeTeamColor = pregame.home_team_primary_color;
  const awayTeamColor = pregame.away_team_primary_color;

  const homeBetMoneyline = pregame.home_bet_moneyline || 50;
  const awayBetMoneyline = pregame.away_bet_moneyline || 50;
  const homeBetSpread = pregame.home_bet_spread || 50;
  const awayBetSpread = pregame.away_bet_spread || 50;
  const homeBetTotal = pregame.home_bet_total || 50;
  const awayBetTotal = pregame.away_bet_total || 50;
  const homeMoneyMoneyline = pregame.home_money_moneyline || 50;
  const awayMoneyMoneyline = pregame.away_money_moneyline || 50;
  const homeMoneySpread = pregame.home_money_spread || 50;
  const awayMoneySpread = pregame.away_money_spread || 50;
  const homeMoneyTotal = pregame.home_money_total || 50;
  const awayMoneyTotal = pregame.away_money_total || 50;

  const titleWidth = isTitleLarge ? "w-20" : "w-16";
  const homeBetMoneylinePercent = getPercent(
    homeBetMoneyline,
    awayBetMoneyline
  );
  const awayBetMoneylinePercent = getPercent(
    awayBetMoneyline,
    homeBetMoneyline
  );
  const homeMoneyMoneylinePercent = getPercent(
    homeMoneyMoneyline,
    awayMoneyMoneyline
  );
  const awayMoneyMoneylinePercent = getPercent(
    awayMoneyMoneyline,
    homeMoneyMoneyline
  );
  const homeBetSpreadPercent = getPercent(homeBetSpread, awayBetSpread);
  const awayBetSpreadPercent = getPercent(awayBetSpread, homeBetSpread);
  const homeMoneySpreadPercent = getPercent(homeMoneySpread, awayMoneySpread);
  const awayMoneySpreadPercent = getPercent(awayMoneySpread, homeMoneySpread);
  const homeBetTotalPercent = getPercent(homeBetTotal, awayBetTotal);
  const awayBetTotalPercent = getPercent(awayBetTotal, homeBetTotal);
  const homeMoneyTotalPercent = getPercent(homeMoneyTotal, awayMoneyTotal);
  const awayMoneyTotalPercent = getPercent(awayMoneyTotal, homeMoneyTotal);

  const addPercentString = (value: number | null) => {
    if (value === null) return "";
    return value.toString() + "%";
  };

  return [
    {
      title: "Moneyline",
      homeValue: getStringFromValue(pregame.home_moneyline),
      awayValue: getStringFromValue(pregame.away_moneyline),
      data: [
        {
          title: "Bets",
          homeValue: addPercentString(homeBetMoneyline),
          awayValue: addPercentString(awayBetMoneyline),
          homePercent: homeBetMoneylinePercent,
          awayPercent: awayBetMoneylinePercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
        {
          title: "Money",
          homeValue: addPercentString(homeMoneyMoneyline),
          awayValue: addPercentString(awayMoneyMoneyline),
          homePercent: homeMoneyMoneylinePercent,
          awayPercent: awayMoneyMoneylinePercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
      ] as VSProgressBarCardProps[],
    },
    {
      title: "Spread",
      homeValue: getStringFromValue(pregame.point_spread),
      awayValue: getStringFromValue(-pregame.point_spread),
      homeValueAdditional: getStringFromValue(
        pregame.point_spread_away_moneyline
      ),
      awayValueAdditional: getStringFromValue(
        pregame.point_spread_home_moneyline
      ),
      data: [
        {
          title: "Bets",
          homeValue: addPercentString(homeBetSpread),
          awayValue: addPercentString(awayBetSpread),
          homePercent: homeBetSpreadPercent,
          awayPercent: awayBetSpreadPercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
        {
          title: "Money",
          homeValue: addPercentString(homeMoneySpread),
          awayValue: addPercentString(awayMoneySpread),
          homePercent: homeMoneySpreadPercent,
          awayPercent: awayMoneySpreadPercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
      ] as VSProgressBarCardProps[],
    },
    {
      title: "Total",
      homeValue: `O ${pregame.over_under}`,
      awayValue: `U ${pregame.over_under}`,
      homeValueAdditional: getStringFromValue(pregame.over_payout),
      awayValueAdditional: getStringFromValue(pregame.under_payout),
      data: [
        {
          title: "Bets",
          homeValue: addPercentString(homeBetTotal),
          awayValue: addPercentString(awayBetTotal),
          homePercent: homeBetTotalPercent,
          awayPercent: awayBetTotalPercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
        {
          title: "Money",
          homeValue: addPercentString(homeMoneyTotal),
          awayValue: addPercentString(awayMoneyTotal),
          homePercent: homeMoneyTotalPercent,
          awayPercent: awayMoneyTotalPercent,
          homeColor: homeTeamColor,
          awayColor: awayTeamColor,
          titleWidth: titleWidth,
        },
      ] as VSProgressBarCardProps[],
    },
  ];
};

export const getSportsbookDataFromLiveGame = (
  liveGame: LiveGame
): SportsbookCardProps[] => {
  const highlightedOdds: HighlightedOdds = getHighlightedOdds(
    liveGame.live_game_odds
  );

  return (
    liveGame.live_game_odds?.map(
      (odd: GameOdd) =>
        ({
          logo: sportsbooksIcons[odd.sportsbook].logo_url_full,
          name: odd.sportsbook,
          homeTeam: liveGame.home_team_key,
          awayTeam: liveGame.away_team_key,
          homeColor: liveGame.home_team_primary_color,
          awayColor: liveGame.away_team_primary_color,
          homeMoneyline: getStringFromValue(odd.home_moneyline),
          awayMoneyline: getStringFromValue(odd.away_moneyline),
          homePointSpread: getStringFromValue(odd.home_point_spread),
          awayPointSpread: getStringFromValue(odd.away_point_spread),
          homePointSpreadPayout: getStringFromValue(
            odd.home_point_spread_payout
          ),
          awayPointSpreadPayout: getStringFromValue(
            odd.away_point_spread_payout
          ),
          overUnder: odd.over_under?.toString() || "",
          overPayout: getStringFromValue(odd.over_payout),
          underPayout: getStringFromValue(odd.under_payout),

          isHomeMoneylineHighlighted: highlightedOdds.moneyline.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isAwayMoneylineHighlighted: highlightedOdds.moneyline.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isHomePointSpreadHighlighted: highlightedOdds.spread.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isAwayPointSpreadHighlighted: highlightedOdds.spread.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isOverPayoutHighlighted: highlightedOdds.total.home
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
          isUnderPayoutHighlighted: highlightedOdds.total.away
            .map((highlightedOdd) => highlightedOdd.sportsbook)
            .includes(odd.sportsbook),
        } as SportsbookCardProps)
    ) || []
  );
};

export const getProbabilityDataFromLiveGame = (
  liveGame: LiveGame
): SubBettingCardProps[] => {
  return [
    {
      title: "Moneyline",
      homeValue: getStringFromValue(liveGame.home_moneyline),
      awayValue: getStringFromValue(liveGame.away_moneyline),
      data: [
        {
          title: "Probability",
          homeValue: Math.round(liveGame.home_win_probability).toString() + "%",
          awayValue: Math.round(liveGame.away_win_probability).toString() + "%",
          homePercent: liveGame.home_win_probability,
          awayPercent: liveGame.away_win_probability,
          homeColor: liveGame.home_team_primary_color,
          awayColor: liveGame.away_team_primary_color,
          titleWidth: "w-28",
        },
      ],
    },
    {
      title: "Spread",
      homeValue: getStringFromValue(liveGame.point_spread),
      awayValue: getStringFromValue(-liveGame.point_spread),
      homeValueAdditional: `(${getStringFromValue(
        liveGame.point_spread_home_moneyline
      )})`,
      awayValueAdditional: `(${getStringFromValue(
        liveGame.point_spread_away_moneyline
      )})`,
      data: [
        {
          title: "Probability",
          homeValue:
            Math.round(liveGame.home_cover_probability).toString() + "%",
          awayValue:
            Math.round(liveGame.away_cover_probability).toString() + "%",
          homePercent: liveGame.home_cover_probability,
          awayPercent: liveGame.away_cover_probability,
          homeColor: liveGame.home_team_primary_color,
          awayColor: liveGame.away_team_primary_color,
          titleWidth: "w-28",
        },
      ],
    },
    {
      title: "Total",
      homeValue: `O ${liveGame.over_under}`,
      awayValue: `U ${liveGame.over_under}`,
      homeValueAdditional: `(${getStringFromValue(liveGame.over_payout)})`,
      awayValueAdditional: `(${getStringFromValue(liveGame.under_payout)})`,
      data: [
        {
          title: "Probability",
          homeValue:
            Math.round(liveGame.home_total_probability).toString() + "%",
          awayValue:
            Math.round(liveGame.away_total_probability).toString() + "%",
          homePercent: liveGame.home_total_probability,
          awayPercent: liveGame.away_total_probability,
          homeColor: liveGame.home_team_primary_color,
          awayColor: liveGame.away_team_primary_color,
          titleWidth: "w-28",
        },
      ],
    },
  ];
};

const getEndOfDay = (): number => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
};

export const storeContestUserID = (
  pageID: string,
  contestUserID: string
): void => {
  const expiry = getEndOfDay();
  const data = {
    contestUserID,
    expiry,
  };
  localStorage.setItem(pageID, JSON.stringify(data));
};

export const getStoredContestUserID = (pageID: string): string | null => {
  try {
    const stored = localStorage.getItem(pageID);
    if (!stored) return null;

    const data = JSON.parse(stored);
    const now = Date.now();

    // Check if expired
    if (now > data.expiry) {
      localStorage.removeItem(pageID);
      return null;
    }

    return data.contestUserID;
  } catch {
    // If there's an error parsing, remove the invalid data
    localStorage.removeItem(pageID);
    return null;
  }
};
