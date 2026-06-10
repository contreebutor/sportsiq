import express from "express";
import { config } from "./config";
import { startPollingNHLGames } from "./services/nhlService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`NHL poller listening on port ${config.port}`);
  startPollingNHLGames();
});
