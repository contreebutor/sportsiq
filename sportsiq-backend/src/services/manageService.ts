import { supabase } from "../utils/supabase";
import { Profile } from "../types";
import { getToday } from "./generalService";
import { config } from "../config";

export const handleCreateProfile = async (
  email: string,
  username: string,
  notes: string
) => {
  if (!config.defaultProfilePassword) {
    throw new Error("DEFAULT_PROFILE_PASSWORD is not set");
  }
  try {
    const createdUser = await createUser(email, config.defaultProfilePassword);
    const { message, profile: createdProfile } = await createProfile({
      id: createdUser.id,
      username: username,
      notes: notes,
    });
    await registerDefaultContestPrizes(createdProfile.id);

    return { message, profile: createdProfile };
  } catch (error) {
    console.error("Error handling create profile: " + error);
    throw new Error("Internal server error");
  }
};

export const updateProfile = async (profile: Profile) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        // is_admin: profile.isAdmin,  // This should be done by the admin user not the profile itself
        username: profile.username,
        notes: profile.notes,
        dashboard_game_types: profile.dashboardGameTypes,
        dashboard_card_count: profile.dashboardCardCount,
        interval_dashboard_rotation_time: profile.intervalDashboardRotationTime,
        interval_card_rotation_time: profile.intervalCardRotationTime,
        contest_enabled: profile.contestEnabled,
        contest_dashboard_type: profile.contestDashboardType,
      })
      .eq("id", profile.id);

    if (error) {
      throw new Error("Error updating profile: " + error.message);
    }

    return {
      message: "Profile updated successfully",
      profile: profile,
    };
  } catch (error) {
    console.error("Error updating profile: " + error);
    throw new Error("Internal server error");
  }
};

export const fetchProfilesByProfileID = async (
  profile_id: string
): Promise<{ profile: Profile; profiles: Profile[] }> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        is_admin, 
        username, 
        notes, 
        dashboard_game_types, 
        dashboard_card_count,
        interval_dashboard_rotation_time,
        interval_card_rotation_time,
        contest_enabled,
        contest_dashboard_type
        `
      )
      .order("is_admin", { ascending: false })
      .order("username", { ascending: true });

    if (error) {
      throw new Error(
        "Error fetching profiles by profile ID: " + error.message
      );
    }

    if (!data) {
      throw new Error(
        "Error fetching profiles by profile ID: Profiles not found in database"
      );
    }

    const formattedProfiles: Profile[] = data.map((profile) => ({
      id: profile.id,
      isAdmin: profile.is_admin,
      username: profile.username,
      notes: profile.notes,
      dashboardGameTypes: profile.dashboard_game_types,
      dashboardCardCount: profile.dashboard_card_count,
      intervalDashboardRotationTime: profile.interval_dashboard_rotation_time,
      intervalCardRotationTime: profile.interval_card_rotation_time,
      contestEnabled: profile.contest_enabled,
      contestDashboardType: profile.contest_dashboard_type,
    }));

    const userProfile = formattedProfiles?.find(
      (profile) => profile.id === profile_id
    );

    if (!userProfile) {
      throw new Error(
        "Error fetching profiles by profile ID: User profile not found"
      );
    }

    const isUserAdmin = userProfile.isAdmin;

    return {
      profile: userProfile,
      profiles: isUserAdmin ? formattedProfiles : [userProfile],
    };
  } catch (error) {
    console.error("Error fetching profiles by profile ID: " + error);
    throw new Error("Internal server error");
  }
};

export const deleteProfile = async (profile_id: string) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile_id);

    if (error) {
      throw new Error("Error deleting profile: " + error.message);
    }

    return true;
  } catch (error) {
    console.error("Error deleting profile: " + error);
    return false;
  }
};

export const updateGeneralGames = async (
  games: {
    id: string;
    enabled: boolean;
  }[]
) => {
  try {
    const enabledGames = games
      .filter((game) => game.enabled)
      .map((game) => game.id);

    const disabledGames = games
      .filter((game) => !game.enabled)
      .map((game) => game.id);

    const [enableSuccess, disableSuccess] = await Promise.all([
      enableGeneralGames(enabledGames),
      disableGeneralGames(disabledGames),
    ]);

    if (!enableSuccess || !disableSuccess) {
      throw new Error("Failed to update general games");
    }

    return {
      enabledGames,
      disabledGames,
    };
  } catch (error) {
    console.error("Error updating general games: " + error);
    throw new Error(
      "Internal server error while updating general games: " + error
    );
  }
};

export const updateMobileGameStatus = async (
  game_uuid: string,
  enabled: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("m_games")
      .update({ enabled: enabled })
      .eq("game_uuid", game_uuid);
    if (error) {
      const errMsg = `Error updating mobile game status: ${error.message}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  } catch (error) {
    const errMsg = `Error updating mobile game status: ${error}`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
};

