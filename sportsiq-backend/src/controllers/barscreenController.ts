import { Request, Response } from "express";
import { triviaManagerRef } from "../socket";
import { getBarscreenPredictions } from "../services/picksService";

export const getBarScreenState = async (_req: Request, res: Response) => {
  const trivia = triviaManagerRef?.getBarScreenState() ?? null;
  const games = await getBarscreenPredictions();

  return res.status(200).json({
    message: "OK",
    data: { trivia, predictions: { active: games.length > 0, games } },
  });
};

export const getBarscreenPredictionsHandler = async (
  _req: Request,
  res: Response
) => {
  try {
    const games = await getBarscreenPredictions();
    return res.status(200).json({ data: games });
  } catch (error) {
    console.error("Error fetching barscreen predictions:", error);
    return res
      .status(500)
      .json({ message: "Error fetching barscreen predictions" });
  }
};

/**
 * Returns the cached final standings from the most recently completed trivia
 * game today. Used by the bar screen on cold start so the LEFT column can
 * show "LAST GAME" without waiting for the next game to finish.
 */
export const getLastGameLeaderboard = async (_req: Request, res: Response) => {
  const data = triviaManagerRef?.getLastGameLeaderboard() ?? {
    gameId: null,
    finishedAt: null,
    leaderboard: [],
  };

  return res.status(200).json({
    message: "OK",
    data,
  });
};
