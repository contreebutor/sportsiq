import { supabase } from "../utils/supabase";
import { v4 as uuidv4 } from "uuid";

import {
  fetchSportsIQPoints,
  upsertMultipleSportsIQPoints,
} from "./generalService";

const BUCKET_NAME = "sportsiq_mobile";
const FOLDER_PATH = "user_avatars";

export const signUpUser = async (
  phone: string,
  name: string,
  avatarURL: string
): Promise<void> => {
  try {
    await insertNewUser(phone, name, avatarURL);

    let points = (await fetchSportsIQPoints(phone)) ?? 0;
    points += 1000;

    await upsertMultipleSportsIQPoints([{ phone, points }]);
  } catch (error) {
    const message = `Error signing up user: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const signInUser = async (
  phone: string
): Promise<{
  id: string;
  phone: string;
  name: string;
  avatarURL: string;
  points: number;
} | null> => {
  try {
    const user = await fetchUser({ phone });
    if (!user) {
      return null;
    }
    await updateLastLoginAt(user.id);
    const points = (await fetchSportsIQPoints(phone)) ?? 0;

    // Upcoming TODO: implement streak logic

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatarURL: user.avatarURL,
      points: points,
    };
  } catch (error) {
    const message = `Error signing in user: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const deleteAccount = async (userID: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("m_users")
      .delete()
      .eq("id", userID);
    if (error) {
      const message = `Error deleting account in database: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }
  } catch (error) {
    const message = `Error deleting account: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const updateUser = async (
  userID: string,
  name: string,
  avatarURL: string
): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const dataToUpdate = {
      name,
      avatar_url: avatarURL,
      updated_at: now,
    };
    const { error } = await supabase
      .from("m_users")
      .update(dataToUpdate)
      .eq("id", userID);
    if (error) {
      const message = `Error updating user in database: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }
    return;
  } catch (error) {
    const message = `Error updating user: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const uploadAvatarToStorage = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  const uuid = uuidv4();
  const fileExt = mimeType.split("/")[1] || "jpg";
  const path = `${FOLDER_PATH}/${uuid}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Error uploading avatar to storage:", error);
    throw new Error("Failed to upload avatar: " + error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return publicUrl;
};

export const updateTriviaPoints = async (
  userID: string,
  difficulty: "easy" | "medium" | "hard",
  correction: boolean
): Promise<void> => {
  const triviaPoints = {
    easy: 50,
    medium: 100,
    hard: 200,
  };

  try {
    const user = await fetchUser({ userID });
    if (!user) {
      throw new Error("User not found");
    }
    const phone = user.phone;
    let points = (await fetchSportsIQPoints(phone)) ?? 0;
    if (correction) {
      points += triviaPoints[difficulty];
    } else {
      points = Math.max(0, points - 50);
    }
    await upsertMultipleSportsIQPoints([{ phone, points }]);
  } catch (error) {
    const message = `Error updating trivia points: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

export const computeTier = (points: number): string => {
  if (points >= 150_000) return "legend";
  if (points >= 50_000) return "gold";
  if (points >= 10_000) return "silver";
  return "bronze";
};

export const fetchUserTier = async (
  userId: string
): Promise<{ tier: string; points: number; barChampionCount: number }> => {
  const { data, error } = await supabase
    .from("m_users")
    .select("phone, bar_champion_count")
    .eq("id", userId)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`User not found: ${error?.message}`);
  }

  const points = (await fetchSportsIQPoints(data.phone)) ?? 0;
  const tier = computeTier(points);

  // Keep tier_level in sync
  await supabase.from("m_users").update({ tier_level: tier }).eq("id", userId);

  return {
    tier,
    points,
    barChampionCount: data.bar_champion_count ?? 0,
  };
};

export const transferPoints = async (
  sourcePhone: string,
  targetPhone: string,
  points: number
) => {
  try {
    if (points < 50) {
      throw new Error("Points to transfer must be at least 50.");
    }
    const [sourcePointsResult, targetPointsResult] = await Promise.all([
      fetchSportsIQPoints(sourcePhone),
      fetchSportsIQPoints(targetPhone),
    ]);
    const sourcePoints = sourcePointsResult ?? 0;
    const targetPoints = targetPointsResult ?? 0;
    let pointsToTransfer = Math.min(points, sourcePoints);
    const fees = Math.ceil(pointsToTransfer * 0.03);
    pointsToTransfer -= fees;
    if (pointsToTransfer <= 0) {
      throw new Error(
        "Not enough points to transfer. Minimum transfer is 1 point."
      );
    }
    await upsertMultipleSportsIQPoints([
      { phone: sourcePhone, points: sourcePoints - pointsToTransfer - fees },
      { phone: targetPhone, points: targetPoints + pointsToTransfer },
    ]);
  } catch (error) {
    const message = `Error transferring points: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};


/**
 * +------------------------------------------+
 * |                                          |
 * |                                          |
 * |                                          |
 * |                                          |
 * |            Inline functions              |
 * |                                          |
 * |                                          |
 * |                                          |
 * +------------------------------------------+
 */

const insertNewUser = async (
  phone: string,
  name: string,
  avatarURL: string
): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const dataToInsert = {
      phone,
      name,
      avatar_url: avatarURL,
      updated_at: now,
      last_login_at: now,
    };

    const { error } = await supabase.from("m_users").insert(dataToInsert);

    if (error) {
      const message = `Error inserting new user: ${error}`;
      console.error(message);
      throw new Error(message);
    }

    return;
  } catch (error) {
    const message = `Error inserting new user: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

const fetchUser = async (
  req:
    | {
        phone: string;
      }
    | {
        userID: string;
      }
): Promise<{
  id: string;
  phone: string;
  name: string;
  avatarURL: string;
} | null> => {
  try {
    const query = supabase
      .from("m_users")
      .select("id, phone, name, avatar_url")
      .limit(1);

    if ("phone" in req) {
      query.eq("phone", req.phone);
    } else if ("userID" in req) {
      query.eq("id", req.userID);
    }

    const { data, error } = await query;
    if (error) {
      const message = `Error fetching user from database: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }
    if (!data || data.length === 0) {
      return null;
    }
    const user = data[0];
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatarURL: user.avatar_url,
    };
  } catch (error) {
    const message = `Error fetching user: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

const updateLastLoginAt = async (userID: string): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("m_users")
      .update({ last_login_at: now })
      .eq("id", userID);
    if (error) {
      const message = `Error updating last login at in database: ${error.message}`;
      console.error(message);
      throw new Error(message);
    }
    return;
  } catch (error) {
    const message = `Error updating last login at: ${error}`;
    console.error(message);
    throw new Error(message);
  }
};

