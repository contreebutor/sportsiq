import { signUp as signUpService } from "../services/authService";
import { Request, Response } from "express";

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields: email and password are required",
      });
    }

    const { id, error } = await signUpService(email, password);

    if (error) {
      return res.status(400).json({
        error: error.message || "Sign up failed",
      });
    }

    return res.status(201).json({
      message: "User created successfully",
      id: id,
    });
  } catch (error) {
    console.error("Sign up route error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
