import express from "express";
import cors from "cors";
import manageRoutes from "./routes/manageRoute";
import authRoutes from "./routes/authRoute";
import contestRoutes from "./routes/contestRoute";
import twilioRoutes from "./routes/twilioRoute";
import mobileRoutes from "./routes/mobileRoute";
import barscreenRoutes from "./routes/barscreenRoute";
import joinRoutes from "./routes/joinRoute";
import webGameRoutes from "./routes/webGameRoute";

export function createApp() {
  const app = express();
  const corsOptions = {
    origin: [
      "http://localhost:5173",
      "https://sportsiq-frontend.vercel.app",
      "https://sportsiq-frontend-git-dev-sports-iq.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors());
  app.use(express.json());

  app.use("/v1/manage", manageRoutes);
  app.use("/v1/auth", authRoutes);
  app.use("/v1/contest", contestRoutes);
  app.use("/v1/phone", twilioRoutes);
  app.use("/v1/mobile", mobileRoutes);
  app.use("/v1/barscreen", barscreenRoutes);
  app.use("/v1/join", joinRoutes);
  app.use("/v1/play", webGameRoutes);

  return app;
}
