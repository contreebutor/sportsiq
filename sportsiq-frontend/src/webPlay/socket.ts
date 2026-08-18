import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./constants";

let triviaSocket: Socket | null = null;

export function getWebTriviaSocket(): Socket {
  if (!triviaSocket) {
    triviaSocket = io(`${SOCKET_URL}/trivia`, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return triviaSocket;
}

export function disconnectWebTriviaSocket(): void {
  triviaSocket?.disconnect();
  triviaSocket = null;
}
