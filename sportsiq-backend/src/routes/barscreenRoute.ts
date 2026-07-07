import { Router } from "express";
import {
  getBarScreenState,
  getLastGameLeaderboard,
  getBarscreenPredictionsHandler,
} from "../controllers/barscreenController";

const router = Router();

router.get("/state", getBarScreenState);
router.get("/last-game-leaderboard", getLastGameLeaderboard);
router.get("/featured-predictions", getBarscreenPredictionsHandler);

export default router;
