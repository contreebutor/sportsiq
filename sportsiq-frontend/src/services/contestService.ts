import {
  ContestBingoForLiveGame,
  ContestBingoForPreGame,
  ContestPredictorForLiveGame,
  ContestPredictorForPreGame,
  ContestWinnerJson,
  CreateContestBingoRequest,
  CreateContestPredictorRequest,
  FetchContestBingoCategorySetting,
  FetchContestPredictorCategorySettingsResponse,
  FetchPredictorInfoResponse,
  GetContestBingoCardsResponse,
  GetGameInfoByContestBingoIDResponse,
  GetUpcomingGameWithContestStatusResponse,
  RetrievePredictionsResponse,
} from "../types/contests";
import { ContestForToday } from "../types/general";

export const createContestPredictor = async (
  request: CreateContestPredictorRequest
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/create-predictor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upcoming_game_uuid: request.upcomingGameUUID,
          settings: request.settings,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create contest predictor");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating contest predictor:", error);
    throw new Error("Failed to create contest predictor: " + error.message);
  }
};

export const createContestBingo = async (
  request: CreateContestBingoRequest
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/create-bingo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upcoming_game_uuid: request.upcomingGameUUID,
          groups: request.groups,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create contest bingo");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating contest bingo:", error);
    throw new Error("Failed to create contest bingo: " + error.message);
  }
};

export const fetchUpcomingContestForToday =
  async (): Promise<ContestForToday> => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/v1/contest/fetch-upcoming-for-today`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch upcoming contest for today");
      }

      const data = await response.json();
      return data.data as ContestForToday;
    } catch (error) {
      console.error("Error fetching upcoming contest for today:", error);
      throw new Error(
        "Failed to fetch upcoming contest for today: " + error.message
      );
    }
  };

export const fetchContestBingoForPreGame = async (
  abstractContestID: string,
  profileID: string
): Promise<ContestBingoForPreGame | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/fetch-bingo-for-pre-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstract_contest_id: abstractContestID,
          profile_id: profileID,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as ContestBingoForPreGame;
  } catch (error) {
    console.error("Error fetching contest bingo for pre game:", error);
    return null;
  }
};

export const fetchContestBingoForLiveGame = async (
  abstractContestID: string,
  profileID: string
): Promise<ContestBingoForLiveGame | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-bingo-for-live-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstract_contest_id: abstractContestID,
          profile_id: profileID,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as ContestBingoForLiveGame;
  } catch (error) {
    console.error("Error fetching contest bingo for live game:", error);
    return null;
  }
};

export const fetchContestPredictorForPreGame = async (
  abstractContestID: string,
  profileID: string
): Promise<ContestPredictorForPreGame | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-predictor-for-pre-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstract_contest_id: abstractContestID,
          profile_id: profileID,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as ContestPredictorForPreGame;
  } catch (error) {
    console.error("Error fetching contest predictor for pre game:", error);
    return null;
  }
};

export const getGameInfoByContestBingoID = async (
  contestBingoID: string
): Promise<GetGameInfoByContestBingoIDResponse> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-game-info-by-bingo-id?id=${contestBingoID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as GetGameInfoByContestBingoIDResponse;
  } catch (error) {
    console.error("Error getting game info by contest bingo ID:", error);
    return null;
  }
};

export const createContestUserByBingoID = async (
  contestBingoID: string,
  phone: string,
  nickname: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/create-user-for-bingo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_bingo_id: contestBingoID,
          phone,
          nickname,
        }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data.contest_user_id;
  } catch (error) {
    console.error("Error creating contest user:", error);
    return null;
  }
};

export const createContestUserByPredictorID = async (
  contestPredictorID: string,
  phone: string,
  nickname: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/create-user-for-predictor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_predictor_id: contestPredictorID,
          phone,
          nickname,
        }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data.contest_user_id;
  } catch (error) {
    console.error("Error creating contest user:", error);
    return null;
  }
};

export const getContestBingoCards = async (
  contestBingoID: string,
  contestUserID: string
): Promise<GetContestBingoCardsResponse[] | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/get-bingo-cards`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_bingo_id: contestBingoID,
          contest_user_id: contestUserID,
        }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as GetContestBingoCardsResponse[];
  } catch (error) {
    console.error("Error getting contest bingo cards:", error);
    return null;
  }
};

