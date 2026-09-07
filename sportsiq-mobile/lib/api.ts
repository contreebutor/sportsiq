import { config } from "@/config";
import { type UserInfo } from "@/store/user";

const API_BASE_URL = config.apiBaseUrl;

// Review/test login is configured per build via env, never hardcoded
const APPLE_REVIEW_PHONE = process.env.EXPO_PUBLIC_REVIEW_PHONE || null;
const TEST_PHONES = (process.env.EXPO_PUBLIC_TEST_PHONES ?? "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const APPLE_REVIEW_OTP = process.env.EXPO_PUBLIC_REVIEW_OTP
  ? Number(process.env.EXPO_PUBLIC_REVIEW_OTP)
  : null;

export const needsOtp = async (phone: string): Promise<boolean> => {
  if (phone === APPLE_REVIEW_PHONE || TEST_PHONES.includes(phone)) return true;
  try {
    const res = await fetch(
      `${API_BASE_URL}/phone/needs-otp?phone=${encodeURIComponent(phone)}`
    );
    if (!res.ok) return true;
    const data = await res.json();
    return data.requiresOtp ?? true;
  } catch {
    return true;
  }
};

export interface UserTierResponse {
  tier: string;
  points: number;
  barChampionCount: number;
}

export const fetchUserTier = async (
  userId: string
): Promise<UserTierResponse | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/mobile/user/tier?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export interface GameStatusResponse {
  phase: string;
  gameId: number;
  playerCount: number;
  lobbyCountdown: number;
  questionIndex: number;
  totalQuestions: number;
  nextGameIn: number;
}

export const fetchGameStatus = async (): Promise<GameStatusResponse | null> => {
  try {
    const res = await fetch(`${config.socketUrl}/game/status`);
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export const createOtp = async (phone: string): Promise<void> => {
  if (phone === APPLE_REVIEW_PHONE) return;
  if (TEST_PHONES.includes(phone)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/phone/create-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
    }
  } catch {
    throw new Error("Failed to send code");
  }
};

export const verifyOtp = async (
  phone: string,
  otp: number
): Promise<boolean> => {
  if (phone === APPLE_REVIEW_PHONE) return otp === APPLE_REVIEW_OTP;
  if (TEST_PHONES.includes(phone)) return otp === APPLE_REVIEW_OTP;
  try {
    const res = await fetch(`${API_BASE_URL}/phone/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    if (!res.ok) {
      return false;
    }
    const resJson = await res.json();
    return resJson.data;
  } catch {
    throw new Error("Failed to verify code");
  }
};

export const uploadAvatar = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("avatar", {
      uri: imageUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    const res = await fetch(`${API_BASE_URL}/mobile/user/upload-avatar`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Failed to upload avatar");
    }
    const resJson = await res.json();
    return resJson.data.avatar_url;
  } catch {
    throw new Error("Failed to upload avatar");
  }
};

export const createUser = async (
  phone: string,
  name: string,
  avatar_url: string | null
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/user/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, avatar_url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
    }
  } catch {
    throw new Error("Failed to create user");
  }
};

export const updateUser = async (
  user_id: string,
  name: string,
  avatar_url: string | null
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/user/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, name, avatar_url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
    }
  } catch {
    throw new Error("Failed to update user");
  }
};

export const deleteAccount = async (user_id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/user/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Failed to delete account");
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Failed to delete account");
  }
};

export const fetchUser = async (phone: string): Promise<UserInfo | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/user/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const resJson = await res.json();
    if (!res.ok) {
      const err = resJson.message ?? "Failed to fetch user";
      console.error(err);
      return null;
    }
    return resJson.data;
  } catch {
    return null;
  }
};

export const updateTriviaPoints = async (
  user_id: string,
  difficulty: string,
  correction: boolean
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/trivia/update-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, difficulty, correction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Trivia update-points failed", err);
    }
  } catch (e) {
    console.error("Trivia update-points error", e);
  }
};

export interface TransferPointsResponse {
  message: string;
}

export const transferPoints = async (
  source_phone: string,
  target_phone: string,
  points: number
): Promise<TransferPointsResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/user/transfer-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_phone, target_phone, points }),
    });
    const resJson = (await res
      .json()
      .catch(() => ({}))) as TransferPointsResponse;
    if (!res.ok) {
      console.error("Transfer points failed", resJson);
      throw new Error(resJson.message);
    }
    return resJson;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Failed to transfer points");
  }
};

// ──────────────────────────────────────────────
// User stats (Phase 4 — Settings modal)
// ──────────────────────────────────────────────

export interface UserStatsResponse {
  record: string;
  winRate: number;
  streak: number;
  rank: number;
  wins: number;
  losses: number;
}

export const fetchUserStats = async (
  userId: string
): Promise<UserStatsResponse | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/mobile/user/stats?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────
// Picks flow (Phase 4)
// ──────────────────────────────────────────────

export interface FeaturedGameResponse {
  id: string;
  game_id: string;
  home_team: string;
  away_team: string;
  pick_question: string;
  start_time: string;
  status: string;
}

export const fetchFeaturedGame = async (): Promise<FeaturedGameResponse | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/picks/featured-game`);
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export interface SubmitPickResponse {
  pickId: string;
  status: string;
}

export const submitPick = async (
  userId: string,
  featuredGameId: string,
  choice: "yes" | "no",
  multiplier: 1 | 2 = 1
): Promise<SubmitPickResponse | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/picks/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        featured_game_id: featuredGameId,
        choice,
        multiplier,
      }),
    });
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
}

export const fetchGlobalLeaderboard = async (
  userId?: string
): Promise<LeaderboardResponse | null> => {
  try {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(
      `${API_BASE_URL}/mobile/leaderboard/global${params}`
    );
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export const fetchBarLeaderboard = async (
  venueId?: string,
  userId?: string
): Promise<LeaderboardResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (venueId) params.set("venue_id", venueId);
    if (userId) params.set("user_id", userId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mobile/leaderboard/bar${qs}`);
    if (!res.ok) return null;
    const resJson = await res.json();
    return resJson.data ?? null;
  } catch {
    return null;
  }
};

export interface FeaturedPredictionGame {
  game_uuid: string;
  sports_game: {
    date_time: string;
    status: string;
    teams: {
      home: {
        key: string;
        logo_url: string | null;
        primary_color: string | null;
        wins: number;
        losses: number;
      };
      away: {
        key: string;
        logo_url: string | null;
        primary_color: string | null;
        wins: number;
        losses: number;
      };
    };
  };
  picks: {
    id: string;
    pick_question: string;
    status: string;
    correct_answer: "yes" | "no" | null;
    user_pick: "yes" | "no" | null;
  }[];
}

export const fetchFeaturedPredictions = async (
  userId: string | undefined
): Promise<FeaturedPredictionGame[]> => {
  try {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(
      `${API_BASE_URL}/mobile/picks/featured-predictions${qs}`
    );
    if (!res.ok) return [];
    const resJson = await res.json();
    return resJson.data ?? [];
  } catch {
    return [];
  }
};
