import { Request, Response } from "express";
import { CreateBingoRequest, CreatePredictorRequest } from "../types";
import {
  createPredictor as createPredictorService,
  createBingo as createBingoService,
  fetchUpcomingContestToday as fetchUpcomingContestTodayService,
  fetchBingoForPreGame as fetchContestBingoForPreGameService,
  getBingoCards as getBingoCardsService,
  fetchGameInfoByBingoID as fetchGameInfoByBingoIDService,
  createUserForBingo as createUserForBingoService,
  createUserForPredictor as createContestUserForPredictorService,
  getAnotherBingoCard as getAnotherContestBingoCardService,
  fetchUpcomingGames as fetchUpcomingGamesService,
  updateEnabledStatus as updateEnabledStatusService,
  fetchBingoCategorySettings as fetchBingoCategorySettingsService,
  fetchPredictorCategorySettings as fetchPredictorCategorySettingsService,
  updateContestType as updateContestTypeService,
  fetchBingoForLiveGame as fetchBingoForLiveGameService,
  fetchWinnerWithGame as fetchContestWinnerWithGameService,
  redeemWinner as redeemContestWinnerService,
  upsertDefaultContestPrizes as upsertDefaultContestPrizesService,
  upsertDefaultContestPoints as upsertDefaultContestPointsService,
  fetchDefaultContestPrizesAndPoints as fetchDefaultContestPrizesAndPointsService,
  updateDefaultContestPrizesEnabled as updateDefaultContestPrizesEnabledService,
  updateDefaultContestPointsEnabled as updateDefaultContestPointsEnabledService,
  fetchDefaultContestPointsSportsIQ as fetchDefaultContestPointsSportsIQService,
  upsertDefaultContestPointsSportsIQ as upsertDefaultContestPointsSportsIQService,
  fetchPredictorForPreGame as fetchContestPredictorForPreGameService,
  fetchPredictorForLiveGame as fetchContestPredictorForLiveGameService,
  fetchPredictorInfoByID as fetchPredictorInfoByIDService,
  registerPredictions as registerPredictionsService,
  fetchLatestPredictorCategorySettings as fetchLatestPredictorCategorySettingsService,
  fetchLatestBingoCategorySettings as fetchLatestBingoCategorySettingsService,
  getSportsiqPoints as getSportsiqPointsService,
  getBarPoints as getBarPointsService,
  retrievePredictions as retrievePredictionsService,
} from "../services/contestService";

export const createPredictor = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const request: CreatePredictorRequest = req.body;

    if (!request.upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }
    if (!request.settings || request.settings.length === 0) {
      return res.status(400).json({ error: "Settings are required" });
    }

    const data = await createPredictorService(request);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating predictor",
      error: error,
    });
  }
};

export const createBingo = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const request: CreateBingoRequest = req.body;

    if (!request.upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }
    if (!request.groups || request.groups.length === 0) {
      return res.status(400).json({ error: "Groups are required" });
    }

    const data = await createBingoService(request);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating bingo",
      error: error,
    });
  }
};

export const fetchUpcomingForToday = async (req: Request, res: Response) => {
  try {
    const upcomingContestToday = await fetchUpcomingContestTodayService();
    return res.status(200).json({
      message: "Upcoming contests today fetched successfully",
      data: upcomingContestToday,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching upcoming contests today",
      error: error,
    });
  }
};

export const fetchBingoForPreGame = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { abstract_contest_id, profile_id } = req.body;

    if (!abstract_contest_id) {
      return res.status(400).json({ error: "Abstract contest ID is required" });
    }
    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const contestBingo = await fetchContestBingoForPreGameService(
      abstract_contest_id,
      profile_id
    );

    return res.status(200).json({
      message: "Contest bingo for pre-game fetched successfully",
      data: contestBingo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest bingo for pre-game",
      error: error,
    });
  }
};

export const getBingoCards = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { contest_bingo_id, contest_user_id } = req.body;

    if (!contest_bingo_id) {
      return res.status(400).json({ error: "Contest bingo ID is required" });
    }
    if (contest_user_id === undefined || contest_user_id === null) {
      return res.status(400).json({ error: "Contest user ID is required" });
    }

    const contestBingoCards = await getBingoCardsService(
      contest_bingo_id,
      contest_user_id
    );

    return res.status(200).json({
      message: "Contest bingo cards fetched successfully",
      data: contestBingoCards,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting contest bingo cards",
      error: error,
    });
  }
};

