import { Router } from "express";
import { getToday } from "../services/generalService";
import {
  createProfile,
  fetchProfiles,
  updateProfile,
  deleteProfile,
  updateGeneralGames,
  updateMobileGameStatus,
  fetchGamesForMobileGame,
  fetchGameCategories,
  fetchFeaturedGames,
  saveFeaturedGames,
  resetPassword,
} from "../controllers/manageController";

const router = Router();

router.get("/get-today", async (_req, res) => {
  const today = getToday();
  return res.status(200).json({ today });
});

router.post("/create-profile", createProfile);
router.post("/fetch-profiles", fetchProfiles);
router.post("/update-profile", updateProfile);
router.post("/delete-profile", deleteProfile);
router.post("/update-general-games", updateGeneralGames);
router.post("/mobile/update-status", updateMobileGameStatus);
router.get("/mobile/fetch-games", fetchGamesForMobileGame);
router.get("/fetch-game-categories", fetchGameCategories);
router.get("/featured-games", fetchFeaturedGames);
router.post("/featured-games/save", saveFeaturedGames);
router.post("/reset-password", resetPassword);

export default router;
