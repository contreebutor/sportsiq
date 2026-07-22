import { supabase } from "../lib/supabase";
import { convertSupabaseGameToGame } from "../lib/utils";
import { Game, SupabaseGame } from "../types/general";

export const fetchAllGames = async (gameUUID?: string): Promise<Game[]> => {
  let query = supabase.from("view_general_games_teams_odds_stats_probabilities")
    .select(`
        game_uuid,
        game_type,
        game_id,
        day,
        date_time,
        status,

        home_team_key,
        home_team_score,
        home_team_logo_url,
        home_team_primary_color,
        home_team_wins,
        home_team_losses,

        away_team_key,
        away_team_score,
        away_team_logo_url,
        away_team_primary_color,
        away_team_wins,
        away_team_losses,

        game_over_at,
        possession,
        down,
        distance,
        yard_line,
        
        quarter,
        time_remaining_minutes,
        time_remaining_seconds,

        home_moneyline,
        away_moneyline,
        point_spread,
        point_spread_home_moneyline,
        point_spread_away_moneyline,
        over_under,
        over_payout,
        under_payout,
        quarters,

        pre_game_odds,
        live_game_odds,

        home_bet_moneyline,
        home_bet_spread,
        home_bet_total,
        home_money_moneyline,
        home_money_spread,
        home_money_total,

        away_bet_moneyline,
        away_bet_spread,
        away_bet_total,
        away_money_moneyline,
        away_money_spread,
        away_money_total,

        home_win_probability,
        home_cover_probability,
        home_total_probability,
        away_win_probability,
        away_cover_probability,
        away_total_probability,

        stat_one_title,
        stat_two_title,
        stat_three_title,
        stat_four_title,
        stat_five_title,
        stat_six_title,

        home_team_stat_one_value,
        home_team_stat_two_value,
        home_team_stat_three_value,
        home_team_stat_four_value,
        home_team_stat_five_value,
        home_team_stat_six_value,

        away_team_stat_one_value,
        away_team_stat_two_value,
        away_team_stat_three_value,
        away_team_stat_four_value,
        away_team_stat_five_value,
        away_team_stat_six_value
      `);

  if (gameUUID) {
    query = query.eq("game_uuid", gameUUID);
  } else {
    query = query
      .order("date_time", { ascending: true })
      .order("game_id", { ascending: true });
  }

  query = query
    .in("status", ["Scheduled", "InProgress", "Final", "F/OT"])
    .eq("enabled", true);

  try {
    const { data, error } = await query;

    if (error) {
      throw new Error("Failed to fetch all games: " + error.message);
    }
    const formattedData = data.map((game: SupabaseGame) =>
      convertSupabaseGameToGame(game)
    );
    return formattedData;
  } catch (error) {
    console.error("Error fetching all games:", error);
    throw new Error("Failed to fetch all games: " + error.message);
  }
};
