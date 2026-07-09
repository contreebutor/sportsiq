import express from "express";
import { config } from "./config";
import { startTriviaGenerationWorker } from "./services/triviaGenerationService";

const app = express();

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.listen(config.port, () => {
  console.log(`Trivia generation worker listening on port ${config.port}`);
  startTriviaGenerationWorker();
});
