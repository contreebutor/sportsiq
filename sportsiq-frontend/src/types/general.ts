export type MainCardsLayoutColumnsCount = 2 | 3 | 4;
export type ContestType = "predictor" | "bingo";
export type GameStatus = "Scheduled" | "InProgress" | "Final" | "F/OT";
export type GameQuarter =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "HALF"
  | "OT"
  | "F"
  | "F/OT"
  | null;

export interface Quarter {
  name: string;
  home_team_score: number;
  away_team_score: number;
}

export type GameType = "nba" | "nfl" | "nhl" | "cbb" | "mlb";

export interface SupabaseGame {
  game_uuid: string;
  game_type: GameType;
  game_id: number;
  day: string;
  date_time: string;
  status: GameStatus;

  home_team_key: string;
  home_team_score: number;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;

  away_team_key: string;
  away_team_score: number;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;

  quarter: GameQuarter;
  time_remaining_minutes: number | null;
  time_remaining_seconds: number | null;

  home_moneyline: number | null;
  away_moneyline: number | null;
  point_spread: number | null;
  point_spread_home_moneyline: number | null;
  point_spread_away_moneyline: number | null;
  over_under: number | null;
  over_payout: number | null;
  under_payout: number | null;
  quarters: Quarter[];
  game_over_at: string | null;

  /// The below fields are only available for NFL games
  possession: string | null; // The team that has the ball
  down: number | null; // The down number
  distance: string | null; // The distance to the first down
  yard_line: number | null; // The yard line of the ball

  pre_game_odds: GameOdd[];
  live_game_odds: GameOdd[];

  home_bet_moneyline: number | null;
  home_bet_spread: number | null;
  home_bet_total: number | null;
  home_money_moneyline: number | null;
  home_money_spread: number | null;
  home_money_total: number | null;

  away_bet_moneyline: number | null;
  away_bet_spread: number | null;
  away_bet_total: number | null;
  away_money_moneyline: number | null;
  away_money_spread: number | null;
  away_money_total: number | null;

  home_win_probability: number | null;
  home_cover_probability: number | null;
  home_total_probability: number | null;
  away_win_probability: number | null;
  away_cover_probability: number | null;
  away_total_probability: number | null;

  stat_one_title: string;
  stat_two_title: string;
  stat_three_title: string;
  stat_four_title: string;
  stat_five_title: string;
  stat_six_title: string;

  home_team_stat_one_value: string;
  home_team_stat_two_value: string;
  home_team_stat_three_value: string;
  home_team_stat_four_value: string;
  home_team_stat_five_value: string;
  home_team_stat_six_value: string;

  away_team_stat_one_value: string;
  away_team_stat_two_value: string;
  away_team_stat_three_value: string;
  away_team_stat_four_value: string;
  away_team_stat_five_value: string;
  away_team_stat_six_value: string;
}

export interface Game extends SupabaseGame {
  home_team_stat_one_percentage: number;
  home_team_stat_two_percentage: number;
  home_team_stat_three_percentage: number;
  home_team_stat_four_percentage: number;
  home_team_stat_five_percentage: number;
  home_team_stat_six_percentage: number;

  away_team_stat_one_percentage: number;
  away_team_stat_two_percentage: number;
  away_team_stat_three_percentage: number;
  away_team_stat_four_percentage: number;
  away_team_stat_five_percentage: number;
  away_team_stat_six_percentage: number;
}

export interface GameOdd {
  sportsbook: string;
  home_moneyline: number | null;
  away_moneyline: number | null;
  home_point_spread: number | null;
  away_point_spread: number | null;
  home_point_spread_payout: number | null;
  away_point_spread_payout: number | null;
  over_under: number | null;
  over_payout: number | null;
  under_payout: number | null;
}

export interface PreGame {
  game_uuid: string;
  game_type: GameType;
  game_id: number;
  day: string;
  date_time: string;
  status: GameStatus;

  home_team_key: string;
  home_team_score: number;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;

  away_team_key: string;
  away_team_score: number;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;

  home_moneyline: number | null;
  away_moneyline: number | null;
  point_spread: number | null;
  point_spread_home_moneyline: number | null;
  point_spread_away_moneyline: number | null;
  over_under: number | null;
  over_payout: number | null;
  under_payout: number | null;

  pre_game_odds: GameOdd[];

  home_bet_moneyline: number | null;
  home_bet_spread: number | null;
  home_bet_total: number | null;
  home_money_moneyline: number | null;
  home_money_spread: number | null;
  home_money_total: number | null;

  away_bet_moneyline: number | null;
  away_bet_spread: number | null;
  away_bet_total: number | null;
  away_money_moneyline: number | null;
  away_money_spread: number | null;
  away_money_total: number | null;
}

export interface LiveGame {
  game_uuid: string;
  game_type: GameType;
  game_id: number;
  day: string;
  date_time: string;
  status: GameStatus;

  home_team_key: string;
  home_team_score: number;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;

  away_team_key: string;
  away_team_score: number;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;

  quarter: GameQuarter;
  time_remaining_minutes: number | null;
  time_remaining_seconds: number | null;

  possession: string | null;
  down: number | null;
  distance: string | null;
  yard_line: number | null;

  home_moneyline: number | null;
  away_moneyline: number | null;
  point_spread: number | null;
  point_spread_home_moneyline: number | null;
  point_spread_away_moneyline: number | null;
  over_under: number | null;
  over_payout: number | null;
  under_payout: number | null;

  pre_game_odds: GameOdd[];
  live_game_odds: GameOdd[];

  home_win_probability: number | null;
  home_cover_probability: number | null;
  home_total_probability: number | null;
  away_win_probability: number | null;
  away_cover_probability: number | null;
  away_total_probability: number | null;

