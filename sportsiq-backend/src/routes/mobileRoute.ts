import { Router } from "express";
import multer from "multer";
import {
  signUpUser,
  signInUser,
  updateUser,
  deleteAccount,
  uploadAvatar,
  updateTriviaPoints,
  transferPoints,
  fetchUserTier,
} from "../controllers/mobileController";
import {
  fetchFeaturedGame,
  fetchFeaturedPredictions,
  submitUserPick,
  resolveGamePicks,
  fetchGlobalLeaderboard,
  fetchBarLeaderboard,
  fetchUserStats,
  fetchTodayLeaderboard,
} from "../controllers/picksController";

const router = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post("/user/create", signUpUser);
router.post("/user/fetch", signInUser);
router.post("/user/update", updateUser);
router.post("/user/delete", deleteAccount);
router.post("/user/upload-avatar", avatarUpload.single("avatar"), uploadAvatar);
router.post("/trivia/update-points", updateTriviaPoints);
router.get("/user/tier", fetchUserTier);
router.get("/user/stats", fetchUserStats);
router.post("/user/transfer-points", transferPoints);

// Picks flow (Phase 4)
router.get("/picks/featured-game", fetchFeaturedGame);
router.get("/picks/featured-predictions", fetchFeaturedPredictions);
router.post("/picks/submit", submitUserPick);
router.post("/picks/resolve", resolveGamePicks);

// Leaderboard (Phase 4)
router.get("/leaderboard/global", fetchGlobalLeaderboard);
router.get("/leaderboard/bar", fetchBarLeaderboard);
router.get("/leaderboard/today", fetchTodayLeaderboard);

export default router;
