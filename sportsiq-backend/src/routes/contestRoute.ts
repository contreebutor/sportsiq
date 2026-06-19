import { Router } from "express";

import {
  createPredictor,
  createBingo,
  fetchUpcomingForToday,
  fetchBingoForPreGame,
  getBingoCards,
  fetchGameInfoByBingoID,
  createUserForBingo,
  createUserForPredictor,
  getAnotherBingoCard,
  fetchUpcomingGames,
  updateEnabledStatus,
  fetchBingoCategorySettings,
  fetchPredictorCategorySettings,
  updateType,
  fetchBingoForLiveGame,
  fetchWinnerWithGame,
  redeemContestWinner,
  upsertDefaultPrizes,
  upsertDefaultPoints,
  fetchDefaultPrizesAndPoints,
  updateDefaultPrizesEnabled,
  updateDefaultPointsEnabled,
  fetchDefaultPointsSportsIQ,
  upsertDefaultPointsSportsIQ,
  fetchPredictorForPreGame,
  fetchPredictorForLiveGame,
  fetchPredictorInfoByID,
  registerPredictions,
  fetchLatestPredictorCategorySettings,
  fetchLatestBingoCategorySettings,
  fetchSportsiqPoints,
  retrievePredictions,
  fetchBarPoints,
} from "../controllers/contestController";

const router = Router();

router.post("/create-predictor", createPredictor);
router.post("/create-bingo", createBingo);
router.get("/fetch-upcoming-for-today", fetchUpcomingForToday);

/**
 * Routes for the contest bingo dashboard - pregame/live game
 */
router.post("/fetch-predictor-for-pre-game", fetchPredictorForPreGame);
router.post("/fetch-predictor-for-live-game", fetchPredictorForLiveGame);
router.post("/fetch-bingo-for-pre-game", fetchBingoForPreGame);
router.post("/fetch-bingo-for-live-game", fetchBingoForLiveGame);

/**
 * Routes for the contest submission page
 */
router.get("/fetch-game-info-by-bingo-id", fetchGameInfoByBingoID);
router.post("/create-user-for-bingo", createUserForBingo);
router.post("/create-user-for-predictor", createUserForPredictor);
router.post("/get-bingo-cards", getBingoCards);
router.post("/get-another-bingo-card", getAnotherBingoCard);
router.get("/fetch-predictor-info-by-id", fetchPredictorInfoByID);
router.post("/register-predictions", registerPredictions);
router.post("/retrieve-predictions", retrievePredictions);

/**
 * Routes for the contest management page
 */
router.post("/fetch-upcoming-games", fetchUpcomingGames);
router.post("/update-enabled-status", updateEnabledStatus);
router.post("/update-type", updateType);
router.post("/fetch-bingo-category-settings", fetchBingoCategorySettings);
router.post(
  "/fetch-predictor-category-settings",
  fetchPredictorCategorySettings
);
router.post(
  "/fetch-latest-predictor-category-settings",
  fetchLatestPredictorCategorySettings
);
router.post(
  "/fetch-latest-bingo-category-settings",
  fetchLatestBingoCategorySettings
);

/**
 * Routes for the contest winner page
 */
router.get("/fetch-winner-with-game", fetchWinnerWithGame);
router.post("/redeem-winner", redeemContestWinner);

/**
 * Routes for the contest prizes page
 */
router.post("/upsert-default-prizes", upsertDefaultPrizes);
router.post("/upsert-default-points", upsertDefaultPoints);
router.post("/fetch-default-prizes-and-points", fetchDefaultPrizesAndPoints);
router.post("/update-default-prizes-enabled", updateDefaultPrizesEnabled);
router.post("/update-default-points-enabled", updateDefaultPointsEnabled);

/**
 * Routes for the contest points page
 */
router.get("/fetch-default-sportsiq-points", fetchDefaultPointsSportsIQ);
router.post("/upsert-default-sportsiq-points", upsertDefaultPointsSportsIQ);

/**
 * Route to fetch points
 */
router.post("/fetch-sportsiq-points", fetchSportsiqPoints);
router.post("/fetch-bar-points", fetchBarPoints);

export default router;
