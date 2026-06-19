import {
  handleCreateProfile as handleCreateProfileService,
  fetchProfilesByProfileID,
  updateProfile as updateProfileService,
  deleteProfile as deleteProfileService,
  updateGeneralGames as updateGeneralGamesService,
  updateMobileGameStatus as updateMobileGameStatusService,
  fetchGamesForMobileGame as fetchGamesForMobileGameService,
  fetchGameCategories as fetchGameCategoriesService,
} from "../services/manageService";
import { supabase } from "../utils/supabase";
import { Request, Response } from "express";

export const createProfile = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { email, username, notes } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    } else if (!username) {
      return res.status(400).json({ error: "Username is required" });
    } else if (!notes) {
      return res.status(400).json({ error: "Notes is required" });
    }

    const { message, profile: createdProfile } =
      await handleCreateProfileService(email, username, notes);

    if (!createdProfile) {
      return res.status(400).json({ error: "Failed to create profile" });
    }

    return res.status(200).json({
      message,
      data: { profile: createdProfile },
    });
  } catch (error) {
    console.error("Error creating profile: " + error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchProfiles = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const { profile, profiles } = await fetchProfilesByProfileID(profile_id);

    return res.status(200).json({
      message: "Profiles fetched successfully",
      data: {
        profile,
        profiles,
      },
    });
  } catch (error) {
    console.error("Error fetching profiles by profile ID:", error);
    return res.status(500).json({
      message: "Error fetching profiles by profile ID",
      error: error,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: "Profile is required" });
    }

    if (
      typeof profile.id !== "string" ||
      typeof profile.isAdmin !== "boolean" ||
      typeof profile.username !== "string" ||
      typeof profile.notes !== "string" ||
      !Array.isArray(profile.dashboardGameTypes) ||
      typeof profile.dashboardCardCount !== "number" ||
      typeof profile.intervalDashboardRotationTime !== "number" ||
      typeof profile.intervalCardRotationTime !== "number" ||
      typeof profile.contestEnabled !== "boolean"
    ) {
      return res.status(400).json({ error: "Invalid profile data" });
    }

    const { message, profile: updatedProfile } = await updateProfileService(
      profile
    );

    return res.status(200).json({
      message,
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const deleted = await deleteProfileService(profile_id);

    if (!deleted) {
      return res.status(400).json({ message: "Failed to delete profile" });
    }

    return res.status(200).json({
      message: "Profile deleted successfully",
      data: { deleted },
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGeneralGames = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { games } = req.body;

    if (!games) {
      return res.status(400).json({ error: "Games are required" });
    }

    const updatedGames = await updateGeneralGamesService(games);

    if (!updatedGames) {
      return res.status(400).json({ message: "Failed to update games" });
    }

    return res
      .status(200)
      .json({ message: "Games updated successfully", data: { updatedGames } });
  } catch (error) {
    console.error("Error updating general games:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMobileGameStatus = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { game_uuid, enabled } = req.body;

    if (!game_uuid) {
      return res.status(400).json({ error: "Game UUID is required" });
    }

    if (enabled === undefined) {
      return res.status(400).json({ error: "Enabled is required" });
    }

    await updateMobileGameStatusService(game_uuid, enabled);

    return res.status(200).json({
      message: "Mobile game status updated successfully",
    });
  } catch (error) {
    console.error("Error updating mobile game status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchGamesForMobileGame = async (req: Request, res: Response) => {
  try {
    const games = await fetchGamesForMobileGameService();
    return res.status(200).json({
      message: "Games fetched successfully",
      data: games,
    });
  } catch (error) {
    console.error("Error fetching games for mobile game:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchGameCategories = async (req: Request, res: Response) => {
  try {
    const gameCategories = await fetchGameCategoriesService();
    return res.status(200).json({
      message: "Game categories fetched successfully",
      data: gameCategories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching game categories",
      error: error,
    });
  }
};

export const fetchFeaturedGames = async (req: Request, res: Response) => {
  try {
    const gameUUID = req.query.game_uuid as string;
    if (!gameUUID) {
      return res.status(400).json({ message: "game_uuid is required" });
    }

    const { data, error } = await supabase
      .from("m_featured_games")
      .select("*")
      .like("game_id", `${gameUUID}%`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return res.status(200).json({ data: data ?? [] });
  } catch (error) {
    console.error("Error fetching featured games:", error);
    return res.status(500).json({ message: "Error fetching featured games" });
  }
};

export const saveFeaturedGames = async (req: Request, res: Response) => {
  try {
    const { game_uuid, home_team, away_team, start_time, picks } = req.body;

    if (!game_uuid || !picks) {
      return res.status(400).json({ message: "game_uuid and picks are required" });
    }

    // Delete existing featured games for this game
    await supabase
      .from("m_featured_games")
      .delete()
      .like("game_id", `${game_uuid}%`);

    // Insert new picks
    if (Array.isArray(picks) && picks.length > 0) {
      const rows = picks.map((p: any, i: number) => ({
        game_id: `${game_uuid}_${i}`,
        home_team,
        away_team,
        pick_question: p.pick_question,
        start_time,
        status: "scheduled",
        resolve_team: p.resolve_team,
        resolve_category: p.resolve_category,
        resolve_operator: p.resolve_operator,
        resolve_value: p.resolve_value,
      }));

      const { error } = await supabase.from("m_featured_games").insert(rows);
      if (error) throw error;
    }

    return res.status(200).json({ message: "Featured picks saved" });
  } catch (error) {
    console.error("Error saving featured games:", error);
    return res.status(500).json({ message: "Error saving featured games" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { profile_id, new_password } = req.body;

    if (!profile_id || !new_password) {
      return res
        .status(400)
        .json({ message: "profile_id and new_password are required" });
    }

    const { error } = await supabase.auth.admin.updateUserById(profile_id, {
      password: new_password,
    });

    if (error) throw error;
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Error resetting password" });
  }
};