export const getAnotherCard = async (
  contestBingoCardID: string
): Promise<GetContestBingoCardsResponse | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/get-another-bingo-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_bingo_card_id: contestBingoCardID,
        }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as GetContestBingoCardsResponse;
  } catch (error) {
    console.error("Error getting another card:", error);
    return null;
  }
};

export const fetchUpcomingGamesWithContestStatus = async (
  gameType: string,
  day: string
): Promise<GetUpcomingGameWithContestStatusResponse[] | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/fetch-upcoming-games`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_type: gameType, day }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as GetUpcomingGameWithContestStatusResponse[];
  } catch (error) {
    console.error("Error fetching upcoming games with contest status:", error);
    return null;
  }
};

export const updateContestEnabledStatus = async (
  upcomingGameUUID: string,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/update-enabled-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upcoming_game_uuid: upcomingGameUUID,
          enabled,
        }),
      }
    );
    if (!response.ok) {
      console.error("Error updating contest enabled:", response.statusText);
    }
  } catch (error) {
    console.error("Error updating contest enabled:", error);
  }
};

export const fetchContestBingoCategorySettings = async (
  upcomingGameUUID: string
): Promise<FetchContestBingoCategorySetting[] | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-bingo-category-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upcoming_game_uuid: upcomingGameUUID }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as FetchContestBingoCategorySetting[];
  } catch (error) {
    console.error("Error fetching contest category settings:", error);
    return null;
  }
};

export const fetchContestPredictorCategorySettings = async (
  upcomingGameUUID: string
): Promise<FetchContestPredictorCategorySettingsResponse[] | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-predictor-category-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upcoming_game_uuid: upcomingGameUUID }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as FetchContestPredictorCategorySettingsResponse[];
  } catch (error) {
    console.error("Error fetching contest predictor category settings:", error);
    return null;
  }
};

export const updateContestType = async (
  upcomingGameUUID: string,
  type: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/update-type`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upcoming_game_uuid: upcomingGameUUID, type }),
      }
    );
    if (!response.ok) {
      console.error("Error updating contest type:", response.statusText);
    }
  } catch (error) {
    console.error("Error updating contest type:", error);
  }
};

export const fetchContestWinnerByID = async (
  contestWinnerID: string
): Promise<ContestWinnerJson> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-winner-with-game?winner_id=${contestWinnerID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch contest winner by ID");
    }

    const data = await response.json();
    return data.data as ContestWinnerJson;
  } catch (error) {
    console.error("Error fetching contest winner by ID:", error);
    throw new Error("Failed to fetch contest winner by ID: " + error.message);
  }
};

export const updateContestRedeemed = async (
  contestWinnerID: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/redeem-winner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winner_id: contestWinnerID }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update contest redeemed");
    }
  } catch (error) {
    console.error("Error updating contest redeemed:", error);
    throw new Error("Failed to update contest redeemed: " + error.message);
  }
};

export interface FetchDefaultContestPrizesResponse {
  prizes: Record<string, string> | null;
  points: Record<string, number>;
  prizes_enabled: boolean;
  points_enabled: boolean;
}

export const fetchDefaultContestPrizes = async (
  profileID: string
): Promise<FetchDefaultContestPrizesResponse> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-default-prizes-and-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile_id: profileID }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch default contest prizes");
    }

    const data = await response.json();
    return data.data as FetchDefaultContestPrizesResponse;
  } catch (error) {
    console.error("Error fetching default contest prizes:", error);
    throw new Error("Failed to fetch default contest prizes: " + error.message);
  }
};

export const upsertDefaultContestPrizes = async (
  profileID: string,
  prizes: Record<string, string | null>,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/upsert-default-prizes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileID,
          prizes,
          enabled,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upsert default contest prizes");
    }
  } catch (error) {
    console.error("Error upserting default contest prizes:", error);
    throw new Error(
      "Failed to upsert default contest prizes: " + error.message
    );
  }
};

export const updateDefaultContestPrizesEnabled = async (
  profileID: string,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/update-default-prizes-enabled`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileID,
          enabled,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update default contest prizes enabled status");
    }
  } catch (error) {
    console.error(
      "Error updating default contest prizes enabled status:",
      error
    );
    throw new Error(
      "Failed to update default contest prizes enabled status: " + error.message
    );
  }
};

export const upsertDefaultContestPoints = async (
  profileID: string,
  points: Record<string, number>,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/upsert-default-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileID,
          points,
          enabled,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upsert default contest points");
    }
  } catch (error) {
    console.error("Error upserting default contest points:", error);
    throw new Error(
      "Failed to upsert default contest points: " + error.message
    );
  }
};

export const updateDefaultContestPointsEnabled = async (
  profileID: string,
  enabled: boolean
): Promise<void> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/update-default-points-enabled`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileID,
          enabled,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update default contest points enabled status");
    }
  } catch (error) {
    console.error(
      "Error updating default contest points enabled status:",
      error
    );
    throw new Error(
      "Failed to update default contest points enabled status: " + error.message
    );
  }
};

