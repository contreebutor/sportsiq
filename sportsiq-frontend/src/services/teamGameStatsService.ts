import { supabase } from "../lib/supabase";

export interface NFLTeamGameStats {
  team_key: string;
  game_id: string;
  first_quarter_touchdowns: number;
  first_quarter_field_goals_made: number;
  first_quarter_field_goals_missed: number;
  first_quarter_sacks: number;
  first_quarter_safeties: number;
  first_quarter_passing_interceptions: number;
  first_quarter_fumbles: number;
  first_quarter_punts: number;
  first_quarter_extra_point_made: number;
  first_quarter_extra_point_missed: number;
  first_quarter_two_pt_conversion_made: number;
  first_quarter_two_pt_conversion_missed: number;
  first_quarter_penalties: number;
  first_quarter_first_downs: number;
  first_quarter_points: number;
  first_quarter_first_downs_by_rushing: number;
  first_quarter_offensive_yards: number;
  first_quarter_offensive_plays: number;
  first_quarter_rushing_yards: number;
  first_quarter_passing_yards: number;
  first_quarter_passing_attempts: number;
  first_quarter_passing_completions: number;
  first_quarter_third_down_conversions: number;
  first_quarter_fourth_down_conversions: number;
  first_quarter_passing_touchdowns: number;
  first_quarter_rushing_touchdowns: number;
  second_quarter_touchdowns: number;
  second_quarter_field_goals_made: number;
  second_quarter_field_goals_missed: number;
  second_quarter_sacks: number;
  second_quarter_safeties: number;
  second_quarter_passing_interceptions: number;
  second_quarter_fumbles: number;
  second_quarter_punts: number;
  second_quarter_extra_point_made: number;
  second_quarter_extra_point_missed: number;
  second_quarter_two_pt_conversion_made: number;
  second_quarter_two_pt_conversion_missed: number;
  second_quarter_penalties: number;
  second_quarter_first_downs: number;
  second_quarter_points: number;
  second_quarter_first_downs_by_rushing: number;
  second_quarter_offensive_yards: number;
  second_quarter_offensive_plays: number;
  second_quarter_rushing_yards: number;
  second_quarter_passing_yards: number;
  second_quarter_passing_attempts: number;
  second_quarter_passing_completions: number;
  second_quarter_third_down_conversions: number;
  second_quarter_fourth_down_conversions: number;
  second_quarter_passing_touchdowns: number;
  second_quarter_rushing_touchdowns: number;
  third_quarter_touchdowns: number;
  third_quarter_field_goals_made: number;
  third_quarter_field_goals_missed: number;
  third_quarter_sacks: number;
  third_quarter_safeties: number;
  third_quarter_passing_interceptions: number;
  third_quarter_fumbles: number;
  third_quarter_punts: number;
  third_quarter_extra_point_made: number;
  third_quarter_extra_point_missed: number;
  third_quarter_two_pt_conversion_made: number;
  third_quarter_two_pt_conversion_missed: number;
  third_quarter_penalties: number;
  third_quarter_first_downs: number;
  third_quarter_points: number;
  third_quarter_first_downs_by_rushing: number;
  third_quarter_offensive_yards: number;
  third_quarter_offensive_plays: number;
  third_quarter_rushing_yards: number;
  third_quarter_passing_yards: number;
  third_quarter_passing_attempts: number;
  third_quarter_passing_completions: number;
  third_quarter_third_down_conversions: number;
  third_quarter_fourth_down_conversions: number;
  third_quarter_passing_touchdowns: number;
  third_quarter_rushing_touchdowns: number;
  fourth_quarter_touchdowns: number;
  fourth_quarter_field_goals_made: number;
  fourth_quarter_field_goals_missed: number;
  fourth_quarter_sacks: number;
  fourth_quarter_safeties: number;
  fourth_quarter_passing_interceptions: number;
  fourth_quarter_fumbles: number;
  fourth_quarter_punts: number;
  fourth_quarter_extra_point_made: number;
  fourth_quarter_extra_point_missed: number;
  fourth_quarter_two_pt_conversion_made: number;
  fourth_quarter_two_pt_conversion_missed: number;
  fourth_quarter_penalties: number;
  fourth_quarter_first_downs: number;
  fourth_quarter_points: number;
  fourth_quarter_first_downs_by_rushing: number;
  fourth_quarter_offensive_yards: number;
  fourth_quarter_offensive_plays: number;
  fourth_quarter_rushing_yards: number;
  fourth_quarter_passing_yards: number;
  fourth_quarter_passing_attempts: number;
  fourth_quarter_passing_completions: number;
  fourth_quarter_third_down_conversions: number;
  fourth_quarter_fourth_down_conversions: number;
  fourth_quarter_passing_touchdowns: number;
  fourth_quarter_rushing_touchdowns: number;
}

