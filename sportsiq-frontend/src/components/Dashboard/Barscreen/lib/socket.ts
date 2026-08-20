import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "http://localhost:8081";

let triviaSocket: Socket | null = null;

export function getBarTriviaSocket(): Socket {
  if (!triviaSocket) {
    triviaSocket = io(`${SOCKET_URL}/trivia`, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { role: "barscreen" },
    });
  }
  return triviaSocket;
}

export function disconnectBarSockets(): void {
  triviaSocket?.disconnect();
  triviaSocket = null;
}
