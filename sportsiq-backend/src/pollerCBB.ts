import express from "express";
import { config } from "./config";
import { startPollingCBBGames } from "./services/cbbService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`CBB poller listening on port ${config.port}`);
  startPollingCBBGames();
});
