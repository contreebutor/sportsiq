import { supabase } from "../lib/supabase";
import {
  DashboardSettings,
  GameCategory,
  GameForMobileGame,
  UserProfile,
} from "../types/general";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface Game {
  game_uuid: string;
  game_type: string;
  game_id: number;
  day: string;
  date_time: string;
  status: string;
  home_team_key: string;
  away_team_key: string;
  home_team_logo_url: string;
  away_team_logo_url: string;
  home_team_primary_color: string;
  away_team_primary_color: string;
  home_team_wins: number;
  away_team_wins: number;
  home_team_losses: number;
  away_team_losses: number;
  enabled: boolean;
}

export interface ManageGamesRequest {
  id: string;
  enabled: boolean;
}

export const fetchDashboardSettingsByProfileID = async (
  profileID: string
): Promise<DashboardSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("view_dashboard_settings")
      .select(
        `
        profile_id,
        dashboard_game_types,
        dashboard_card_count,
        interval_dashboard_rotation_time,
        interval_card_rotation_time,
        contest_enabled,
        contest_dashboard_type
      `
      )
      .eq("profile_id", profileID)
      .single();

    if (error) {
      console.error("Failed to fetch dashboard settings: ", error);
      return null;
    }

    if (!data) {
      console.error("No dashboard settings found");
      return null;
    }

    return data as DashboardSettings;
  } catch (error) {
    console.error("Failed to fetch dashboard settings: ", error);
    return null;
  }
};

interface FetchProfilesResponse {
  profile: UserProfile;
  profiles: UserProfile[];
}

export const fetchProfilesByProfileID = async (
  profileID: string
): Promise<FetchProfilesResponse | null> => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/fetch-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile_id: profileID }),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch profiles");
    }
    const responseData = await res.json();
    return responseData.data as FetchProfilesResponse;
  } catch (error) {
    console.error("Failed to fetch profiles: ", error);
    return null;
  }
};

export const updateProfile = async (
  profile: UserProfile
): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) {
      throw new Error("Failed to update profile");
    }
    const responseData = await res.json();
    return responseData.data?.profile as UserProfile;
  } catch (error) {
    console.error("Failed to update profile: ", error);
    throw error;
  }
};

interface CreateProfileRequest {
  email: string;
  username: string;
  notes: string;
}

export const createProfile = async (
  request: CreateProfileRequest
): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/create-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error("Failed to create profile");
    }
    const responseData = await res.json();
    return responseData.data?.profile as UserProfile;
  } catch (error) {
    console.error("Failed to create profile: ", error);
    throw error;
  }
};

export const deleteProfile = async (profileID: string): Promise<boolean> => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/delete-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile_id: profileID }),
    });
    if (!res.ok) {
      throw new Error("Failed to delete profile");
    }
    return true;
  } catch (error) {
    console.error("Failed to delete profile: ", error);
    throw error;
  }
};

export const fetchGamesByType = async (gameType: string): Promise<Game[]> => {
  try {
    const { data, error } = await supabase
      .from("view_general_games_teams_odds_stats_probabilities")
      .select(
        `
        game_uuid,
        game_type,
        game_id,
        day,
        date_time,
        status,
        home_team_key,
        away_team_key,
        home_team_logo_url,
        away_team_logo_url,
        home_team_primary_color,
        away_team_primary_color,
        home_team_wins,
        away_team_wins,
        home_team_losses,
        away_team_losses,
        enabled
      `
      )
      .eq("game_type", gameType)
      .in("status", ["Scheduled", "InProgress", "Final", "F/OT"])
      .order("date_time", { ascending: true })
      .order("game_id", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch ${gameType.toUpperCase()} games: ` + error.message
      );
    }

    return (data || []) as Game[];
  } catch (error) {
    console.error(`Error fetching ${gameType.toUpperCase()} games:`, error);
    throw error;
  }
};

export const manageGames = async (
  games: ManageGamesRequest[]
): Promise<boolean> => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/update-general-games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ games }),
    });
    if (!res.ok) {
      throw new Error("Failed to manage games");
    }
    return true;
  } catch (error) {
    console.error("Failed to manage games: ", error);
    throw error;
  }
};

export const fetchGamesForMobileGame = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/manage/mobile/fetch-games`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error("Failed to fetch games for mobile game: ", res.statusText);
      throw new Error("Failed to fetch games for mobile game");
    }
    const responseData = await res.json();
    return responseData.data as GameForMobileGame[];
  } catch (error) {
    console.error("Failed to fetch games for mobile game: ", error);
    throw error;
  }
};

export const fetchGameCategories = async (): Promise<GameCategory[]> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/v1/manage/fetch-game-categories`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch game categories");
    }

    const data = await response.json();
    return data.data as GameCategory[];
  } catch (error) {
    console.error("Error fetching game categories:", error);
    throw new Error("Failed to fetch game categories: " + error.message);
  }
};

export const updateMobileGameStatus = async (
  gameUUID: string,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/v1/manage/mobile/update-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_uuid: gameUUID, enabled }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update mobile game status");
    }
  } catch (error) {
    console.error("Failed to update mobile game status: ", error);
    throw error;
  }
};

