import http from "http";
import { config } from "./config";
import { initSocket, triviaManagerRef } from "./socket";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/game/status") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!triviaManagerRef) {
      res.writeHead(503);
      res.end(JSON.stringify({ message: "Game server not ready" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ data: triviaManagerRef.getStatus() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

initSocket(server);

server.listen(config.port, () => {
  console.log(`Socket server is running on ${config.url}:${config.port}`);
});
