import dotenv from "dotenv";

dotenv.config();

export const config = {
  url: process.env.URL || "http://localhost",
  port: parseInt(process.env.PORT || "8080", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  sportsData: {
    apiUrl: `${process.env.SPORTSDATA_API_URL || ""}/${
      process.env.SPORTSDATA_API_VERSION || "v3"
    }`,
    apiKey: process.env.SPORTSDATA_API_KEY || "",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_API_SECRET_KEY || "",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    serviceSid: process.env.TWILIO_SERVICE_SID || "",
    from: process.env.TWILIO_FROM_NUMBER || "",
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_AI_KEY || "",
  },
  defaultProfilePassword: process.env.DEFAULT_PROFILE_PASSWORD || "",
  allowedSportsbooks: ["DraftKings", "FanDuel", "BetMGM", "Caesars"],
};
