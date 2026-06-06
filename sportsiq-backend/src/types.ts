export type GameType = "nba" | "nfl" | "nhl" | "cbb" | "cfb" | "mlb";
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
export type GameStatus = "Scheduled" | "InProgress" | "Final" | "F/OT";

/**
 * Supabase table types
 */

export interface SupabaseTotalGame {
  game_id: number;
  game_type: GameType;
  day: string | null;
  date_time: string | null;

  status: GameStatus;
  home_team_key: string;
  home_team_score: number;
  away_team_key: string;
  away_team_score: number;

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
  game_over_at: string | null; /// the date and time the game is over

  /// The below fields are only available for NFL games
  possession: string | null; // The team that has the ball
  down: number | null; // The down number
  distance: string | null; // The distance to the first down
  yard_line: number | null; // The yard line of the ball
}

export interface SupabaseTotalTeamProfile {
  game_type: GameType;
  team_key: string;
  team_logo_url: string;
  team_primary_color: string;
}

export interface SupabaseTotalTeamSeasonStat {
  game_type: GameType;
  team_key: string;
  team_wins: number;
  team_losses: number;
}

export interface SupabaseContestProjection {
  quarter: string;
  prize: string;
  projection: number;
}

export interface Quarter {
  name: string;
  home_team_score: number;
  away_team_score: number;
}

export interface PreGameOdd {
  game_type: GameType;
  game_id: number;
  pre_game_odds: GameOdd[];
}

export interface LiveGameOdd {
  game_type: GameType;
  game_id: number;
  live_game_odds: GameOdd[];
}

export interface GameOdd {
  sportsbook: string;
  home_moneyline: number;
  away_moneyline: number;
  home_point_spread: number;
  away_point_spread: number;
  home_point_spread_payout: number;
  away_point_spread_payout: number;
  over_under: number;
  over_payout: number;
  under_payout: number;
}

export interface GameStats {
  game_type: GameType;
  team_key: string;
  stat_one_title: string;
  stat_one_value: string;
  stat_two_title: string;
  stat_two_value: string;
  stat_three_title: string;
  stat_three_value: string;
  stat_four_title: string;
  stat_four_value: string;
  stat_five_title: string;
  stat_five_value: string;
  stat_six_title: string;
  stat_six_value: string;
}

export interface BettingSplit {
  game_type: GameType;
  game_id: number;

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

export interface Probability {
  game_type: GameType;
  game_id: number;
  home_win_probability: number | null;
  home_cover_probability: number | null;
  home_total_probability: number | null;
  away_win_probability: number | null;
  away_cover_probability: number | null;
  away_total_probability: number | null;
}

export interface Profile {
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

export interface NFLTeamGameStats {
  game_type: GameType;
  team_key: string;
  game_id: number;
  quarter: GameQuarter;
  touchdowns: number;
  field_goals_made: number;
  field_goals_missed: number;
  sacks: number;
  safeties: number;
  passing_interceptions: number;
  fumbles: number;
  punts: number;
  extra_point_made: number;
  extra_point_missed: number;
  two_pt_conversion_made: number;
  two_pt_conversion_missed: number;
  penalties: number;
  first_downs: number;
  points: number;
  first_downs_by_rushing: number;
  offensive_yards: number;
  offensive_plays: number;
  rushing_yards: number;
  passing_yards: number;
  passing_attempts: number;
  passing_completions: number;
  third_down_conversions: number;
  fourth_down_conversions: number;
  passing_touchdowns: number;
  rushing_touchdowns: number;
}

export interface NBATeamGameStats {
  game_type: GameType;
  team_key: string;
  game_id: number;
  quarter: GameQuarter;
  three_pointers_made: number;
  three_pointers_missed: number;
  steals: number;
  turnovers: number;
  personal_fouls: number;
  points: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  rebounds: number;
  blocked_shots: number;
  field_goals_attempted: number;
  field_goals_made: number;
  field_goals_missed: number;
  free_throws_attempted: number;
  free_throws_made: number;
  free_throws_missed: number;
  assists: number;
}

export interface CBBTeamGameStats extends NBATeamGameStats {}

export interface NHLTeamGameStats {
  game_type: GameType;
  team_key: string;
  game_id: number;
  period: GameQuarter;
  goals: number;
  assists: number;
  shots_on_goal: number;
  power_play_goals: number;
  short_handed_goals: number;
  empty_net_goals: number;
  power_play_assists: number;
  short_handed_assists: number;
  hat_tricks: number;
  shootout_goals: number;
  plus_minus: number;
  penalty_minutes: number;
  blocks: number;
  hits: number;
  takeaways: number;
  giveaways: number;
  faceoffs_won: number;
  faceoffs_lost: number;
  shifts: number;
  goaltending_shots_against: number;
  goaltending_goals_against: number;
  goaltending_saves: number;
  goaltending_shutouts: number;
  bench_penalty_minutes: number;
}

export interface MLBTeamGameStats {
  game_type: GameType;
  team_key: string;
  game_id: number;
  inning: GameQuarter;
  at_bats: number;
  runs: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  home_runs: number;
  rbi: number;
  batting_average: number;
  outs: number;
  strikeouts: number;
  walks: number;
  hit_by_pitch: number;
  sacrifices: number;
  sacrifice_flies: number;
  ground_into_double_play: number;
  stolen_bases: number;
  caught_stealing: number;
  on_base_percentage: number;
  slugging_percentage: number;
  on_base_plus_slugging: number;
  errors: number;
  pitching_hits: number;
  pitching_runs: number;
  pitching_earned_runs: number;
  pitching_walks: number;
  pitching_strikeouts: number;
  pitching_home_runs: number;
  pitching_earned_run_average: number;
  innings_pitched_decimal: number;
  pitches_thrown: number;
  pitches_thrown_strikes: number;
  walks_hits_per_innings_pitched: number;
  pitching_batting_average_against: number;
  pitching_complete_games: number;
  pitching_shut_outs: number;
  pitching_no_hitters: number;
  double_plays: number;
  left_on_base: number;
}

export interface CreatePredictorRequest {
  upcoming_game_uuid: string;
  settings: {
    quarter: GameQuarter;
    groups: {
      team_key: string;
      category: string;
      value: number;
      points: {
        under: number;
        exact: number;
        over: number;
      };
    }[];
  }[];
}

export interface CreateBingoRequest {
  upcoming_game_uuid: string;
  groups: {
    team_key: string;
    description: string;
    category: string;
    value: number;
    points: number;
  }[];
}

