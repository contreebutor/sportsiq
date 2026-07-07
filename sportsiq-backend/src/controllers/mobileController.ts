import { Request, Response } from "express";
import {
  signUpUser as signUpUserService,
  signInUser as signInUserService,
  updateUser as updateUserService,
  deleteAccount as deleteAccountService,
  uploadAvatarToStorage,
  updateTriviaPoints as updateTriviaPointsService,
  transferPoints as transferPointsService,
  fetchUserTier as fetchUserTierService,
} from "../services/mobileService";

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const signUpUser = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { phone, name, avatar_url } = req.body;
    if (phone === undefined || name === undefined || avatar_url === undefined) {
      return res
        .status(400)
        .json({ message: "Phone, name, and avatar URL are required" });
    }
    await signUpUserService(phone, name, avatar_url);
    return res.status(200).json({
      message: "User signed up successfully",
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    return res.status(500).json({
      message: "Error signing up user",
      error: error,
    });
  }
};

export const signInUser = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }
    const user = await signInUserService(phone);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User signed in successfully",
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar_url: user.avatarURL,
        points: user.points,
      },
    });
  } catch (error) {
    console.error(`Error signing in user: ${error}`);
    return res.status(500).json({
      message: "Error signing in user",
      error: error,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { user_id, name, avatar_url } = req.body;
    if (
      user_id === undefined ||
      name === undefined ||
      avatar_url === undefined
    ) {
      return res
        .status(400)
        .json({ message: "User ID, name, and avatar URL are required" });
    }
    await updateUserService(user_id, name, avatar_url);
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(`Error updating user: ${error}`);
    return res.status(500).json({
      message: "Error updating user",
      error: error,
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    await deleteAccountService(user_id);
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(`Error deleting account: ${error}`);
    return res.status(500).json({
      message: "Error deleting account",
      error: error,
    });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded. Send multipart form with field 'avatar'.",
      });
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
      });
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return res.status(400).json({
        message: "File too large. Maximum size is 2MB.",
      });
    }

    const avatarUrl = await uploadAvatarToStorage(file.buffer, file.mimetype);
    return res.status(200).json({
      message: "Avatar uploaded successfully",
      data: { avatar_url: avatarUrl },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return res.status(500).json({
      message: "Error uploading avatar",
      error: error,
    });
  }
};

export const updateTriviaPoints = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { user_id, difficulty, correction } = req.body;
    if (!user_id || !difficulty || correction === undefined) {
      return res
        .status(400)
        .json({ message: "User ID, difficulty, and correction are required" });
    }
    await updateTriviaPointsService(user_id, difficulty, correction);
    return res
      .status(200)
      .json({ message: "Trivia points updated successfully" });
  } catch (error) {
    console.error(`Error updating trivia points: ${error}`);
    return res.status(500).json({
      message: "Error updating trivia points",
      error: error,
    });
  }
};

export const transferPoints = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }
    const { source_phone, target_phone, points } = req.body;
    if (!source_phone || !target_phone || !points) {
      return res.status(400).json({ message: "All fields are required" });
    }
    await transferPointsService(source_phone, target_phone, points);
    return res.status(200).json({ message: "Points transferred successfully" });
  } catch (error) {
    console.error(`Error transferring points: ${error}`);
    return res.status(500).json({
      message: "Error transferring points",
      error: error,
    });
  }
};

export const fetchUserTier = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) {
      return res.status(400).json({ message: "user_id query param is required" });
    }
    const result = await fetchUserTierService(userId);
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return res.status(500).json({ message: "Error fetching user tier" });
  }
};