export const fetchGameInfoByBingoID = async (req: Request, res: Response) => {
  try {
    if (!req.query) {
      return res.status(400).json({ error: "ID query parameter is required" });
    }

    const bingo_id = req.query.id as string;

    if (!bingo_id) {
      return res.status(400).json({ error: "Bingo ID is required" });
    }

    const gameInfo = await fetchGameInfoByBingoIDService(bingo_id);

    return res.status(200).json({
      message: "Game info fetched successfully",
      data: gameInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching game info by bingo ID",
      error: error,
    });
  }
};

export const createUserForBingo = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const { contest_bingo_id, phone, nickname } = req.body;

    if (!contest_bingo_id) {
      return res.status(400).json({ error: "Contest bingo ID is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!nickname) {
      return res.status(400).json({ error: "Nickname is required" });
    }

    const contestUser = await createUserForBingoService(
      contest_bingo_id,
      phone,
      nickname
    );

    return res.status(200).json({
      message: "Contest user created successfully",
      data: contestUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating contest user for bingo",
      error: error,
    });
  }
};

export const createUserForPredictor = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const { contest_predictor_id, phone, nickname } = req.body;

    if (!contest_predictor_id) {
      return res
        .status(400)
        .json({ error: "Contest predictor ID is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!nickname) {
      return res.status(400).json({ error: "Nickname is required" });
    }

    const contestUser = await createContestUserForPredictorService(
      contest_predictor_id,
      phone,
      nickname
    );

    return res.status(200).json({
      message: "Contest user for predictor created successfully",
      data: contestUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating contest user for predictor",
      error: error,
    });
  }
};

export const getAnotherBingoCard = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { contest_bingo_card_id } = req.body;

    if (!contest_bingo_card_id) {
      return res
        .status(400)
        .json({ error: "Contest bingo card ID is required" });
    }

    const anotherContestBingoCard = await getAnotherContestBingoCardService(
      contest_bingo_card_id
    );

    return res.status(200).json({
      message: "Another contest bingo card fetched successfully",
      data: anotherContestBingoCard,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting another contest bingo card",
      error: error,
    });
  }
};

export const fetchUpcomingGames = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { game_type, day } = req.body;

    if (!game_type) {
      return res.status(400).json({ error: "Game type is required" });
    }
    if (!day) {
      return res.status(400).json({ error: "Day is required" });
    }

    const upcomingGamesWithContestStatus = await fetchUpcomingGamesService(
      game_type,
      day
    );

    return res.status(200).json({
      message: "Upcoming games with contest status fetched successfully",
      data: upcomingGamesWithContestStatus,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching upcoming games with contest status",
      error: error,
    });
  }
};

export const updateEnabledStatus = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid, enabled } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }
    if (enabled === undefined) {
      return res.status(400).json({ error: "Enabled is required" });
    }

    const contestEnabledStatus = await updateEnabledStatusService(
      upcoming_game_uuid,
      enabled
    );

    return res.status(200).json({
      message: "Contest enabled status updated successfully",
      data: contestEnabledStatus,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating contest enabled status",
      error: error,
    });
  }
};

export const fetchBingoCategorySettings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }

    const bingoCategorySettings = await fetchBingoCategorySettingsService(
      upcoming_game_uuid
    );

    return res.status(200).json({
      message: "Contest bingo category settings fetched successfully",
      data: bingoCategorySettings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest bingo category settings",
      error: error,
    });
  }
};

export const fetchPredictorCategorySettings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }

    const contestPredictorCategorySettings =
      await fetchPredictorCategorySettingsService({ upcoming_game_uuid });

    return res.status(200).json({
      message: "Contest predictor category settings fetched successfully",
      data: contestPredictorCategorySettings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest predictor category settings",
      error: error,
    });
  }
};

export const fetchLatestPredictorCategorySettings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }

    const latestPredictorCategorySettings =
      await fetchLatestPredictorCategorySettingsService({ upcoming_game_uuid });

    return res.status(200).json({
      message:
        "Latest contest predictor category settings fetched successfully",
      data: latestPredictorCategorySettings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching latest contest predictor category settings",
      error: error,
    });
  }
};

export const fetchLatestBingoCategorySettings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }

    const latestBingoCategorySettings =
      await fetchLatestBingoCategorySettingsService(upcoming_game_uuid);

    return res.status(200).json({
      message: "Latest contest bingo category settings fetched successfully",
      data: latestBingoCategorySettings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching latest contest bingo category settings",
      error: error,
    });
  }
};