export interface CBBTeamGameStats {
  team_key: string;
  game_id: string;
  first_quarter_three_pointers_made: number;
  first_quarter_three_pointers_missed: number;
  first_quarter_steals: number;
  first_quarter_turnovers: number;
  first_quarter_personal_fouls: number;
  first_quarter_points: number;
  first_quarter_offensive_rebounds: number;
  first_quarter_defensive_rebounds: number;
  first_quarter_rebounds: number;
  first_quarter_blocked_shots: number;
  first_quarter_field_goals_attempted: number;
  first_quarter_field_goals_made: number;
  first_quarter_field_goals_missed: number;
  first_quarter_free_throws_attempted: number;
  first_quarter_free_throws_made: number;
  first_quarter_free_throws_missed: number;
  first_quarter_assists: number;
  second_quarter_three_pointers_made: number;
  second_quarter_three_pointers_missed: number;
  second_quarter_steals: number;
  second_quarter_turnovers: number;
  second_quarter_personal_fouls: number;
  second_quarter_points: number;
  second_quarter_offensive_rebounds: number;
  second_quarter_defensive_rebounds: number;
  second_quarter_rebounds: number;
  second_quarter_blocked_shots: number;
  second_quarter_field_goals_attempted: number;
  second_quarter_field_goals_made: number;
  second_quarter_field_goals_missed: number;
  second_quarter_free_throws_attempted: number;
  second_quarter_free_throws_made: number;
  second_quarter_free_throws_missed: number;
  second_quarter_assists: number;
}

export interface NBATeamGameStats extends CBBTeamGameStats {
  third_quarter_three_pointers_made: number;
  third_quarter_three_pointers_missed: number;
  third_quarter_steals: number;
  third_quarter_turnovers: number;
  third_quarter_personal_fouls: number;
  third_quarter_points: number;
  third_quarter_offensive_rebounds: number;
  third_quarter_defensive_rebounds: number;
  third_quarter_rebounds: number;
  third_quarter_blocked_shots: number;
  third_quarter_field_goals_attempted: number;
  third_quarter_field_goals_made: number;
  third_quarter_field_goals_missed: number;
  third_quarter_free_throws_attempted: number;
  third_quarter_free_throws_made: number;
  third_quarter_free_throws_missed: number;
  third_quarter_assists: number;
  fourth_quarter_three_pointers_made: number;
  fourth_quarter_three_pointers_missed: number;
  fourth_quarter_steals: number;
  fourth_quarter_turnovers: number;
  fourth_quarter_personal_fouls: number;
  fourth_quarter_points: number;
  fourth_quarter_offensive_rebounds: number;
  fourth_quarter_defensive_rebounds: number;
  fourth_quarter_rebounds: number;
  fourth_quarter_blocked_shots: number;
  fourth_quarter_field_goals_attempted: number;
  fourth_quarter_field_goals_made: number;
  fourth_quarter_field_goals_missed: number;
  fourth_quarter_free_throws_attempted: number;
  fourth_quarter_free_throws_made: number;
  fourth_quarter_free_throws_missed: number;
  fourth_quarter_assists: number;
}

export const fetchNFLTeamGameStats = async (): Promise<NFLTeamGameStats[]> => {
  try {
    const { data, error } = await supabase
      .from("view_team_game_stats_nfl")
      .select("*");

    if (error) {
      throw new Error("Failed to fetch NFL team game stats: " + error.message);
    }

    return data as NFLTeamGameStats[];
  } catch (error: unknown) {
    console.error("Error fetching NFL team game stats:", error);
    throw new Error(
      "Failed to fetch NFL team game stats: " + (error as Error).message
    );
  }
};

export const fetchNBATeamGameStats = async (): Promise<NBATeamGameStats[]> => {
  try {
    const { data, error } = await supabase
      .from("view_team_game_stats_nba")
      .select("*");

    if (error) {
      throw new Error("Failed to fetch NBA team game stats: " + error.message);
    }

    return data as NBATeamGameStats[];
  } catch (error: unknown) {
    console.error("Error fetching NBA team game stats:", error);
    throw new Error(
      "Failed to fetch NBA team game stats: " + (error as Error).message
    );
  }
};

