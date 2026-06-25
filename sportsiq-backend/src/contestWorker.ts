import express from "express";
import { config } from "./config";
import { handleContestGameQuarterEndAndStart } from "./services/contestService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`Contest worker listening on port ${config.port}`);
  handleContestGameQuarterEndAndStart();
});