export const updateType = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { upcoming_game_uuid, type } = req.body;

    if (!upcoming_game_uuid) {
      return res.status(400).json({ error: "Upcoming game UUID is required" });
    }
    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    const contestType = await updateContestTypeService(
      upcoming_game_uuid,
      type
    );

    return res.status(200).json({
      message: "Contest type updated successfully",
      data: contestType,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating contest type",
      error: error,
    });
  }
};

export const fetchBingoForLiveGame = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { abstract_contest_id, profile_id } = req.body;

    if (!abstract_contest_id) {
      return res.status(400).json({ error: "Abstract contest ID is required" });
    }
    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const bingo = await fetchBingoForLiveGameService(
      abstract_contest_id,
      profile_id
    );

    return res.status(200).json({
      message: "Contest bingo for live game fetched successfully",
      data: bingo,
    });
  } catch (error) {
    console.error("Error fetching contest bingo for live game:", error);
    return res.status(500).json({
      message: "Error fetching contest bingo for live game",
      error: error,
    });
  }
};

export const fetchWinnerWithGame = async (req: Request, res: Response) => {
  try {
    if (!req.query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const winner_id = req.query.winner_id as string;

    if (!winner_id) {
      return res.status(400).json({ error: "Winner ID is required" });
    }

    const contestWinnerWithGame = await fetchContestWinnerWithGameService(
      winner_id
    );

    if (!contestWinnerWithGame) {
      return res
        .status(400)
        .json({ error: "Contest winner with game not found" });
    }

    return res.status(200).json({
      message: "Contest winner with game fetched successfully",
      data: contestWinnerWithGame,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest winner with game",
      error: error,
    });
  }
};

export const redeemContestWinner = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { winner_id } = req.body;

    if (!winner_id) {
      return res.status(400).json({ error: "Winner ID is required" });
    }

    const redeemed = await redeemContestWinnerService(winner_id);

    return res.status(200).json({
      message: "Contest winner redeemed successfully",
      data: redeemed,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error redeeming contest winner",
      error: error,
    });
  }
};

export const upsertDefaultPrizes = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id, prizes } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }
    if (!prizes) {
      return res.status(400).json({ error: "Prizes are required" });
    }

    const defaultContestPrizes = await upsertDefaultContestPrizesService(
      profile_id,
      prizes
    );

    return res.status(200).json({
      message: "Default contest prizes upserted successfully",
      data: defaultContestPrizes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error upserting default contest prizes",
      error: error,
    });
  }
};

export const upsertDefaultPoints = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id, points } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }
    if (!points) {
      return res.status(400).json({ error: "Points are required" });
    }

    const defaultContestPoints = await upsertDefaultContestPointsService(
      profile_id,
      points
    );

    return res.status(200).json({
      message: "Default contest points upserted successfully",
      data: defaultContestPoints,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error upserting default contest points",
      error: error,
    });
  }
};

export const fetchDefaultPrizesAndPoints = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const defaultContestPrizesAndPoints =
      await fetchDefaultContestPrizesAndPointsService(profile_id);

    if (!defaultContestPrizesAndPoints) {
      return res.status(404).json({
        message: "Default contest prizes and points not found",
      });
    }

    return res.status(200).json({
      message: "Default contest prizes and points fetched successfully",
      data: defaultContestPrizesAndPoints,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching default contest prizes and points",
      error: error,
    });
  }
};

export const updateDefaultPrizesEnabled = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id, enabled } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }
    if (enabled === undefined) {
      return res.status(400).json({ error: "Enabled is required" });
    }

    const enabledStatus = await updateDefaultContestPrizesEnabledService(
      profile_id,
      enabled
    );

    return res.status(200).json({
      message: "Default contest prizes enabled status updated successfully",
      data: enabledStatus,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating default contest prizes enabled status",
      error: error,
    });
  }
};

export const updateDefaultPointsEnabled = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id, enabled } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }
    if (enabled === undefined) {
      return res.status(400).json({ error: "Enabled is required" });
    }

    const enabledStatus = await updateDefaultContestPointsEnabledService(
      profile_id,
      enabled
    );

    return res.status(200).json({
      message: "Default contest points enabled status updated successfully",
      data: enabledStatus,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating default contest points enabled status",
      error: error,
    });
  }
};

