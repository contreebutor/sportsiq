export const MIN_POINTS_TO_PLAY = 50;
export const MAX_POINTS = 150; // 150 IQ max, 10 per second over 15s
export const TOTAL_TIME_S = 15;

export type GamePhase =
  | "connecting"
  | "lobby"
  | "question"
  | "result"
  | "loading"
  | "game-end";
