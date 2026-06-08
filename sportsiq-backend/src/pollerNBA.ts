import express from "express";
import { config } from "./config";
import { startPollingNBAGames } from "./services/nbaService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`NBA poller listening on port ${config.port}`);
  startPollingNBAGames();
});
