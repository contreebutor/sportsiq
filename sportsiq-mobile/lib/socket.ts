import { io, Socket } from "socket.io-client";
import { config } from "@/config";

let triviaSocket: Socket | null = null;

export function getTriviaSocket(): Socket {
  if (!triviaSocket) {
    triviaSocket = io(`${config.socketUrl}/trivia`, {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return triviaSocket;
}

export function disconnectTriviaSocket(): void {
  if (triviaSocket) {
    triviaSocket.disconnect();
    triviaSocket = null;
  }
}

