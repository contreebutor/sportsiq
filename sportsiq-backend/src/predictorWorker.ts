import express from "express";
import { config } from "./config";
import { startPredictorWorker } from "./services/predictorWorkerService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`Predictor worker listening on port ${config.port}`);
  startPredictorWorker();
});