export const fetchDefaultPointsSportsIQ = async (
  req: Request,
  res: Response
) => {
  try {
    const defaultContestPoints =
      await fetchDefaultContestPointsSportsIQService();

    if (!defaultContestPoints) {
      return res.status(404).json({
        message: "Default contest points sportsiq not found",
      });
    }

    return res.status(200).json({
      message: "Default contest points sportsiq fetched successfully",
      data: defaultContestPoints,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching default contest points sportsiq",
      error: error,
    });
  }
};

export const upsertDefaultPointsSportsIQ = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { profile_id, points } = req.body;

    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    } else if (!points) {
      return res.status(400).json({ error: "Points are required" });
    }

    const upsertedStatus = await upsertDefaultContestPointsSportsIQService(
      profile_id,
      points
    );

    return res.status(200).json({
      message: "Default contest points sportsiq upserted successfully",
      data: upsertedStatus,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error upserting default contest points sportsiq",
      error: error,
    });
  }
};

export const fetchPredictorForPreGame = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { abstract_contest_id, profile_id } = req.body;

    if (!abstract_contest_id) {
      return res.status(400).json({ error: "Abstract contest ID is required" });
    }
    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const contestPredictor = await fetchContestPredictorForPreGameService(
      abstract_contest_id,
      profile_id
    );

    return res.status(200).json({
      message: "Contest predictor for pre-game fetched successfully",
      data: contestPredictor,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest predictor for pre-game",
      error: error,
    });
  }
};

export const fetchPredictorForLiveGame = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { abstract_contest_id, profile_id } = req.body;

    if (!abstract_contest_id) {
      return res.status(400).json({ error: "Abstract contest ID is required" });
    }
    if (!profile_id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    const contestPredictor = await fetchContestPredictorForLiveGameService(
      abstract_contest_id,
      profile_id
    );

    return res.status(200).json({
      message: "Contest predictor for live game fetched successfully",
      data: contestPredictor,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching contest predictor for live game",
      error: error,
    });
  }
};

export const fetchPredictorInfoByID = async (req: Request, res: Response) => {
  try {
    if (!req.query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const predictor_id = req.query.id as string;

    if (!predictor_id) {
      return res.status(400).json({ error: "Predictor ID is required" });
    }

    const predictorInfo = await fetchPredictorInfoByIDService(predictor_id);

    return res.status(200).json({
      message: "Predictor info fetched successfully",
      data: predictorInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching predictor info by ID",
      error: error,
    });
  }
};

export const registerPredictions = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { contest_predictor_id, contest_user_id, predictions } = req.body;

    if (!contest_predictor_id) {
      return res
        .status(400)
        .json({ error: "Contest predictor ID is required" });
    }
    if (!contest_user_id) {
      return res.status(400).json({ error: "Contest user ID is required" });
    }
    if (!predictions) {
      return res.status(400).json({ error: "Predictions are required" });
    }

    const registered = await registerPredictionsService(
      contest_predictor_id,
      contest_user_id,
      predictions
    );

    return res.status(200).json({
      message: "Predictions registered successfully",
      data: registered,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error registering predictions",
      error: error,
    });
  }
};

export const fetchSportsiqPoints = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { contest_user_id } = req.body;

    if (!contest_user_id) {
      return res.status(400).json({ error: "Contest user ID is required" });
    }

    const sportsiqPoints = await getSportsiqPointsService(contest_user_id);

    return res.status(200).json({
      message: "Sportsiq points fetched successfully",
      data: sportsiqPoints,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching sportsiq points",
      error: error,
    });
  }
};

export const fetchBarPoints = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { contest_user_id, id, type } = req.body;

    if (!contest_user_id) {
      return res.status(400).json({ error: "Contest user ID is required" });
    } else if (!id) {
      return res.status(400).json({
        error: "ID is required",
      });
    } else if (!type) {
      return res.status(400).json({ error: "Type is required" });
    } else if (type !== "bingo" && type !== "predictor") {
      return res
        .status(400)
        .json({ error: "Type must be either 'bingo' or 'predictor'" });
    }

    const barPoints = await getBarPointsService(contest_user_id, id, type);

    return res.status(200).json({
      message: "Bar points fetched successfully",
      data: barPoints,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching bar points",
      error: error,
    });
  }
};

export const retrievePredictions = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { predictor_id, user_id } = req.body;

    if (!predictor_id) {
      return res.status(400).json({ error: "Predictor ID is required" });
    } else if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const predictions = await retrievePredictionsService(predictor_id, user_id);

    return res.status(200).json({
      message: "Predictions retrieved successfully",
      data: predictions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving predictions",
      error: error,
    });
  }
};
