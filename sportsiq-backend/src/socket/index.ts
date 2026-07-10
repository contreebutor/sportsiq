import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { TriviaGameManager } from "./triviaGame";
import { PrivateGameManager } from "./privateGame";

// Exposed for REST endpoints (e.g. Live Now game status, barscreen)
export let triviaManagerRef: TriviaGameManager | null = null;

export function initSocket(server: HttpServer): void {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10_000, // Send ping every 10s (default 25s) — detect drops faster
    pingTimeout: 15_000, // Wait 15s for pong before disconnecting (default 20s)
    connectTimeout: 10_000, // 10s to complete handshake
  });

  const triviaNamespace = io.of("/trivia");
  const triviaManager = new TriviaGameManager(triviaNamespace);
  triviaManager.start();

  triviaManagerRef = triviaManager;

  // Private game rooms share the /trivia namespace
  const privateManager = new PrivateGameManager(triviaNamespace);
  triviaNamespace.on("connection", (socket) => {
    privateManager.setupHandlers(socket);
  });

  const shutdown = () => {
    console.log("Shutting down socket managers...");
    io.close();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("Socket.IO initialized with /trivia namespace");
}
