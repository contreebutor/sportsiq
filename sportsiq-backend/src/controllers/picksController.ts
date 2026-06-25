import { Request, Response } from "express";
import {
  getFeaturedGame,
  getFeaturedPredictions,
  submitPick,
  resolveGame,
  getGlobalLeaderboard,
  getBarLeaderboard,
  getUserStats,
  getTodayLeaderboard,
} from "../services/picksService";

export const fetchFeaturedGame = async (_req: Request, res: Response) => {
  try {
    const game = await getFeaturedGame();
    return res.status(200).json({ data: game });
  } catch (error) {
    console.error("Error fetching featured game:", error);
    return res.status(500).json({ message: "Error fetching featured game" });
  }
};

export const fetchFeaturedPredictions = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.user_id as string | undefined) ?? undefined;
    const games = await getFeaturedPredictions(userId);
    return res.status(200).json({ data: games });
  } catch (error) {
    console.error("Error fetching featured predictions:", error);
    return res
      .status(500)
      .json({ message: "Error fetching featured predictions" });
  }
};

export const submitUserPick = async (req: Request, res: Response) => {
  try {
    const { user_id, featured_game_id, choice, multiplier } = req.body;

    if (!user_id || !featured_game_id || !choice) {
      return res
        .status(400)
        .json({ message: "user_id, featured_game_id, and choice are required" });
    }

    const result = await submitPick(
      user_id,
      featured_game_id,
      choice,
      multiplier ?? 1
    );

    return res.status(200).json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error submitting pick";
    console.error("Error submitting pick:", error);
    return res.status(400).json({ message });
  }
};

export const resolveGamePicks = async (req: Request, res: Response) => {
  try {
    const { featured_game_id, correct_answer } = req.body;

    if (!featured_game_id || !correct_answer) {
      return res
        .status(400)
        .json({ message: "featured_game_id and correct_answer are required" });
    }

    if (correct_answer !== "yes" && correct_answer !== "no") {
      return res
        .status(400)
        .json({ message: "correct_answer must be 'yes' or 'no'" });
    }

    await resolveGame(featured_game_id, correct_answer);
    return res.status(200).json({ message: "Game resolved successfully" });
  } catch (error) {
    console.error("Error resolving game:", error);
    return res.status(500).json({ message: "Error resolving game" });
  }
};

export const fetchGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string | undefined;
    const result = await getGlobalLeaderboard(userId);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching global leaderboard:", error);
    return res
      .status(500)
      .json({ message: "Error fetching global leaderboard" });
  }
};

export const fetchUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) {
      return res.status(400).json({ message: "user_id query param is required" });
    }
    const result = await getUserStats(userId);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Error fetching user stats" });
  }
};

export const fetchBarLeaderboard = async (req: Request, res: Response) => {
  try {
    const venueId = req.query.venue_id as string | undefined;
    const userId = req.query.user_id as string | undefined;
    const result = await getBarLeaderboard(venueId, userId);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching bar leaderboard:", error);
    return res
      .status(500)
      .json({ message: "Error fetching bar leaderboard" });
  }
};

export const fetchTodayLeaderboard = async (_req: Request, res: Response) => {
  try {
    const result = await getTodayLeaderboard();
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching today leaderboard:", error);
    return res
      .status(500)
      .json({ message: "Error fetching today leaderboard" });
  }
};