export const fetchCBBTeamGameStats = async (): Promise<CBBTeamGameStats[]> => {
  try {
    const { data, error } = await supabase
      .from("view_team_game_stats_cbb")
      .select("*");

    if (error) {
      throw new Error("Failed to fetch CBB team game stats: " + error.message);
    }

    return data as CBBTeamGameStats[];
  } catch (error: unknown) {
    console.error("Error fetching CBB team game stats:", error);
    throw new Error(
      "Failed to fetch CBB team game stats: " + (error as Error).message
    );
  }
};

export interface NHLTeamGameStats {
  team_key: string;
  game_id: string;
  first_period_goals: number;
  first_period_assists: number;
  first_period_shots_on_goal: number;
  first_period_power_play_goals: number;
  first_period_short_handed_goals: number;
  first_period_empty_net_goals: number;
  first_period_power_play_assists: number;
  first_period_short_handed_assists: number;
  first_period_hat_tricks: number;
  first_period_shootout_goals: number;
  first_period_plus_minus: number;
  first_period_penalty_minutes: number;
  first_period_blocks: number;
  first_period_hits: number;
  first_period_takeaways: number;
  first_period_giveaways: number;
  first_period_faceoffs_won: number;
  first_period_faceoffs_lost: number;
  first_period_shifts: number;
  first_period_goaltending_shots_against: number;
  first_period_goaltending_goals_against: number;
  first_period_goaltending_saves: number;
  first_period_goaltending_shutouts: number;
  first_period_bench_penalty_minutes: number;
  second_period_goals: number;
  second_period_assists: number;
  second_period_shots_on_goal: number;
  second_period_power_play_goals: number;
  second_period_short_handed_goals: number;
  second_period_empty_net_goals: number;
  second_period_power_play_assists: number;
  second_period_short_handed_assists: number;
  second_period_hat_tricks: number;
  second_period_shootout_goals: number;
  second_period_plus_minus: number;
  second_period_penalty_minutes: number;
  second_period_blocks: number;
  second_period_hits: number;
  second_period_takeaways: number;
  second_period_giveaways: number;
  second_period_faceoffs_won: number;
  second_period_faceoffs_lost: number;
  second_period_shifts: number;
  second_period_goaltending_shots_against: number;
  second_period_goaltending_goals_against: number;
  second_period_goaltending_saves: number;
  second_period_goaltending_shutouts: number;
  second_period_bench_penalty_minutes: number;
  third_period_goals: number;
  third_period_assists: number;
  third_period_shots_on_goal: number;
  third_period_power_play_goals: number;
  third_period_short_handed_goals: number;
  third_period_empty_net_goals: number;
  third_period_power_play_assists: number;
  third_period_short_handed_assists: number;
  third_period_hat_tricks: number;
  third_period_shootout_goals: number;
  third_period_plus_minus: number;
  third_period_penalty_minutes: number;
  third_period_blocks: number;
  third_period_hits: number;
  third_period_takeaways: number;
  third_period_giveaways: number;
  third_period_faceoffs_won: number;
  third_period_faceoffs_lost: number;
  third_period_shifts: number;
  third_period_goaltending_shots_against: number;
  third_period_goaltending_goals_against: number;
  third_period_goaltending_saves: number;
  third_period_goaltending_shutouts: number;
  third_period_bench_penalty_minutes: number;
}

export const fetchNHLTeamGameStats = async (): Promise<NHLTeamGameStats[]> => {
  try {
    const { data, error } = await supabase
      .from("view_team_game_stats_nhl")
      .select("*");

    if (error) {
      throw new Error("Failed to fetch NHL team game stats: " + error.message);
    }

    return data as NHLTeamGameStats[];
  } catch (error: unknown) {
    console.error("Error fetching NHL team game stats:", error);
    throw new Error(
      "Failed to fetch NHL team game stats: " + (error as Error).message
    );
  }
};

export interface MLBTeamGameStats {
  team_key: string;
  game_id: string;
  [key: `${string}_inning_${string}`]: number;
}

export const fetchMLBTeamGameStats = async (): Promise<MLBTeamGameStats[]> => {
  try {
    const { data, error } = await supabase
      .from("view_team_game_stats_mlb")
      .select("*");

    if (error) {
      throw new Error("Failed to fetch MLB team game stats: " + error.message);
    }

    return data as MLBTeamGameStats[];
  } catch (error: unknown) {
    console.error("Error fetching MLB team game stats:", error);
    throw new Error(
      "Failed to fetch MLB team game stats: " + (error as Error).message
    );
  }
};
