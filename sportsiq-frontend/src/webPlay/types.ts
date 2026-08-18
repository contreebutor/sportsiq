export interface UserInfo {
  id: string;
  phone: string;
  name: string;
  avatar_url: string | null;
  points: number;
}

export interface TriviaQuestionPayload {
  gameId: number;
  questionNumber: number;
  questionIndex: number;
  totalQuestions: number;
  category: string;
  question: string;
  answers: string[];
  timeRemaining: number;
  totalTime: number;
}

export interface TriviaSelectionUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface TriviaAnswerSelection {
  answer: string;
  users: TriviaSelectionUser[];
  count: number;
}

export interface TriviaUserResult {
  userId: string;
  selectedAnswer: string | null;
  correct: boolean;
  pointsDelta: number;
  newPoints: number;
}

export interface TriviaResultPayload {
  gameId: number;
  questionNumber: number;
  questionIndex: number;
  totalQuestions: number;
  correctAnswer: string;
  userResults: TriviaUserResult[];
  funFact: string | null;
}

export interface TriviaLobbyPayload {
  gameId: number;
  countdown: number;
  /** Epoch ms of game start — authoritative wall-clock from server. */
  startTime?: number;
  players: { userId: string; name: string; avatarUrl: string | null }[];
  playerCount: number;
}

export interface TriviaGameEndPayload {
  gameId: number;
  leaderboard: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    score: number;
  }[];
  /** Epoch ms of the next game's start — authoritative wall-clock from server. */
  nextGameStartTime?: number;
}

export interface TriviaGameStatusPayload {
  gameId: number;
  inProgress: boolean;
  questionIndex: number;
  totalQuestions: number;
}

export type GamePhase =
  | "connecting"
  | "lobby"
  | "question"
  | "result"
  | "loading"
  | "game-end"
  | "waiting";