  stat_one_title: string;
  stat_two_title: string;
  stat_three_title: string;
  stat_four_title: string;
  stat_five_title: string;
  stat_six_title: string;

  home_team_stat_one_value: string;
  home_team_stat_two_value: string;
  home_team_stat_three_value: string;
  home_team_stat_four_value: string;
  home_team_stat_five_value: string;
  home_team_stat_six_value: string;

  away_team_stat_one_value: string;
  away_team_stat_two_value: string;
  away_team_stat_three_value: string;
  away_team_stat_four_value: string;
  away_team_stat_five_value: string;
  away_team_stat_six_value: string;

  home_team_stat_one_percentage: number;
  home_team_stat_two_percentage: number;
  home_team_stat_three_percentage: number;
  home_team_stat_four_percentage: number;
  home_team_stat_five_percentage: number;
  home_team_stat_six_percentage: number;

  away_team_stat_one_percentage: number;
  away_team_stat_two_percentage: number;
  away_team_stat_three_percentage: number;
  away_team_stat_four_percentage: number;
  away_team_stat_five_percentage: number;
  away_team_stat_six_percentage: number;
}

export interface FinalGame {
  game_uuid: string;
  game_type: GameType;
  game_id: number;
  day: string;
  date_time: string;
  status: GameStatus;

  home_team_key: string;
  home_team_score: number;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;

  away_team_key: string;
  away_team_score: number;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;

  game_over_at: string | null;

  pre_game_odds: GameOdd[];

  stat_one_title: string;
  stat_two_title: string;
  stat_three_title: string;
  stat_four_title: string;
  stat_five_title: string;
  stat_six_title: string;

  home_team_stat_one_value: string;
  home_team_stat_two_value: string;
  home_team_stat_three_value: string;
  home_team_stat_four_value: string;
  home_team_stat_five_value: string;
  home_team_stat_six_value: string;

  away_team_stat_one_value: string;
  away_team_stat_two_value: string;
  away_team_stat_three_value: string;
  away_team_stat_four_value: string;
  away_team_stat_five_value: string;
  away_team_stat_six_value: string;

  home_team_stat_one_percentage: number;
  home_team_stat_two_percentage: number;
  home_team_stat_three_percentage: number;
  home_team_stat_four_percentage: number;
  home_team_stat_five_percentage: number;
  home_team_stat_six_percentage: number;

  away_team_stat_one_percentage: number;
  away_team_stat_two_percentage: number;
  away_team_stat_three_percentage: number;
  away_team_stat_four_percentage: number;
  away_team_stat_five_percentage: number;
  away_team_stat_six_percentage: number;
}

export interface ContestForToday {
  abstract_contest_id: string;
  contest_type: ContestType;
  game_uuid: string;
  game_status: GameStatus;
  date_time: string;
}

export interface DashboardSettings {
  profile_id: string;
  dashboard_game_types: GameType[];
  dashboard_card_count: number;
  interval_dashboard_rotation_time: number;
  interval_card_rotation_time: number;
  contest_enabled: boolean;
  contest_dashboard_type: number;
}

export interface UserProfile {
  id: string;
  isAdmin: boolean;
  username: string;
  notes: string;
  dashboardGameTypes: GameType[];
  dashboardCardCount: number;
  intervalDashboardRotationTime: number;
  intervalCardRotationTime: number;
  contestEnabled: boolean;
  contestDashboardType: number;
}

export interface HighlightedOdd {
  sportsbook: string;
  logoURL: string;
  value: string;
  additionalValue?: string;
}

export interface HighlightedOdds {
  moneyline: {
    home: HighlightedOdd[];
    away: HighlightedOdd[];
  };
  spread: {
    home: HighlightedOdd[];
    away: HighlightedOdd[];
  };
  total: {
    home: HighlightedOdd[];
    away: HighlightedOdd[];
  };
}

export interface BottomCardProps extends HighlightedOdds {
  status: GameStatus;
  title: string;

  home_team_key: string;
  home_team_primary_color: string;
  home_team_logo_url: string;
  home_team_score: number;
  away_team_key: string;
  away_team_primary_color: string;
  away_team_logo_url: string;
  away_team_score: number;
}

export interface SportsbookCardProps {
  logo: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
  homeMoneyline?: string;
  awayMoneyline?: string;
  homePointSpread?: string;
  awayPointSpread?: string;
  homePointSpreadPayout?: string;
  awayPointSpreadPayout?: string;
  overUnder?: string;
  overPayout?: string;
  underPayout?: string;

  isHomeMoneylineHighlighted?: boolean;
  isAwayMoneylineHighlighted?: boolean;
  isHomePointSpreadHighlighted?: boolean;
  isAwayPointSpreadHighlighted?: boolean;
  isOverPayoutHighlighted?: boolean;
  isUnderPayoutHighlighted?: boolean;
}

interface SportsGameForCard {
  game_uuid: string;
  game_type: GameType;
  day: string;
  date_time: string;
  home_team_key: string;
  home_team_wins: number;
  home_team_losses: number;
  home_team_primary_color: string;
  home_team_logo_url: string;
  away_team_key: string;
  away_team_wins: number;
  away_team_losses: number;
  away_team_primary_color: string;
  away_team_logo_url: string;
  status: GameStatus;
}

interface MobileGame {
  id: string;
  enabled: boolean;
  games: {
    type: "predictor";
    id: string;
    enabled: boolean;
  }[];
}

export interface GameForMobileGame extends SportsGameForCard {
  m_game: MobileGame | null;
}

export interface GameCategory {
  id: number;
  game_type: GameType;
  label: string;
  value: string;
}

