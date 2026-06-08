import { Request, Response } from "express";
import {
  createOTP as createOTPService,
  verifyOTP as verifyOTPService,
  sendSMS as sendSMSService,
  needsOTP as needsOTPService,
} from "../services/twilioService";

export const createOTP = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const created = await createOTPService(phone);

    return res.status(200).json({ data: created });
  } catch (error) {
    console.error("Error creating OTP:", error);
    return res.status(500).json({
      message: "Error creating OTP",
      error: error,
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    const verified = await verifyOTPService(phone, otp);

    return res.status(200).json({ data: verified });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "Error verifying OTP",
      error: error,
    });
  }
};

export const needsOTP = async (req: Request, res: Response) => {
  try {
    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ error: "Phone query param is required" });
    }
    const requiresOtp = await needsOTPService(phone);
    return res.status(200).json({ requiresOtp });
  } catch (error) {
    console.error("Error checking OTP requirement:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendSMS = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }
    const sent = await sendSMSService(phone, message);
    return res.status(200).json({ data: sent });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({
      message: "Error sending SMS",
      error: error,
    });
  }
};
