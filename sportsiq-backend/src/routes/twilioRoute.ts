import { Router } from "express";
import {
  createOTP,
  verifyOTP,
  needsOTP,
  sendSMS,
} from "../controllers/twilioController";

const router = Router();

router.post("/create-otp", createOTP);
router.post("/verify-otp", verifyOTP);
router.get("/needs-otp", needsOTP);
router.post("/send-sms", sendSMS);

export default router;
