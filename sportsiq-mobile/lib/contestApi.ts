import { config } from "@/config";

const API_BASE_URL = config.apiBaseUrl;

// ── Types ────────────────────────────────────────────────

export type GameStatus = "Scheduled" | "InProgress" | "Final" | "F/OT";
export type GameQuarter =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "HALF"
  | "OT"
  | "F"
  | "F/OT"
  | null;
export type GameType = "nba" | "nfl" | "nhl" | "cbb" | "mlb";
export type Quarter = "1" | "2" | "3" | "4" | "full";

export interface FetchPredictorInfoResponse {
  game: {
    day: string;
    date_time: string;
    home_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
    away_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
  };
  titles: {
    [key: string]: {
      quarter: string;
      prize: string;
    };
  };
  settings: {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[];
}

export interface GetGameInfoByContestBingoIDResponse {
  game_type: GameType;
  status: GameStatus;
  date_time: string;
  home_team_key: string;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;
  away_team_key: string;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;
  quarter: GameQuarter | null;
  time_remaining_minutes: number | null;
  time_remaining_seconds: number | null;
}

export interface BingoCardSquareProps {
  team_key: string;
  description: string;
  completed: boolean;
  done: number;
  total: number;
  points: number;
}

export interface GetContestBingoCardsResponse {
  id: string;
  quarter: Quarter;
  squares: {
    1: BingoCardSquareProps;
    2: BingoCardSquareProps;
    3: BingoCardSquareProps;
    4: BingoCardSquareProps;
    5: BingoCardSquareProps;
    6: BingoCardSquareProps;
    7: BingoCardSquareProps;
    8: BingoCardSquareProps;
    9: BingoCardSquareProps;
  };
  retryable: boolean;
}

export interface RetrievePredictionsResponse {
  quarter: string;
  predictions: string[];
}

// ── Predictor API ────────────────────────────────────────

export const fetchPredictorInfoByID = async (
  id: string
): Promise<FetchPredictorInfoResponse | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/contest/fetch-predictor-info-by-id?id=${encodeURIComponent(id)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as FetchPredictorInfoResponse;
  } catch (error) {
    console.error("Error fetching predictor info:", error);
    return null;
  }
};

export const createContestUserByPredictorID = async (
  contestPredictorID: string,
  phone: string,
  nickname: string
): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/create-user-for-predictor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contest_predictor_id: contestPredictorID,
        phone,
        nickname,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.contest_user_id;
  } catch (error) {
    console.error("Error creating contest user for predictor:", error);
    return null;
  }
};

export const registerPredictions = async (
  contestPredictorID: string,
  contestUserID: string,
  predictions: { quarter: string; predictions: string[] }[]
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/register-predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contest_predictor_id: contestPredictorID,
        contest_user_id: contestUserID,
        predictions,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error registering predictions:", error);
    return false;
  }
};

export const retrievePredictions = async (
  contestPredictorID: string,
  contestUserID: string
): Promise<RetrievePredictionsResponse[] | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/retrieve-predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        predictor_id: contestPredictorID,
        user_id: contestUserID,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as RetrievePredictionsResponse[];
  } catch (error) {
    console.error("Error retrieving predictions:", error);
    return null;
  }
};

// ── Bingo API ────────────────────────────────────────────

export const getGameInfoByContestBingoID = async (
  contestBingoID: string
): Promise<GetGameInfoByContestBingoIDResponse | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/contest/fetch-game-info-by-bingo-id?id=${encodeURIComponent(contestBingoID)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as GetGameInfoByContestBingoIDResponse;
  } catch (error) {
    console.error("Error fetching game info by bingo ID:", error);
    return null;
  }
};

export const createContestUserByBingoID = async (
  contestBingoID: string,
  phone: string,
  nickname: string
): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/create-user-for-bingo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contest_bingo_id: contestBingoID,
        phone,
        nickname,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.contest_user_id;
  } catch (error) {
    console.error("Error creating contest user for bingo:", error);
    return null;
  }
};

export const getContestBingoCards = async (
  contestBingoID: string,
  contestUserID: string
): Promise<GetContestBingoCardsResponse[] | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/get-bingo-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contest_bingo_id: contestBingoID,
        contest_user_id: contestUserID,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as GetContestBingoCardsResponse[];
  } catch (error) {
    console.error("Error getting bingo cards:", error);
    return null;
  }
};

export const getAnotherBingoCard = async (
  contestBingoCardID: string
): Promise<GetContestBingoCardsResponse | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/get-another-bingo-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contest_bingo_card_id: contestBingoCardID,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as GetContestBingoCardsResponse;
  } catch (error) {
    console.error("Error getting another bingo card:", error);
    return null;
  }
};

// ── Points API ───────────────────────────────────────────

export const fetchSportsIQPoints = async (
  contestUserID: string
): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/fetch-sportsiq-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contest_user_id: contestUserID }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const val = data.data;
    return (typeof val === "object" && val !== null ? val.points ?? 0 : val ?? 0) as number;
  } catch {
    return 0;
  }
};

export const fetchBarPoints = async (
  contestUserID: string,
  id: string,
  type: "bingo" | "predictor"
): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE_URL}/contest/fetch-bar-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contest_user_id: contestUserID, id, type }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const val = data.data;
    return (typeof val === "object" && val !== null ? val.points ?? 0 : val ?? 0) as number;
  } catch {
    return 0;
  }
};
