import express from "express";
import { config } from "./config";
import { startPollingNFLGames } from "./services/nflService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`NFL poller listening on port ${config.port}`);
  startPollingNFLGames();
});