export const fetchGamesForMobileGame = async () => {
  try {
    const today = getToday();
    const games = await fetchMobileGamesWithStatus(today);
    const formattedGames = games.map((g) => {
      const mGamePredictor = g.m_game_predictor_id
        ? {
            type: "predictor",
            id: g.m_game_predictor_id,
            enabled: g.m_game_predictor_enabled,
          }
        : null;
      const mGames = mGamePredictor ? [mGamePredictor] : [];
      const mGame = g.m_game_id
        ? {
            id: g.m_game_id,
            enabled: g.m_game_enabled,
            games: mGames,
          }
        : null;

      return {
        game_uuid: g.game_uuid,
        game_type: g.game_type,
        day: g.day,
        date_time: g.date_time,
        home_team_key: g.home_team_key,
        home_team_wins: g.home_team_wins,
        home_team_losses: g.home_team_losses,
        home_team_primary_color: g.home_team_primary_color,
        home_team_logo_url: g.home_team_logo_url,
        away_team_key: g.away_team_key,
        away_team_wins: g.away_team_wins,
        away_team_losses: g.away_team_losses,
        away_team_primary_color: g.away_team_primary_color,
        away_team_logo_url: g.away_team_logo_url,
        status: g.status,
        m_game: mGame,
      };
    });

    return formattedGames;
  } catch (error) {
    const errMsg = `Error fetching games for mobile game: ${error}`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
};

export const fetchGameCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("game_categories")
      .select("id, game_type, label, value");

    if (error) {
      console.error("Error fetching game categories: ", error);
      throw new Error("Error fetching game categories: " + error.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching game categories: ", error);
    throw new Error("Internal server error while fetching game categories");
  }
};

/**
 * +------------------------------------------+
 * |                                          |
 * |                                          |
 * |                                          |
 * |            Inline functions              |
 * |                                          |
 * |                                          |
 * |                                          |
 * +------------------------------------------+
 */

const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Error creating user: " + error.message);
      throw new Error("Error creating user: " + error.message);
    }

    return data.user;
  } catch (error) {
    console.error("Error creating user: " + error);
    throw new Error("Internal server error");
  }
};

const createProfile = async (profile: {
  id: string;
  username: string;
  notes: string;
}): Promise<{
  message: string;
  profile: {
    id: string;
    username: string;
    notes: string;
  };
}> => {
  try {
    const { error } = await supabase.from("profiles").insert({
      id: profile.id,
      username: profile.username,
      notes: profile.notes,
    });

    if (error) {
      console.error("Error creating profile: " + error.message);
      throw new Error("Error creating profile: " + error.message);
    }

    return {
      message: "Profile created successfully",
      profile: profile,
    };
  } catch (error) {
    console.error("Error creating profile: " + error);
    throw new Error("Internal server error");
  }
};

const registerDefaultContestPrizes = async (profile_id: string) => {
  try {
    const { error } = await supabase.from("default_contest_prizes").insert({
      profile_id,
      prizes: null,
      prizes_enabled: false,
      points_enabled: false,
    });

    if (error) {
      console.error("Error registering default prizes: " + error.message);
      throw new Error("Error registering default prizes: " + error.message);
    }
  } catch (error) {
    console.error("Error registering default prizes: " + error);
    throw new Error("Internal server error");
  }
};

const enableGeneralGames = async (games: string[]) => {
  try {
    const { error } = await supabase
      .from("general_games")
      .update({ enabled: true })
      .in("id", games);
    if (error) {
      console.error("Error enabling general games: " + error.message);
      throw new Error("Error enabling general games: " + error.message);
    }
    return true;
  } catch (error) {
    console.error("Error enabling general games: " + error);
    throw new Error("Internal server error");
  }
};

const disableGeneralGames = async (games: string[]) => {
  try {
    const { error } = await supabase
      .from("general_games")
      .update({ enabled: false })
      .in("id", games);
    if (error) {
      console.error("Error disabling general games: " + error.message);
      throw new Error("Error disabling general games: " + error.message);
    }
    return true;
  } catch (error) {
    console.error("Error disabling general games: " + error);
    throw new Error("Internal server error");
  }
};

const fetchMobileGamesWithStatus = async (today: string) => {
  try {
    const { data, error } = await supabase
      .from("view_games_with_m_status")
      .select(
        `
          game_uuid,
          game_type,
          day,
          date_time,
          home_team_key,
          home_team_wins,
          home_team_losses,
          home_team_primary_color,
          home_team_logo_url,
          away_team_key,
          away_team_wins,
          away_team_losses,
          away_team_primary_color,
          away_team_logo_url,
          status,
          m_game_id,
          m_game_enabled,
          m_game_predictor_id,
          m_game_predictor_enabled
        `
      )
      .eq("day", today)
      .in("status", ["Scheduled", "InProgress", "Final", "F/OT"]);
    if (error) {
      throw new Error(`Error fetching games for mobile game: ${error.message}`);
    }
    return data;
  } catch (error) {
    const errMsg = `Error fetching games for mobile game: ${error}`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
};