export const fetchDefaultContestSportsIQPoints = async (): Promise<
  Record<string, number>
> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-default-sportsiq-points`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch default contest sports IQ points");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching default contest sports IQ points:", error);
    throw new Error(
      "Failed to fetch default contest sports IQ points: " + error.message
    );
  }
};

export const upsertDefaultContestSportsIQPoints = async (
  profileID: string,
  points: Record<string, number>
): Promise<void> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/upsert-default-sportsiq-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileID,
          points,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upsert default contest sports IQ points");
    }
  } catch (error) {
    console.error("Error upserting default contest sports IQ points:", error);
    throw new Error(
      "Failed to upsert default contest sports IQ points: " + error.message
    );
  }
};

export const fetchPredictorInfoByID = async (
  id: string
): Promise<FetchPredictorInfoResponse | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-predictor-info-by-id?id=${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as FetchPredictorInfoResponse;
  } catch (error) {
    console.error("Error getting game info by contest bingo ID:", error);
    return null;
  }
};

export const registerPredictions = async (
  contestPredictorID: string,
  contestUserID: string,
  predictions: {
    quarter: string;
    predictions: string[];
  }[]
): Promise<void> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/register-predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_predictor_id: contestPredictorID,
          contest_user_id: contestUserID,
          predictions,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to register predictions");
    }
  } catch (error) {
    console.error("Error registering predictions:", error);
    throw new Error("Failed to register predictions: " + error.message);
  }
};

export const fetchContestPredictorForLiveGame = async (
  abstractContestID: string,
  profileID: string
): Promise<ContestPredictorForLiveGame | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-predictor-for-live-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstract_contest_id: abstractContestID,
          profile_id: profileID,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as ContestPredictorForLiveGame;
  } catch (error) {
    console.error("Error fetching contest predictor for live game:", error);
    return null;
  }
};

export const fetchLatestContestPredictorCategorySettings = async (
  upcomingGameUUID: string
): Promise<FetchContestPredictorCategorySettingsResponse[] | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-latest-predictor-category-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upcoming_game_uuid: upcomingGameUUID }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as FetchContestPredictorCategorySettingsResponse[];
  } catch (error) {
    console.error("Error fetching contest predictor category settings:", error);
    return null;
  }
};

export const fetchLatestContestBingoCategorySettings = async (
  upcomingGameUUID: string
): Promise<FetchContestBingoCategorySetting[] | null> => {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/v1/contest/fetch-latest-bingo-category-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upcoming_game_uuid: upcomingGameUUID }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.data as FetchContestBingoCategorySetting[];
  } catch (error) {
    console.error("Error fetching contest bingo category settings:", error);
    return null;
  }
};

export const retrievePredictions = async (
  contestPredictorID: string,
  contestUserID: string
): Promise<RetrievePredictionsResponse[] | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/retrieve-predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictor_id: contestPredictorID,
          user_id: contestUserID,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data as RetrievePredictionsResponse[];
  } catch (error) {
    console.error("Error retrieving predictions:", error);
    return null;
  }
};

export const fetchSportsIQPoints = async (
  contestUserID: string
): Promise<number> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/fetch-sportsiq-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_user_id: contestUserID,
        }),
      }
    );
    if (!response.ok) {
      return 0;
    }
    const data = await response.json();
    const val = data.data;
    return (typeof val === "object" && val !== null ? val.points ?? 0 : val ?? 0) as number;
  } catch (error) {
    console.error("Error fetching sports IQ points:", error);
    return 0;
  }
};

export const fetchBarPoints = async (
  contestUserID: string,
  id: string,
  type: "bingo" | "predictor"
): Promise<number> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/contest/fetch-bar-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_user_id: contestUserID,
          id: id,
          type: type,
        }),
      }
    );
    if (!response.ok) {
      return 0;
    }
    const data = await response.json();
    const val = data.data;
    return (typeof val === "object" && val !== null ? val.points ?? 0 : val ?? 0) as number;
  } catch (error) {
    console.error("Error fetching bar points:", error);
    return 0;
  }
};
